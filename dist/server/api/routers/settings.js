"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsManager = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const node_localstorage_1 = require("node-localstorage");
const types_1 = require("../../../shared/types");
const stream_1 = require("stream");
const observable_1 = require("@trpc/server/observable");
const localstorage = new node_localstorage_1.LocalStorage('./settings');
let data = {
    notifications: {
        adv_notifications: false,
        sources: [],
        pass_pos_filter: false,
        pos_filter: new Map(),
        pass_neg_filter: false,
        neg_filter: new Map(),
        symbol: 'NO_MATCH',
        actions: {
            B_1: 50,
            S_1: 50,
        },
    },
    dash: {
        actions: {
            B_1: 5000,
            B_2: 20000,
            B_3: 100000,
            S_1: 5000,
            S_2: 20000,
            S_3: 100000,
        },
    },
    symbol_keys: new Map(),
    symbols: new Map(),
};
function replacer(key, value) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()),
        };
    }
    else {
        return value;
    }
}
function reviver(key, value) {
    if (typeof value === 'object' && value !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if ("dataType" in value && value.dataType === 'Map') {
            if ("value" in value && Array.isArray(value.value)) {
                return new Map(value.value);
            }
        }
    }
    return value;
}
data = JSON.parse(localstorage.getItem('settings') || JSON.stringify(data, replacer), reviver);
class MyEventEmitter extends stream_1.EventEmitter {
}
const ee = new MyEventEmitter();
exports.settingsManager = (0, trpc_1.createTRPCRouter)({
    onUpdate: trpc_1.publicProcedure.subscription(() => {
        // return an `observable` with a callback which is triggered immediately
        return (0, observable_1.observable)((emit) => {
            const onUpdate = (d) => {
                data = d;
                localstorage.setItem('settings', JSON.stringify(d, replacer));
                emit.next(d);
            };
            // trigger `onAdd()` when `add` is triggered in our event emitter
            ee.on('update', onUpdate);
            // unsubscribe function when client disconnects or stops subscribing
            return () => {
                ee.off('update', onUpdate);
            };
        });
    }),
    getSettingsQuery: trpc_1.publicProcedure.query(() => {
        return data;
    }),
    getSettings: trpc_1.publicProcedure.
        mutation(() => {
        return data;
    }),
    updateSymbols: trpc_1.publicProcedure
        // Create zod input for this type  [symbol: string]: {future_id: string; status: status;active: boolean;};
        .input(zod_1.z.map(zod_1.z.string(), zod_1.z.object({
        future_id: zod_1.z.string(),
        status: zod_1.z.string().and(zod_1.z.enum(types_1.statusObj)),
        active: zod_1.z.boolean(),
    })))
        .mutation(({ input }) => {
        // TODO: SLOW
        // This is dumb
        input.forEach((value, key) => {
            data.symbols.set(key, value);
        });
        ee.emit('update', data);
    }),
    addSymbol: trpc_1.publicProcedure
        .input(zod_1.z.object({
        symbol: zod_1.z.string(),
    }))
        .mutation(({ input }) => {
        data.symbols.set(input.symbol.toUpperCase(), {
            future_id: input.symbol.toUpperCase(),
            status: 'UNKNOWN',
            active: true,
        });
        ee.emit('update', data);
    }),
    removeSymbol: trpc_1.publicProcedure
        .input(zod_1.z.object({
        symbol: zod_1.z.string(),
    }))
        .mutation(({ input }) => {
        data.symbols.delete(input.symbol.toUpperCase());
        data.symbol_keys.delete(input.symbol.toUpperCase());
        ee.emit('update', data);
    }),
    addSymbolKey: trpc_1.publicProcedure
        .input(zod_1.z.object({
        symbol: zod_1.z.string(),
        keyword: zod_1.z.string(),
    }))
        .mutation(({ input }) => {
        const keys = data.symbol_keys.get(input.symbol.toUpperCase());
        if (!keys) {
            data.symbol_keys.set(input.symbol.toUpperCase(), [
                input.keyword.toUpperCase(),
            ]);
            ee.emit('update', data);
            return;
        }
        if (!keys.includes(input.keyword.toUpperCase())) {
            keys.push(input.keyword.toUpperCase());
        }
        ee.emit('update', data);
    }),
    removeSymbolKey: trpc_1.publicProcedure
        .input(zod_1.z.object({
        symbol: zod_1.z.string(),
        keyword: zod_1.z.string(),
    }))
        .mutation(({ input }) => {
        const keys = data.symbol_keys.get(input.symbol.toUpperCase());
        if (!keys) {
            return;
        }
        data.symbol_keys.set(input.symbol.toUpperCase(), keys.filter((key) => key !== input.keyword.toUpperCase()));
        ee.emit('update', data);
    }),
    addPosKeyword: trpc_1.publicProcedure
        .input(zod_1.z.object({
        source: zod_1.z.string().and(zod_1.z.enum(types_1.sourceObj)).optional(),
        keyword: zod_1.z.string(),
    }))
        .mutation(({ input }) => {
        if (input.source) {
            const pos_filter = data.notifications.pos_filter.get(input.source);
            if (!pos_filter) {
                data.notifications.pos_filter.set(input.source, [
                    input.keyword.toUpperCase(),
                ]);
                ee.emit('update', data);
                return;
            }
            if (!pos_filter.includes(input.keyword.toUpperCase())) {
                pos_filter.push(input.keyword.toUpperCase());
            }
        }
        else {
            data.notifications.pos_filter.forEach((value) => {
                if (!value.includes(input.keyword.toUpperCase())) {
                    value.push(input.keyword.toUpperCase());
                }
            });
        }
        ee.emit('update', data);
    }),
    removePosKeyword: trpc_1.publicProcedure
        .input(zod_1.z.object({
        source: zod_1.z.string().and(zod_1.z.enum(types_1.sourceObj)).optional(),
        keyword: zod_1.z.string(),
    }))
        .mutation(({ input }) => {
        if (input.source) {
            const pos_filter = data.notifications.pos_filter.get(input.source);
            if (!pos_filter) {
                return;
            }
            data.notifications.pos_filter.set(input.source, pos_filter.filter((key) => key !== input.keyword.toUpperCase()));
        }
        else {
            data.notifications.pos_filter.forEach((value, key) => {
                data.notifications.pos_filter.set(key, value.filter((key) => key !== input.keyword.toUpperCase()));
            });
        }
        ee.emit('update', data);
    }),
    addNegKeyword: trpc_1.publicProcedure
        .input(zod_1.z.object({
        source: zod_1.z.string().and(zod_1.z.enum(types_1.sourceObj)).optional(),
        keyword: zod_1.z.string(),
    }))
        .mutation(({ input }) => {
        if (input.source) {
            const neg_filter = data.notifications.neg_filter.get(input.source);
            if (!neg_filter) {
                data.notifications.neg_filter.set(input.source, [
                    input.keyword.toUpperCase(),
                ]);
                ee.emit('update', data);
                return;
            }
            if (!neg_filter.includes(input.keyword.toUpperCase())) {
                neg_filter.push(input.keyword.toUpperCase());
            }
            neg_filter;
        }
        else {
            data.notifications.neg_filter.forEach((value) => {
                if (!value.includes(input.keyword.toUpperCase())) {
                    value.push(input.keyword.toUpperCase());
                }
            });
        }
        ee.emit('update', data);
    }),
    removeNegKeyword: trpc_1.publicProcedure
        .input(zod_1.z.object({
        source: zod_1.z.string().and(zod_1.z.enum(types_1.sourceObj)).optional(),
        keyword: zod_1.z.string(),
    }))
        .mutation(({ input }) => {
        if (input.source) {
            const neg_filter = data.notifications.neg_filter.get(input.source);
            if (!neg_filter) {
                return;
            }
            data.notifications.neg_filter.set(input.source, neg_filter.filter((key) => key !== input.keyword.toUpperCase()));
        }
        else {
            data.notifications.neg_filter.forEach((value, key) => {
                data.notifications.neg_filter.set(key, value.filter((key) => key !== input.keyword.toUpperCase()));
            });
        }
        ee.emit('update', data);
    }),
    addSource: trpc_1.publicProcedure
        .input(zod_1.z.object({
        source: zod_1.z.string().and(zod_1.z.enum(types_1.sourceObj)),
    }))
        .mutation(({ input }) => {
        if (!data.notifications.sources.includes(input.source)) {
            data.notifications.sources.push(input.source);
        }
        ee.emit('update', data);
    }),
    removeSource: trpc_1.publicProcedure
        .input(zod_1.z.object({
        source: zod_1.z.string().and(zod_1.z.enum(types_1.sourceObj)),
    }))
        .mutation(({ input }) => {
        data.notifications.sources = data.notifications.sources.filter((source) => source !== input.source);
        ee.emit('update', data);
    }),
    setNotificationAction: trpc_1.publicProcedure
        .input(zod_1.z.object({
        key: zod_1.z.string().and(zod_1.z.enum(['B_1', 'S_1'])),
        amount: zod_1.z.number(),
    }))
        .mutation(({ input }) => {
        data.notifications.actions[input.key] = input.amount;
        ee.emit('update', data);
    }),
    setDashAction: trpc_1.publicProcedure
        .input(zod_1.z.object({
        key: zod_1.z.string().and(zod_1.z.enum(['B_1', 'B_2', 'B_3', 'S_1', 'S_2', 'S_3'])),
        amount: zod_1.z.number(),
    }))
        .mutation(({ input }) => {
        data.dash.actions[input.key] = input.amount;
        ee.emit('update', data);
    }),
    setPosFilter: trpc_1.publicProcedure
        .input(zod_1.z.object({
        state: zod_1.z.boolean(),
    }))
        .mutation(({ input }) => {
        data.notifications.pass_pos_filter = input.state;
        ee.emit('update', data);
    }),
    setNegFilter: trpc_1.publicProcedure
        .input(zod_1.z.object({
        state: zod_1.z.boolean(),
    }))
        .mutation(({ input }) => {
        data.notifications.pass_neg_filter = input.state;
        ee.emit('update', data);
    }),
    setSymbolMatch: trpc_1.publicProcedure
        .input(zod_1.z.object({
        sym_match: zod_1.z.string().and(zod_1.z.enum(['MATCH_LOOKUP', 'ANY_MATCH', 'NO_MATCH'])),
    }))
        .mutation(({ input }) => {
        data.notifications.symbol = input.sym_match;
        ee.emit('update', data);
    })
});
