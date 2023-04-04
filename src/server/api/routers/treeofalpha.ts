import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { WebSocket } from "ws";
import { LocalStorage } from "node-localstorage";

const url = 'wss://news.treeofalpha.com/ws';
const localstorage = new LocalStorage('./socket_logs')

const ws = new WebSocket(url, {
  headers: {
    Cookie: `tree_login_cookie=${process.env.TREE_COOKIE}`,
  },
});

export type blog_payload = {
  symbols?: string[];
  prices?: number[];
};

export type twitter_payload = {
  body: string;
  icon: string;
  image?: string;
};

export type telegram_payload = {
  body: string;
  icon: string;
  image?: string;
};

export type alert_payload = {
  body: string;
  icon: string;
  image?: string;
};

export type pageData = {
  symbol: string;
  source: 'BLOG' | 'TWITTER' | 'TELEGRAM' | 'ALERT' | 'UNKNOWN';
  title: string;
  time: number;
  link: string;
  payload_blog?: blog_payload;
  payload_twitter?: twitter_payload;
  payload_telegram?: telegram_payload;
  payload_alert?: alert_payload;
  payload_unknown?: string;
};

type blog = {
  title: string;
  time: number;
  link: string;
  symbols?: string[];
  prices?: number[];

}
const handleBlog = (obj: blog) => {
  const pageData: pageData = {
    symbol: 'BTCUSDT',
    source: 'BLOG',
    title: obj['title'],
    time: obj['time'],
    link: obj['link'],
    payload_blog: {
      symbols: "symbols" in obj ? obj['symbols'] : [],
      prices:  "prices" in obj ? obj['prices'] : [],
    },
  };

  const url = `http://localhost:3000/dash\?symbol=${pageData.symbol}\&source=${
    pageData.source
  }\&title=${encodeURIComponent(pageData.title)}\&time=${pageData.time}\&link=${
    pageData.link
  }\&payload_blog=${encodeURIComponent(JSON.stringify(pageData.payload_blog))}`;
};

type twitter = {
  title: string;
  time: number;
  link: string;
  body: string;
  icon: string;
  image?: string;
};
const handleTwitter = (obj: twitter) => {
  const pageData: pageData = {
    symbol: 'BTCUSDT',
    source: 'TWITTER',
    title: obj['title'],
    time: obj['time'],
    link: obj['link'],
    payload_twitter: {
      body: obj['body'],
      icon: obj['icon'],
      image: obj['image'] as string,
    },
  };

  const url = `http://localhost:3000/dash\?symbol=${pageData.symbol}\&source=${
    pageData.source
  }\&title=${encodeURIComponent(pageData.title)}\&time=${pageData.time}\&link=${
    pageData.link
  }\&payload_blog=${encodeURIComponent(JSON.stringify(pageData.payload_blog))}`;
};

type telegram = {
  title: string;
  time: number;
  link: string;
  body: string;
  icon: string;
  image?: string;
};
const handleTelegram = (obj: telegram) => {
  const pageData: pageData = {
    symbol: 'BTCUSDT',
    source: 'TELEGRAM',
    title: obj['title'],
    time: obj['time'],
    link: obj['link'],
    payload_twitter: {
      body: obj['body'],
      icon: obj['icon'],
      image: obj['image'] as string,
    },
  };

  const url = `http://localhost:3000/dash\?symbol=${pageData.symbol}\&source=${
    pageData.source
  }\&title=${encodeURIComponent(pageData.title)}\&time=${pageData.time}\&link=${
    pageData.link
  }\&payload_blog=${encodeURIComponent(JSON.stringify(pageData.payload_blog))}`;
};

const handleUnknown = (obj) => {
  console.log('Unknown message');
  console.log(obj);
};

ws.on('open', () => {
  console.log('[TreeOfAlpha] connected');
});


ws.on('message', (data) => {
  try {
    const obj = JSON.parse(data.toString());
    //Log data
    console.log();
    localstorage.setItem(new Date().getTime().toString(), JSON.stringify(obj))

    if ('source' in obj) {
      handleBlog(obj as blog);
    } else if ('type' in obj && obj['type'] === 'direct'){
      handleTwitter(obj as twitter);
    } else if ('type' in obj && obj['type'] === 'telegram'){
      handleTelegram(obj as telegram);
    } else {
      handleUnknown(obj);
    }

  } catch (err) {
    console.log(err);
  }
});

ws.on('close', () => {
  // Object
  console.log('[TreeOfAlpha] disconnected');
});

ws.on('error', (err) => {
  // Object
  console.log('[TreeOfAlpha] error');
});


export type Update = {
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

      return updates as Update[] 
  }),
});