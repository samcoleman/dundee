import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { LocalStorage } from 'node-localstorage';

export type feeds = 'BLOGS' | 'TWITTER' | 'TELEGRAM' | 'UNKNOWN';

export const statusObj = ['TRADING', 'DOWN', 'NOT_FOUND', 'UNKNOWN'] as const;
export type status = (typeof statusObj)[number];

export type sym = {
  symbol: string;
  status: status;
  keywords: string[];
};

export type settings = {
  feeds: feeds[];
  symbols: sym[];
  negativeKeywords: string[];
};

const localstorage = new LocalStorage('./settings')

let data : settings = {
  feeds: [],
  symbols: [],
  negativeKeywords: []
}

data = JSON.parse(localstorage.getItem('settings') || JSON.stringify(data)) as settings

export const settingsManager = createTRPCRouter({
  getSettings: publicProcedure.query(() => {
    localstorage.setItem('settings', JSON.stringify(data))
    return data;
  }),
  updateSymbols: publicProcedure
    .input(
      z.array(
        z.object({
          symbol: z.string(),
          status: z.string().and(z.enum(statusObj)),
          keywords: z.array(z.string()),
        }),
      ),
    )
    .mutation(({ input }) => {
      data.symbols = input;
    }),
  addSymbol: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
      }),
    )
    .mutation(({ input }) => {
      if (!data.symbols.find((sym) => sym.symbol === input.symbol.toUpperCase())){
        data.symbols.push({
          symbol: input.symbol.toUpperCase(),
          status: 'UNKNOWN',
          keywords: [],
        });
      }
    }),
  addKeyword: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        keyword: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const symbol = data.symbols.find(
        (sym) => sym.symbol === input.symbol.toUpperCase(),
      );
      if (symbol) {
        if (!symbol.keywords.includes(input.keyword.toUpperCase())) {
          symbol.keywords.push(input.keyword.toUpperCase());
        }
      }
    }),
  addNegativeKeyword: publicProcedure
    .input(
      z.object({
        negativeKeyword: z.string(),
      }),
    )
    .mutation(({ input }) => {
      if (!data.negativeKeywords.includes(input.negativeKeyword.toUpperCase())){
        data.negativeKeywords.push(input.negativeKeyword.toUpperCase());
      }
    }),
  removeSymbol: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
      }),
    )
    .mutation(({ input }) => {
      data.symbols = data.symbols.filter(
        (sym) => sym.symbol !== input.symbol.toUpperCase(),
      );
    }),
  removeKeyword: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        keyword: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const symbol = data.symbols.find(
        (sym) => sym.symbol === input.symbol.toUpperCase(),
      );
      if (symbol) {
        symbol.keywords = symbol.keywords.filter(
          (kw) => kw !== input.keyword.toUpperCase(),
        );
      }
    }),
  removeNegativeKeyword: publicProcedure
    .input(
      z.object({
        negativeKeyword: z.string(),
      }),
    )
    .mutation(({ input }) => {
      data.negativeKeywords = data.negativeKeywords.filter(
        (kw) => kw !== input.negativeKeyword.toUpperCase(),
      );
    }),
  addFeed: publicProcedure
    .input(
      z.object({
        feed: z
          .string()
          .and(z.enum(['BLOGS', 'TWITTER', 'TELEGRAM', 'UNKNOWN'])),
      }),
    )
    .mutation(({ input }) => {
      data.feeds.push(input.feed);
    }),
  removeFeed: publicProcedure
    .input(
      z.object({
        feed: z
          .string()
          .and(z.enum(['BLOGS', 'TWITTER', 'TELEGRAM', 'UNKNOWN'])),
      }),
    )
    .mutation(({ input }) => {
      data.feeds = data.feeds.filter((feed) => feed !== input.feed);
    }),
});
