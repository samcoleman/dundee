import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { USDMClient } from 'binance';
import { statusObj } from '../../../shared/types';

import { loadEnvConfig } from '@next/env';
import { TRPCError } from '@trpc/server';
loadEnvConfig('./', process.env.NODE_ENV !== 'production');

const client = new USDMClient({
  api_secret: process.env.BINANCE_SECRET,
  api_key: process.env.BINANCE_KEY,
  baseUrl: process.env.BINANCE_URL,
});

export const binance = createTRPCRouter({
  status: publicProcedure.mutation(async () => {
    return await client.testConnectivity();
  }),
  getSymbolInfo: publicProcedure.query(async () => {
    return (await client.getExchangeInfo()).symbols.map((sym) => {
      return {
        symbol: sym.symbol,
        status: sym.status,
        quantityPrecision: sym.quantityPrecision,
      };
    });
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
        quantity: z.number(),
      }),
    )
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
      } catch (e) {
        let message = 'UNKNOWN_ERROR';

        if (
          typeof e === 'object' &&
          e &&
          'message' in e &&
          typeof e.message === 'string'
        ) {
          message = e.message;
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: message,
        });
      }
    }),
  getSymbolPrice: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const res = await client.getMarkPrice({
        symbol: input.symbol,
      });
      return res;
    }),

  getPriceHistory: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        limit: z.number()
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const res = await client.getKlines({
          symbol: input.symbol,
          interval: "1m",
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
      } catch (e) {
        console.log(e);
      }
    }),
});
