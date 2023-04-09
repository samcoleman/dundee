import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { observable } from '@trpc/server/observable';
import EventEmitter from 'events';
import { source } from 'utils/const';

export type Message = {
  title: string;
  body: string;
  source: source;
  url: string;
  time: number;
  _id: string;
  symbols?: string[];
  icon?: string;
  image?: string;
};

// source: "Blog" / source: "Binance EN" / source: "Upbit" / source: "usGov"
const ee = new EventEmitter();

export const treeofalpha = createTRPCRouter({
  getUpdates: publicProcedure.query(async (): Promise<Message[]> => {
    const res = await fetch('https://news.treeofalpha.com/api/news?limit=500', {
      headers: {
        Cookie:
          'tree_login_cookie=s%3AkT_W-vPFN1oEgl2LER1tOIICWOxw3Ral.gL6yrs9481uvZA33BP%2FlMheSbgZIX97SialIk%2FhWYMU',
      },
    });
    // Typecheck that the API returns a response we expect
    const updatesAPI = z
      .array(
        z.object({
          title: z.string(),
          source: z.string(),
          url: z.string(),
          time: z.number(),
          _id: z.string(),
          symbols: z.array(z.string()).optional(),
          icon: z.string().optional(),
          image: z.string().optional(),
        }),
      )
      .parse(await res.json());

    // Cast to unified type
    const updates: Message[] = updatesAPI.map((update) => {
      const titleIndex = update.title.indexOf(':');
      let title = update.title;
      let body = '';

      if (titleIndex > 0) {
        title = update.title.slice(0, titleIndex);
        body = update.title.slice(titleIndex + 1, update.title.length + 1);
      }

      if (update.symbols) {
        // Remove all symbols not containing USDT
        update.symbols = update.symbols.filter((symbol) => {
          return symbol.indexOf('USDT') > 0;
        });
        // Remove _ from symbol
        update.symbols = update.symbols.map((symbol) =>
          symbol.replace('_', ''),
        );
      }

      let source: source;

      switch (update.source) {
        case 'Blogs':
          source = 'BLOG';
          break;
        case 'Binance EN':
          source = 'BINANCE';
          break;
        case 'Upbit':
          source = 'UPBIT';
          break;
        case 'usGov':
          source = 'USGOV';
          break;
        case 'Twitter':
          source = 'TWITTER';
          break;
        default:
          source = 'UNKNOWN';
      }

      return {
        title: title,
        body: body,
        source: source,
        url: update.url,
        time: update.time,
        _id: update._id,
        symbols: update.symbols || [],
        icon: update.icon,
        image: update.image,
      };
    });

    return updates;
  }),
  onMessage: publicProcedure.subscription(() => {
    // return an `observable` with a callback which is triggered immediately
    return observable<Message>((emit) => {
      const onAdd = (data: Message) => {
        // emit data to client
        emit.next(data);
      };
      // trigger `onAdd()` when `add` is triggered in our event emitter
      ee.on('message', onAdd);
      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        ee.off('add', onAdd);
      };
    });
  }),
  message: publicProcedure
    .input(
      z.object({
        title: z.string(),
        source: z.string().optional(),
        url: z.string(),
        time: z.number(),
        _id: z.string(),
        symbols: z.array(z.string()).optional(),
        icon: z.string().optional(),
        image: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const message = { ...input }; /* [..] add to db */
      ee.emit('message', message);
      return message;
    }),
});
