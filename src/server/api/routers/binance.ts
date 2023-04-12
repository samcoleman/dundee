import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { USDMClient } from 'binance';
import { statusObj } from '../../../shared/types';

import { loadEnvConfig } from '@next/env';
loadEnvConfig('./', process.env.NODE_ENV !== 'production');

const client = new USDMClient({
  api_secret: process.env.BINANCE_SECRET,
  api_key: process.env.BINANCE_KEY,
  baseUrl: 'https://testnet.binancefuture.com',
});

client.submitNewOrder;
export const binance = createTRPCRouter({
  status: publicProcedure.mutation(async () => {
    return await client.testConnectivity();
  }),
  checkSymbols: publicProcedure
    .input(
      z.map(
        z.string(),
        z.object({
          future_id: z.string(),
          status: z.string().and(z.enum(statusObj)),
          active: z.boolean(),
        }),
      ),
    )
    .mutation(async ({ input }) => {
      const symbolStatus = await client.getExchangeInfo();
      input.forEach((symbol, key) => {
        const symExchange = symbolStatus.symbols.find(
          (sym) => sym.symbol === key,
        );
        if (!symExchange) {
          symbol.status = 'NOT_FOUND';
        } else {
          if (symExchange.status === 'TRADING') {
            symbol.status = 'TRADING';
          } else {
            symbol.status = 'DOWN';
          }
        }
      });
      return input;
    }),
  order: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        side: z.string().and(z.enum(['BUY', 'SELL'])),
        type: z.string(),
        quoteOrderQty: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      // To open a short position - if you don't have a position yet, and your account is set to one-way mode, just place a sell order to open a short position
      try {
        const res = await client.submitNewOrder({
          symbol: input.symbol,
          side: input.side,
          type: 'MARKET',
        });
        return res;
      } catch (e) {
        console.log(e);
      }
    }),

  getSymbolPrice: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const res = await client.getMarkPrice({
          symbol: input.symbol,
        });
        return res;
      } catch (e) {
        console.log(e);
      }
    }),

  getPriceHistory: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        fromId: z.number().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        limit: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const res = await client.getAggregateTrades({
          symbol: input.symbol,
          fromId: input.fromId,
          startTime: input.startTime,
          endTime: input.endTime,
          limit: input.limit,
        });
        return res;
      } catch (e) {
        console.log(e);
      }
    }),

  getPositions: publicProcedure
    .input(
      z.object({
        symbol: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const inp = input.symbol ? { symbol: input.symbol } : undefined;
        const res = await client.getPositions(inp);
        return res;
      } catch (e) {
        console.log(e);
      }
    }),
});
