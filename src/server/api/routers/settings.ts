import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export type feeds  = "BLOGS" | "TWITTER" | "TELEGRAM" | "UNKNOWN"
export type status = "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN"
export type sym = {
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
            tradingPair: "BTCUSDT",
            status: "AVAILABLE",
            keywords: ["BTC", "BITCOIN"]
        },
        {
            symbol: "ETH",
            tradingPair: "ETHUSDT",
            status: "UNAVAILABLE",
            keywords: ["ETH", "ETHERIUM"]
        },
        {
            symbol: "XRP",
            tradingPair: "XRPUSDT",
            status: "UNKNOWN",
            keywords: ["XRP", "RIPPLE"]
        },
    ],
    negativeKeywords: ["SCAM", "FAKE", "PUMP", "DUMP"]
}

export const settingsManager = createTRPCRouter({
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
    getSettings: publicProcedure
    .query(() => {
        return data
    }),
    addSymbol: publicProcedure
    .input(z.object({
        symbol: z.string(),
    }))
    .mutation(({ input }) => {
        data.symbols.push({
            symbol: input.symbol.toUpperCase(),
            tradingPair: input.symbol.toUpperCase() + "USDT",
            status: "UNKNOWN",
            keywords: []
        })
    }),
    addKeyword: publicProcedure
    .input(z.object({
        symbol: z.string(),
        keyword: z.string()
    }))
    .mutation(({ input }) => {
        const symbol = data.symbols.find((sym) => sym.symbol === input.symbol.toUpperCase())
        if (symbol) {
            symbol.keywords.push(input.keyword.toUpperCase())
        }
    }),
    addNegativeKeyword: publicProcedure
    .input(z.object({
        negativeKeyword: z.string()
    }))
    .mutation(({ input }) => {
        data.negativeKeywords.push(input.negativeKeyword.toUpperCase())
    }),
    removeSymbol: publicProcedure
    .input(z.object({
        symbol: z.string(),
    }))
    .mutation(({ input }) => {
        data.symbols = data.symbols.filter((sym) => sym.symbol !== input.symbol.toUpperCase())
    }),
    removeKeyword: publicProcedure
    .input(z.object({
        symbol: z.string(),
        keyword: z.string()
    }))
    .mutation(({ input }) => {
        const symbol = data.symbols.find((sym) => sym.symbol === input.symbol.toUpperCase())
        if (symbol) {
            symbol.keywords = symbol.keywords.filter((kw) => kw !== input.keyword.toUpperCase())
        }
    }),
    removeNegativeKeyword: publicProcedure
    .input(z.object({
        negativeKeyword: z.string()
    }))
    .mutation(({ input }) => {
        data.negativeKeywords = data.negativeKeywords.filter((kw) => kw !== input.negativeKeyword.toUpperCase())
    }),
    addFeed: publicProcedure
    .input(z.object({
        feed: z.string().and(z.enum(["BLOGS", "TWITTER", "TELEGRAM", "UNKNOWN"]))
    }))
    .mutation(({ input }) => {
        data.feeds.push(input.feed)
    }),
    removeFeed: publicProcedure
    .input(z.object({
        feed: z.string().and(z.enum(["BLOGS", "TWITTER", "TELEGRAM", "UNKNOWN"]))
    }))
    .mutation(({ input }) => {
        data.feeds = data.feeds.filter((feed) => feed !== input.feed)
    })
});