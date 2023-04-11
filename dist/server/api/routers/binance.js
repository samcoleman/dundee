"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.binance = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const binance_1 = require("binance");
const types_1 = require("../../../shared/types");
const client = new binance_1.MainClient({
    api_secret: process.env.BINANCE_SECRET,
    api_key: process.env.BINANCE_KEY,
    baseUrl: "https://testnet.binance.vision"
});
exports.binance = (0, trpc_1.createTRPCRouter)({
    status: trpc_1.publicProcedure
        .mutation(async () => {
        return await client.testConnectivity();
    }),
    checkSymbols: trpc_1.publicProcedure
        .input(zod_1.z.map(zod_1.z.string(), zod_1.z.object({
        future_id: zod_1.z.string(),
        status: zod_1.z.string().and(zod_1.z.enum(types_1.statusObj)),
        active: zod_1.z.boolean(),
    })))
        .mutation(async ({ input }) => {
        const symbolStatus = await client.getExchangeInfo();
        input.forEach((symbol, key) => {
            const symExchange = symbolStatus.symbols.find((sym) => sym.symbol === key);
            if (!symExchange) {
                symbol.status = 'NOT_FOUND';
            }
            else {
                if (symExchange.status === 'TRADING') {
                    symbol.status = 'TRADING';
                }
                else {
                    symbol.status = 'DOWN';
                }
            }
        });
        return input;
    }),
    order: trpc_1.publicProcedure
        .input(zod_1.z.object({
        symbol: zod_1.z.string(),
        side: zod_1.z.string().and(zod_1.z.enum(['BUY', 'SELL'])),
        type: zod_1.z.string(),
        quoteOrderQty: zod_1.z.number(),
    }))
        .mutation(async ({ input }) => {
        // To open a short position - if you don't have a position yet, and your account is set to one-way mode, just place a sell order to open a short position
        try {
            const res = await client.submitNewOrder({
                symbol: input.symbol,
                side: input.side,
                type: "MARKET",
                quoteOrderQty: input.quoteOrderQty,
            });
            return res;
        }
        catch (e) {
            console.log(e);
        }
    }),
    orderStatus: trpc_1.publicProcedure.mutation(() => {
        return;
    }),
    orderCancel: trpc_1.publicProcedure.mutation(() => {
        return;
    }),
});