import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const server = createTRPCRouter({
  reload: publicProcedure
  .mutation(() => {
     fetch("http://localhost:6000/reload").catch((res) => {return})
  }),
  restart: publicProcedure
  .mutation(() => {
     fetch("http://localhost:6000/restart").catch((res) => {return})
  }),
  status: publicProcedure
  .mutation(async () => {
        const res = await fetch("http://localhost:6000/status")
        if (res.body) {
            return true
        }
        return false
    }),
});