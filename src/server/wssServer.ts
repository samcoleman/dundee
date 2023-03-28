import WebSocket from 'ws';
import notifier from 'node-notifier';
import { appRouter } from './api/root';
import express from 'express';


const caller = appRouter.createCaller({session: null});
const url = 'wss://news.treeofalpha.com/ws';

const ws = new WebSocket(url, {
  headers: {
    Cookie:
      `tree_login_cookie=${process.env.TREE_COOKIE}`
  },
});

ws.on('open', () => {
  console.log('connected');

  // Object
  notifier.notify({
    title: 'Connected',
    message: 'Successfully connected to websocket server',
    reply : true,
  });
});


type source = {
    link: string;
    symbols?: string[],
    price?:   number[],
}

type direct = {
    body: string;
    icon: string;
    link: string;
    image?: string;
}


const handleDirect = (obj) => {
    const symbol = "BTC"
    const source = "DIRECT"
    const title = encodeURIComponent(obj["title"] as string)
    const time  = encodeURIComponent(obj["time"]  as string)
    const payload = {
        body: obj["body"] as string,
        icon: obj["icon"] as string,
        link: obj["link"] as string,
        image: "image" in obj ? obj["image"] as string : undefined 
    } as direct
    const url = `http://localhost:3000/dash\?symbol=${symbol}\&source=${source}\&title=${title}\&time=${time}\&payload=${encodeURIComponent(JSON.stringify(payload))}`
    notifier.notify({
        title: title,
        message: payload.body,
        icon: payload.icon,
        open: url,
    })
}

const handleSource = (obj) => {
    const symbol = "BTC"
    const source = "SOURCE"
    const title = encodeURIComponent(obj["title"] as string) 
    const time  = encodeURIComponent(obj["time"] as string)
    const payload = {
        link: obj["link"] as string,
    } as source

    const url = `http://localhost:3000/dash\?symbol=${symbol}\&source=${source}\&title=${title}\&time=${time}\&payload=${encodeURIComponent(JSON.stringify(payload))}`
    notifier.notify({
        title: title,
        open: url,
    })
}

const handleUnknown = (obj) => {
    console.log("Unknown message")
    console.log(obj)
}

ws.on('message', (data) => {
  try {
    const obj = JSON.parse(data.toString())

    if ("type" in obj && obj["type"] === "direct") {
        handleDirect(obj)
    }else if ("source" in obj) {
        handleSource(obj)
    }else{
        handleUnknown(obj)
    }


  }catch(err) {
    console.log(err)
  }
})

ws.on('close', () => {
    // Object
    notifier.notify({
        title: 'Websockeet closed',
    });
})

ws.on('error', (err) => {
    // Object
    notifier.notify({
        title: 'Websockeet Error',
    });
})

const app = express();

app.get('/reload', (req, res) => {
  console.log('Express + TypeScript Server');
});

app.get('/restart', (req, res) => {
    console.log('Express + TypeScript Server');
});

app.get('/status', (req, res) => {
    if (ws.OPEN) {
        res.send(true)
    }else{
        res.send(false)
    }
});

app.listen(6000, () => {
  console.log(`[node]: Server is running at http://localhost:6000`);
});