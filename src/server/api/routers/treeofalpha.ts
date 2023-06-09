import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { observable } from '@trpc/server/observable';
import EventEmitter from 'events';
import {sourceObj, type Message } from '../../../shared/types';
import { parseSource, parseSymbols, parseTitle } from '../../../shared/messageParse';
import fetch from 'node-fetch'

import { loadEnvConfig } from '@next/env'
loadEnvConfig('./', process.env.NODE_ENV !== 'production')

interface MyEvents {
  message: (data: Message) => void;
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


// source: "Blog" / source: "Binance EN" / source: "Upbit" / source: "usGov"
const ee = new MyEventEmitter();

export const treeofalpha = createTRPCRouter({
  getImageUrl: publicProcedure
  .mutation(async () => {
    try {
      const response = await fetch(`https://api.chart-img.com/v1/tradingview/mini-chart?width=500&height=300&key=${process.env.IMAGE_KEY || ""}`, {
        method: 'GET',
        headers: {
          contentType: 'image/jpeg',
        },
      })
      console.log(response.body)
      const blob = await response.blob()
      console.log(blob)
      return blob
    }catch (e) {
      return undefined
    }
  }),
  getMessages: publicProcedure.query(async (): Promise<Message[]> => {
    const res = await fetch('https://news.treeofalpha.com/api/news?limit=100', {
      headers: {
        Cookie:
          `tree_login_cookie=${process.env.TREE_COOKIE || ""}`,
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
      const onMessage = (data: Message) => {
        // emit data to client
        emit.next(data);
      };
      // trigger `onAdd()` when `add` is triggered in our event emitter
      ee.on('message', onMessage);
      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        ee.off('message', onMessage);
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
        icon: z.string().nullish(),
        image: z.string().nullish(),
      }),
    )
    .mutation(({ input }) => {
      ee.emit('message', input);
      return input;
    }),
});
