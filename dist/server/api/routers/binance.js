"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.binance = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const binance_1 = require("binance");
const types_1 = require("../../../shared/types");
const env_1 = require("@next/env");
const server_1 = require("@trpc/server");
(0, env_1.loadEnvConfig)('./', process.env.NODE_ENV !== 'production');
const client = new binance_1.USDMClient({
    api_secret: process.env.BINANCE_SECRET,
    api_key: process.env.BINANCE_KEY,
    baseUrl: process.env.BINANCE_URL,
});
exports.binance = (0, trpc_1.createTRPCRouter)({
    status: trpc_1.publicProcedure.mutation(async () => {
        return await client.testConnectivity();
    }),
    getSymbolInfo: trpc_1.publicProcedure.query(async () => {
        return (await client.getExchangeInfo()).symbols.map((sym) => {
            return {
                symbol: sym.symbol,
                status: sym.status,
                quantityPrecision: sym.quantityPrecision,
            };
        });
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
        quantity: zod_1.z.number(),
    }))
        .mutation(async ({ input }) => {
        // To open a short position - if you don't have a position yet, and your account is set to one-way mode, just place a sell order to open a short position
        try {
            const res = await client.submitNewOrder({
                symbol: input.symbol,
                side: input.side,
                type: 'MARKET',
                quantity: input.quantity,
            });
            return res;
        }
        catch (e) {
            let message = 'UNKNOWN_ERROR';
            if (typeof e === 'object' &&
                e &&
                'message' in e &&
                typeof e.message === 'string') {
                message = e.message;
            }
            throw new server_1.TRPCError({
                code: 'BAD_REQUEST',
                message: message,
            });
        }
    }),
    getSymbolPrice: trpc_1.publicProcedure
        .input(zod_1.z.object({
        symbol: zod_1.z.string(),
    }))
        .mutation(async ({ input }) => {
        const res = await client.getMarkPrice({
            symbol: input.symbol,
        });
        return res;
    }),
    getPriceHistory: trpc_1.publicProcedure
        .input(zod_1.z.object({
        symbol: zod_1.z.string(),
        limit: zod_1.z.number()
    }))
        .mutation(async ({ input }) => {
        try {
            const res = await client.getKlines({
                symbol: input.symbol,
                interval: "1m",
                limit: input.limit,
            });
            return res;
        }
        catch (e) {
            console.log(e);
        }
    }),
    getPositions: trpc_1.publicProcedure
        .input(zod_1.z.object({
        symbol: zod_1.z.string().optional(),
    }))
        .query(async ({ input }) => {
        try {
            const inp = input.symbol ? { symbol: input.symbol } : undefined;
            const res = (await client.getPositions(inp))
                // Empty positions never used have markPrice = 0
                // Empty positons some times have a mark price which is faster to buy
                .filter((pos) => pos.markPrice != 0)
                .map((position) => {
                return {
                    symbol: position.symbol,
                    markPrice: position.markPrice,
                    positionAmt: position.positionAmt,
                    notional: position.notional,
                    unRealizedProfit: position.unRealizedProfit,
                    entryPrice: position.entryPrice,
                };
            });
            return res;
        }
        catch (e) {
            console.log(e);
        }
    }),
});
