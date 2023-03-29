import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { USDMClient } from 'binance';
import { statusObj } from './settings';

const client = new USDMClient({
  api_secret: process.env.BINANCE_SECRET,
  api_key: process.env.BINANCE_KEY,
  beautifyResponses: true,
});

export const binance = createTRPCRouter({
  status: publicProcedure
  .mutation(async () => {
    return await client.testConnectivity();
  }),
  checkSymbols: publicProcedure
    .input(
      z.array(
        z.object({
          symbol: z.string(),
          status: z.string().and(z.enum(statusObj)),
          keywords: z.array(z.string()),
        }),
      ),
    )
    .mutation(async ({ input }) => {
      const symbolStatus = await client.getExchangeInfo();
      input.forEach((symbol) => {
        const symExchange = symbolStatus.symbols.find(
          (sym) => sym.symbol === symbol.symbol,
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
        quantity: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      // To open a short position - if you don't have a position yet, and your account is set to one-way mode, just place a sell order to open a short position
      const res = await client.submitNewOrder({
        symbol: 'BTCUSDT',
        side: input.side,
        type: 'MARKET',
        quantity: 0.001,
      });
    }),
  orderStatus: publicProcedure.mutation(() => {
    return;
  }),
  orderCancel: publicProcedure.mutation(() => {
    return;
  }),
});
