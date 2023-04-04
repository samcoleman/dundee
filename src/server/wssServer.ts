import WebSocket from 'ws';
import notifier from 'node-notifier';
import { appRouter } from './api/root';
import express from 'express';

const caller = appRouter.createCaller({ session: null });
const url = 'wss://news.treeofalpha.com/ws';


const ws = new WebSocket(url, {
  headers: {
    Cookie: `tree_login_cookie=${process.env.TREE_COOKIE}`,
  },
});

ws.on('open', () => {
  console.log('connected');

  //WAIT ONE SECOND TO GET SETTINGS
  setTimeout(() => {
    caller.settings.getSettings().then((settings: settings) => {
      console.log(settings);
    })
    .catch((err) => {
      console.log(err);
    });

    // Object
    notifier.notify({
      title: 'Connected',
      message: 'Successfully connected to websocket server',
      reply: true,
    });
  }, 2000);


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

  notifier.notify({
    title: pageData.title,
    open: url,
  });
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

  notifier.notify({
    title: pageData.title,
    icon: pageData.payload_twitter?.icon,
    open: url,
  });
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

  notifier.notify({
    title: pageData.title,
    icon: pageData.payload_twitter?.icon,
    open: url,
  });
};

const handleUnknown = (obj) => {
  console.log('Unknown message');
  console.log(obj);
};

ws.on('message', (data) => {
  try {
    const obj = JSON.parse(data.toString());

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
  notifier.notify({
    title: 'Websockeet closed',
  });
});

ws.on('error', (err) => {
  // Object
  notifier.notify({
    title: 'Websockeet Error',
  });
});

const app = express();

app.get('/reload', (req, res) => {
  console.log('API CALLED')
  return res.send('API CALLED');
});

app.get('/restart', (req, res) => {
  console.log('Express + TypeScript Server');
  return res.send('API CALLED');
});

app.get('/status', (req, res) => {
  if (ws.OPEN) {
    res.send(true);
  } else {
    res.send(false);
  }
});

app.listen(3005, () => {
  console.log(`[node]: Server is running at http://localhost:3005`);
});
