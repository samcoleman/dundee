import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { LocalStorage } from 'node-localstorage';
import {
  type source,
  sourceObj,
  type status,
  statusObj,
} from '../../../shared/types';
import { EventEmitter } from 'stream';
import { observable } from '@trpc/server/observable';
import { type settings } from '../../../shared/types';

const localstorage = new LocalStorage('./settings');

let data: settings = {
  notifications: {
    adv_notifications: false,

    sources: [],
    pass_pos_filter: false,
    pos_filter: new Map<source, string[]>(),
    pass_neg_filter: false,
    neg_filter: new Map<source, string[]>(),

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
  symbol_keys: new Map<string, string[]>(),
  symbols: new Map<
    string,
    { future_id: string; status: status; active: boolean }
  >(),
};

function replacer(key: unknown, value: unknown): unknown {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()),
    };
  } else {
    return value;
  }
}

function reviver(key: unknown, value: unknown): unknown {
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


data = JSON.parse(
  localstorage.getItem('settings') || JSON.stringify(data, replacer),
  reviver,
) as settings;


interface MyEvents {
  update: (data: settings) => void;
}
declare interface MyEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(
    event: TEv,
    ...args: Parameters<MyEvents[TEv]>
  ): boolean;
}

class MyEventEmitter extends EventEmitter {}

const ee = new MyEventEmitter();

export const settingsManager = createTRPCRouter({
  onUpdate: publicProcedure.subscription(() => {
    // return an `observable` with a callback which is triggered immediately
    return observable<settings>((emit) => {
      const onUpdate = (d: settings) => {
        data = d
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
  getSettingsQuery: publicProcedure.query(() => {
    return data;
  }),
  getSettings: publicProcedure.
  mutation(() => {
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
    // TODO: SLOW
    // This is dumb
    input.forEach((value, key) => {
      data.symbols.set(key, value);
    });

    ee.emit('update', data);
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

      ee.emit('update', data);
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

      ee.emit('update', data);
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

        ee.emit('update', data);
        return;
      }
      if (!keys.includes(input.keyword.toUpperCase())) {
        keys.push(input.keyword.toUpperCase());
      }

      ee.emit('update', data);
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
      data.symbol_keys.set(
        input.symbol.toUpperCase(),
        keys.filter((key) => key !== input.keyword.toUpperCase()),
      );

      ee.emit('update', data);
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
      } else {
        data.notifications.pos_filter.forEach((value) => {
          if (!value.includes(input.keyword.toUpperCase())) {
            value.push(input.keyword.toUpperCase());
          }
        });
      }

      ee.emit('update', data);
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
        const pos_filter = data.notifications.pos_filter.get(input.source);
        if (!pos_filter) {
          return;
        }
        data.notifications.pos_filter.set(
          input.source,
          pos_filter.filter((key) => key !== input.keyword.toUpperCase()),
        );
      } else {
        data.notifications.pos_filter.forEach((value, key) => {
          data.notifications.pos_filter.set(
            key,
            value.filter((key) => key !== input.keyword.toUpperCase()),
          );
        });
      }

      ee.emit('update', data);
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
      } else {
        data.notifications.neg_filter.forEach((value) => {
          if (!value.includes(input.keyword.toUpperCase())) {
            value.push(input.keyword.toUpperCase());
          }
        });
      }

      ee.emit('update', data);
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
        const neg_filter = data.notifications.neg_filter.get(input.source);
        if (!neg_filter) {
          return;
        }
        data.notifications.neg_filter.set(
          input.source,
          neg_filter.filter((key) => key !== input.keyword.toUpperCase()),
        );
      } else {
        data.notifications.neg_filter.forEach((value, key) => {
          data.notifications.neg_filter.set(
            key,
            value.filter((key) => key !== input.keyword.toUpperCase()),
          );
        });
      }

      ee.emit('update', data);
    }),
  addSource: publicProcedure
    .input(
      z.object({
        source: z.string().and(z.enum(sourceObj)),
      }),
    )
    .mutation(({ input }) => {
      if (!data.notifications.sources.includes(input.source)) {
        data.notifications.sources.push(input.source);
      }

      ee.emit('update', data);
    }),
  removeSource: publicProcedure
    .input(
      z.object({
        source: z.string().and(z.enum(sourceObj)),
      }),
    )
    .mutation(({ input }) => {
      data.notifications.sources = data.notifications.sources.filter(
        (source) => source !== input.source,
      );

      ee.emit('update', data);
    }),
  setNotificationAction: publicProcedure
    .input(
      z.object({
        key: z.string().and(z.enum(['B_1', 'S_1'])),
        amount: z.number(),
      }),
    )
    .mutation(({ input }) => {
      data.notifications.actions[input.key] = input.amount;

      ee.emit('update', data);
    }),
  setDashAction: publicProcedure
    .input(
      z.object({
        key: z.string().and(z.enum(['B_1', 'B_2', 'B_3', 'S_1', 'S_2', 'S_3'])),
        amount: z.number(),
      }),
    )
    .mutation(({ input }) => {
      data.dash.actions[input.key] = input.amount;

      ee.emit('update', data);
    }),
    setPosFilter: publicProcedure
    .input(
      z.object({
        state: z.boolean(),
      }),
    )
    .mutation(({ input }) => {
      data.notifications.pass_pos_filter = input.state;

      ee.emit('update', data);
    }),
    setNegFilter: publicProcedure
    .input(
      z.object({
        state: z.boolean(),
      }),
    )
    .mutation(({ input }) => {
      data.notifications.pass_neg_filter = input.state;

      ee.emit('update', data);
    }),
    setSymbolMatch: publicProcedure
    .input(
      z.object({
        sym_match: z.string().and(z.enum(['MATCH_LOOKUP', 'ANY_MATCH', 'NO_MATCH'])),
      }),
    )
    .mutation(({ input }) => {
      data.notifications.symbol = input.sym_match;

      ee.emit('update', data);
    }),
    setGenerateChart: publicProcedure
    .input(
      z.object({
        state: z.boolean(),
      }),
    )
    .mutation(({ input }) => {
      data.notifications.adv_notifications = input.state;

      ee.emit('update', data);
    }),
});
