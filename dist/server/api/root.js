"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("./trpc");
const binance_1 = require("./routers/binance");
const settings_1 = require("./routers/settings");
const treeofalpha_1 = require("./routers/treeofalpha");
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
exports.appRouter = (0, trpc_1.createTRPCRouter)({
    health: trpc_1.publicProcedure.query(() => 'yay!'),
    settings: settings_1.settingsManager,
    binance: binance_1.binance,
    tree: treeofalpha_1.treeofalpha,
    //notifications: notification,
});
