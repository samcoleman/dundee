import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { observable } from "@trpc/server/observable";
import EventEmitter from "events";

export type Message = {
  title: string
  source: string
  url: string
  time: number
  _id: string
  symbols?: string[]
  icon?: string,
  image?: string,
}

// source: "Blog" / source: "Binance EN" / source: "Upbit" / source: "usGov"
const ee = new EventEmitter();


export const treeofalpha = createTRPCRouter({
  getUpdates: publicProcedure
  .query(async () => {

      const res = await fetch('https://news.treeofalpha.com/api/news?limit=500', {
        headers: {
          Cookie: "tree_login_cookie=s%3AkT_W-vPFN1oEgl2LER1tOIICWOxw3Ral.gL6yrs9481uvZA33BP%2FlMheSbgZIX97SialIk%2FhWYMU"
        }
      })
      // Typecheck all elements of the array are of type Update
      const updates = z.array(z.object({
        title: z.string(),
        source: z.string(),
        url: z.string(),
        time: z.number(),
        _id: z.string(),
        symbols: z.array(z.string()).optional(),
        icon: z.string().optional(),
        image: z.string().optional(),
      })).parse(await res.json())

      return updates as Message[] 
  }),
  onMessage: publicProcedure
  .subscription(() => {
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
      source: z.string(),
      url: z.string(),
      time: z.number(),
      _id: z.string(),
      symbols: z.array(z.string()).optional(),
      icon: z.string().optional(),
      image: z.string().optional(),
    })
  )
  .mutation(({ input }) => {
    const message = { ...input }; /* [..] add to db */
    ee.emit('add', message);
    return message;
  }),
});