"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.treeofalpha = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const observable_1 = require("@trpc/server/observable");
const events_1 = __importDefault(require("events"));
const types_1 = require("../../../shared/types");
const messageParse_1 = require("../../../shared/messageParse");
const node_fetch_1 = __importDefault(require("node-fetch"));
const env_1 = require("@next/env");
(0, env_1.loadEnvConfig)('./', process.env.NODE_ENV !== 'production');
class MyEventEmitter extends events_1.default {
}
// source: "Blog" / source: "Binance EN" / source: "Upbit" / source: "usGov"
const ee = new MyEventEmitter();
exports.treeofalpha = (0, trpc_1.createTRPCRouter)({
    getImageUrl: trpc_1.publicProcedure
        .input(zod_1.z.object({
        symbol: zod_1.z.string()
    }))
        .mutation(async ({ input }) => {
        try {
            const response = await (0, node_fetch_1.default)(`https://api.chart-img.com/v1/tradingview/mini-chart?width=500&height=300&key=${process.env.IMAGE_KEY}`, {
                method: 'GET',
                headers: {
                    contentType: 'image/jpeg',
                },
            });
            console.log(response.body);
            const blob = await response.blob();
            console.log(blob);
            return blob;
        }
        catch (e) {
            return undefined;
        }
    }),
    getMessages: trpc_1.publicProcedure.query(async () => {
        const res = await (0, node_fetch_1.default)('https://news.treeofalpha.com/api/news?limit=250', {
            headers: {
                Cookie: `tree_login_cookie=${process.env.TREE_COOKIE}`,
            },
        });
        // Typecheck that the API returns a response we expect
        const updatesAPI = zod_1.z
            .array(zod_1.z.object({
            title: zod_1.z.string(),
            source: zod_1.z.string(),
            url: zod_1.z.string(),
            time: zod_1.z.number(),
            _id: zod_1.z.string(),
            symbols: zod_1.z.array(zod_1.z.string()).optional(),
            icon: zod_1.z.string().optional(),
            image: zod_1.z.string().optional(),
        }))
            .parse(await res.json());
        // Cast to unified type
        const updates = updatesAPI.map((update) => {
            return {
                ...(0, messageParse_1.parseTitle)(update.title),
                source: (0, messageParse_1.parseSource)(update.source),
                url: update.url,
                time: update.time,
                _id: update._id,
                symbols: (0, messageParse_1.parseSymbols)(update.symbols ? update.symbols : []),
                icon: update.icon,
                image: update.image,
            };
        });
        return updates;
    }),
    onMessage: trpc_1.publicProcedure.subscription(() => {
        // return an `observable` with a callback which is triggered immediately
        return (0, observable_1.observable)((emit) => {
            const onMessage = (data) => {
                // emit data to client
                emit.next(data);
            };
            // trigger `onAdd()` when `add` is triggered in our event emitter
            ee.on('message', onMessage);
            // unsubscribe function when client disconnects or stops subscribing
            return () => {
                ee.off('message', onMessage);
            };
        });
    }),
    message: trpc_1.publicProcedure
        .input(zod_1.z.object({
        title: zod_1.z.string(),
        body: zod_1.z.string(),
        source: zod_1.z.string().and(zod_1.z.enum(types_1.sourceObj)),
        url: zod_1.z.string(),
        time: zod_1.z.number(),
        _id: zod_1.z.string(),
        symbols: zod_1.z.array(zod_1.z.string()),
        icon: zod_1.z.string().nullish(),
        image: zod_1.z.string().nullish(),
    }))
        .mutation(({ input }) => {
        ee.emit('message', input);
        return input;
    }),
});
