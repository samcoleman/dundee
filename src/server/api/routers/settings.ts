import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";


export const settingsManager = createTRPCRouter({
  reload: publicProcedure
  .mutation(({ ctx }) => {
     fetch("http://localhost:6000/reload").catch((res) => {return})
  }),
  restart: publicProcedure
  .mutation(({ ctx }) => {
     fetch("http://localhost:6000/restart").catch((res) => {return})
  }),
  status: publicProcedure
  .mutation(async ({ ctx }) => {
        const res = await fetch("http://localhost:6000/status")
        if (res.body) {
            return true
        }
        return false
    })
  });