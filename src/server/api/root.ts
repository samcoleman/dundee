import { createTRPCRouter, publicProcedure } from "./trpc";

import { binance } from "./routers/binance";
import { notification } from "./routers/notificaton";
import { settingsManager } from "./routers/settings";
import { treeofalpha } from "./routers/treeofalpha";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => 'yay!'),
  settings: settingsManager,
  binance: binance,

  tree: treeofalpha,
  //notifications: notification,
});

// export type definition of API
export type AppRouter = typeof appRouter;