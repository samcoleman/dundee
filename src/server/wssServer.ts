
import { appRouter } from './api/root';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws, { WebSocket } from 'ws';
import { LocalStorage } from "node-localstorage";

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

tws.on('close', () => {
  // Object
  console.log('[TreeOfAlpha] disconnected');
});

tws.on('error', (err) => {
  // Object
  console.log('[TreeOfAlpha] error');
});


