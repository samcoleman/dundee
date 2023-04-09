import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { LocalStorage } from 'node-localstorage';
import { type source, sourceObj, type status, statusObj } from 'utils/const';

export type sym = {
  future_id: string;
  status: status;
  active: boolean;
};

export type settings = {
  sources: source[];
  symbols: Map<string, sym>;
  symbol_keys: Map<string, string[]>;
  pos_filter: Map<source, string[]>;
  neg_filter: Map<source, string[]>;
};

const localstorage = new LocalStorage('./settings');

let data: settings = {
  sources: [],
  symbols: new Map<
    string,
    { future_id: string; status: status; active: boolean }
  >(),
  symbol_keys: new Map<string, string[]>(),
  pos_filter: new Map<source, string[]>(),
  neg_filter: new Map<source, string[]>(),
};

function replacer(key: any, value: any) : any {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()),
    };
  } else {
    return value;
  }
}

function reviver(key: any, value: any) : any {
  if (typeof value === 'object' && value !== null) {

    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}


data = JSON.parse(
  localstorage.getItem('settings') || JSON.stringify(data, replacer),
  reviver,
) as settings;


export const settingsManager = createTRPCRouter({
  getSettings: publicProcedure.query(() => {
    localstorage.setItem('settings', JSON.stringify(data, replacer));
    return data;
  }),
  updateSymbols: publicProcedure
    // Create zod input for this type  [symbol: string]: {future_id: string; status: status;active: boolean;};
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
      data.symbols.set(input.symbol.toUpperCase(), {
        future_id: input.symbol.toUpperCase(),
        status: 'UNKNOWN',
        active: true,
      });
    }),
  removeSymbol: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
      }),
    )
    .mutation(({ input }) => {
      data.symbols.delete(input.symbol.toUpperCase());
      data.symbol_keys.delete(input.symbol.toUpperCase());
    }),
  addSymbolKey: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        keyword: z.string(),
      }),
    )
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
  removeSymbolKey: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        keyword: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const keys = data.symbol_keys.get(input.symbol.toUpperCase());
      if (!keys) {
        return;
      }
      data.symbol_keys.set(input.symbol.toUpperCase(), keys.filter((key) => key !== input.keyword.toUpperCase()));
    }),
  addPosKeyword: publicProcedure
    .input(
      z.object({
        source: z.string().and(z.enum(sourceObj)).optional(),
        keyword: z.string(),
      }),
    )
    .mutation(({ input }) => {
      if (input.source) {
        const pos_filter = data.pos_filter.get(input.source);
        if (!pos_filter) {
          data.pos_filter.set(input.source, [input.keyword.toUpperCase()]);
          return;
        }
        if (!pos_filter.includes(input.keyword.toUpperCase())) {
          pos_filter.push(input.keyword.toUpperCase());
        }
      } else {
        data.pos_filter.forEach((value) => {
          if (!value.includes(input.keyword.toUpperCase())) {
            value.push(input.keyword.toUpperCase());
          }
        });
      }
    }),
  removePosKeyword: publicProcedure
    .input(
      z.object({
        source: z.string().and(z.enum(sourceObj)).optional(),
        keyword: z.string(),
      }),
    )
    .mutation(({ input }) => {
      if (input.source) {
        const pos_filter = data.pos_filter.get(input.source);
        if (!pos_filter) {
          return;
        }
        data.pos_filter.set(input.source, pos_filter.filter((key) => key !== input.keyword.toUpperCase()));
      } else {
        data.pos_filter.forEach((value, key) => {
          data.pos_filter.set(key, value.filter((key) => key !== input.keyword.toUpperCase()));
        });
      }
    }),
  addNegKeyword: publicProcedure
    .input(
      z.object({
        source: z.string().and(z.enum(sourceObj)).optional(),
        keyword: z.string(),
      }),
    )
    .mutation(({ input }) => {
      if (input.source) {
        const neg_filter = data.neg_filter.get(input.source);
        if (!neg_filter) {
          data.neg_filter.set(input.source, [input.keyword.toUpperCase()]);
          return;
        }
        if (!neg_filter.includes(input.keyword.toUpperCase())) {
          neg_filter.push(input.keyword.toUpperCase());
        }
        neg_filter;
      } else {
        data.neg_filter.forEach((value) => {
          if (!value.includes(input.keyword.toUpperCase())) {
            value.push(input.keyword.toUpperCase());
          }
        });
      }
    }),
  removeNegKeyword: publicProcedure
    .input(
      z.object({
        source: z.string().and(z.enum(sourceObj)).optional(),
        keyword: z.string(),
      }),
    )
    .mutation(({ input }) => {
      if (input.source) {
        const neg_filter = data.neg_filter.get(input.source);
        if (!neg_filter) {
          return;
        }
        data.neg_filter.set(input.source, neg_filter.filter((key) => key !== input.keyword.toUpperCase()))
      } else {
        data.neg_filter.forEach((value, key) => {
          data.neg_filter.set(key, value.filter((key) => key !== input.keyword.toUpperCase()));
        });
      }
    }),
  addSource: publicProcedure
    .input(
      z.object({
        source: z.string().and(z.enum(sourceObj)),
      }),
    )
    .mutation(({ input }) => {
      if (!data.sources.includes(input.source)) {
        data.sources.push(input.source);
      }
    }),
  removeSource: publicProcedure
    .input(
      z.object({
        source: z.string().and(z.enum(sourceObj)),
      }),
    )
    .mutation(({ input }) => {
      data.sources = data.sources.filter((source) => source !== input.source);
    }),
});
