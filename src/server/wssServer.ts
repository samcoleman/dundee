
import { appRouter } from './api/root';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws, { WebSocket } from 'ws';
import { LocalStorage } from "node-localstorage";
import { z } from 'zod';
import { Message } from 'utils/const';

const caller = appRouter.createCaller({}); 
const wss = new ws.Server({
  port: 3005,
});
const handler = applyWSSHandler({ wss, router: appRouter });

wss.on('connection', (ws) => {
  console.log(`+ Client Connection (${wss.clients.size})`);
  ws.once('close', () => {
    console.log(`- Client Connection (${wss.clients.size})`);
  });
});

console.log('✅ WebSocket Server listening on ws://localhost:3005');

process.on('SIGTERM', () => {
  console.log('SIGTERM');
  handler.broadcastReconnectNotification();
  wss.close();
});

const url = 'wss://news.treeofalpha.com/ws';
const localstorage = new LocalStorage('./socket_logs')

const tws = new WebSocket(url, {
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

const suggestions = z.array(z.object({
  found: z.array(z.string()),
  coin: z.string(),
  symbols: z.array(z.object({
    symbol: z.string(),
    exchange: z.string()
  }))}))

const handleBlog = (obj: any) => {
  const blogMessage = z.object({
    title: z.string(),
    source: z.string(),
    url: z.string(),
    time: z.number(),
    symbols: z.array(z.string()),
    en: z.string(),
    _id: z.string(),
    suggestions: suggestions})
  .parse(obj)

  const message : Message = {
    ...blogMessage,
    source: 'BLOG',
    body: ''
  }

  return message
  /*
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

  */


};

const handleTwitter = (obj: any) => {
  /*
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
  */

  const twitterMessage = z.object({
    title: z.string(),
    body: z.string(),
    icon: z.string(),
    image: z.string(),
    link: z.string(),
    time: z.number(),
    _id: z.string(),
    suggestions: suggestions})
  .parse(obj)

  const message : Message = {
    ...twitterMessage,
    source: 'TWITTER',
    url: twitterMessage.link
  }

  return message
};

const handleUnknown = (obj: any) => {
  console.log('Unknown message');
  return obj as Message
};

tws.on('open', () => {
  console.log('[TreeOfAlpha] connected');
});

tws.on('message', (data) => {
  try {
    const obj = JSON.parse(data.toString());
    
    void caller.tree.message(obj);
    //Log data
    console.log(obj);
    localstorage.setItem(new Date().getTime().toString()+'.json', JSON.stringify(obj))

    let message : Message
    if ('source' in obj && obj['source'] === 'Blogs') {
      message = handleBlog(obj);
    } else if ('type' in obj && obj['type'] === 'direct'){
      message = handleTwitter(obj);
    //} else if ('type' in obj && obj['type'] === 'telegram'){
    //  handleTelegram(obj as telegram);
    } else {
      message = handleUnknown(obj);
    }

    if (message) {
      void caller.tree.message(message);
    }

  } catch (err) {
    console.log(err);
  }
});

tws.on('close', () => {
  // Object
  console.log('[TreeOfAlpha] disconnected');
});

tws.on('error', (err) => {
  // Object
  console.log('[TreeOfAlpha] error');
});


