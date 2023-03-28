import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

type feeds  = "BLOGS" | "TWITTER" | "TELEGRAM" | "UNKNOWN"
type status = "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN"
type sym = {
    symbol: string;
    tradingPair: string;
    status: status;
    keywords: string[];
}

export type settings = {
    feeds: feeds[];
    symbols: sym[];
    negativeKeywords: string[];
}

const data: settings = {
    feeds: ["BLOGS", "TWITTER", "TELEGRAM"],
    symbols: [
        {
            symbol: "BTC",
            tradingPair: "BTC/USD",
            status: "AVAILABLE",
            keywords: ["BTC", "Bitcoin"]
        },
        {
            symbol: "ETH",
            tradingPair: "ETH/USD",
            status: "UNAVAILABLE",
            keywords: ["ETH", "Ethereum"]
        },
        {
            symbol: "XRP",
            tradingPair: "XRP/USD",
            status: "UNKNOWN",
            keywords: ["XRP", "Ripple"]
        },
    ],
    negativeKeywords: ["Scam", "Fake", "Pump", "Dump"]
}

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
    }),
    getSettings: publicProcedure
    .query(({ ctx }) => {
        return data
    })
});