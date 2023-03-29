import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const notification = createTRPCRouter({
  order: publicProcedure
  .mutation(() => {
     return
  }),
  orderStatus: publicProcedure
  .mutation(() => {
     return
  }),
  orderCancel: publicProcedure
  .mutation(() => {
        return
  }),
});