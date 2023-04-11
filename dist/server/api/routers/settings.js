"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsManager = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const node_localstorage_1 = require("node-localstorage");
const types_1 = require("../../../shared/types");
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
            B: 50,
            S: 50,
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
        if (value.dataType === 'Map') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
            return new Map(value.value);
        }
    }
    return value;
}
data = JSON.parse(localstorage.getItem('settings') || JSON.stringify(data, replacer), reviver);
exports.settingsManager = (0, trpc_1.createTRPCRouter)({
    getSettings: trpc_1.publicProcedure.query(() => {
        localstorage.setItem('settings', JSON.stringify(data, replacer));
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
        data.symbols = input;
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
    }),
    removeSymbol: trpc_1.publicProcedure
        .input(zod_1.z.object({
        symbol: zod_1.z.string(),
    }))
        .mutation(({ input }) => {
        data.symbols.delete(input.symbol.toUpperCase());
        data.symbol_keys.delete(input.symbol.toUpperCase());
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
            return;
        }
        if (!keys.includes(input.keyword.toUpperCase())) {
            keys.push(input.keyword.toUpperCase());
        }
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
    }),
    addSource: trpc_1.publicProcedure
        .input(zod_1.z.object({
        source: zod_1.z.string().and(zod_1.z.enum(types_1.sourceObj)),
    }))
        .mutation(({ input }) => {
        if (!data.notifications.sources.includes(input.source)) {
            data.notifications.sources.push(input.source);
        }
    }),
    removeSource: trpc_1.publicProcedure
        .input(zod_1.z.object({
        source: zod_1.z.string().and(zod_1.z.enum(types_1.sourceObj)),
    }))
        .mutation(({ input }) => {
        data.notifications.sources = data.notifications.sources.filter((source) => source !== input.source);
    }),
    setNotificationAction: trpc_1.publicProcedure
        .input(zod_1.z.object({
        key: zod_1.z.string().and(zod_1.z.enum(['B', 'S'])),
        amount: zod_1.z.number(),
    }))
        .mutation(({ input }) => {
        data.notifications.actions[input.key] = input.amount;
    }),
    setDashAction: trpc_1.publicProcedure
        .input(zod_1.z.object({
        key: zod_1.z.string().and(zod_1.z.enum(['B_1', 'B_2', 'B_3', 'S_1', 'S_2', 'S_3'])),
        amount: zod_1.z.number(),
    }))
        .mutation(({ input }) => {
        data.dash.actions[input.key] = input.amount;
    }),
});
