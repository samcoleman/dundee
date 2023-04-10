import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { observable } from '@trpc/server/observable';
import EventEmitter from 'events';
import {sourceObj, type Message, type source } from 'utils/const';
import { parseSource, parseSymbols, parseTitle } from 'utils/messageParse';



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
      return {
        ...parseTitle(update.title),
        source: parseSource(update.source),
        url: update.url,
        time: update.time,
        _id: update._id,
        symbols: parseSymbols(update.symbols ? update.symbols : []),
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
        body: z.string(),
        source: z.string().and(z.enum(sourceObj)),
        url: z.string(),
        time: z.number(),
        _id: z.string(),
        symbols: z.array(z.string()),
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
