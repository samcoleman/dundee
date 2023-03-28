import { createTRPCRouter, publicProcedure } from "./trpc";
import { settingsManager } from "./routers/settings";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => 'yay!'),
  settings: settingsManager
});

// export type definition of API
export type AppRouter = typeof appRouter;