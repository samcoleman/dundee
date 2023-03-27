import WebSocket from 'ws';
import notifier from 'node-notifier';
import HandyStorage from "handy-storage";

const local = new HandyStorage<string>();
local.connect('/keys.json')

const url = 'wss://news.treeofalpha.com/ws';

const ws = new WebSocket(url, {
  headers: {
    Cookie:
      'tree_login_cookie=s%3AkT_W-vPFN1oEgl2LER1tOIICWOxw3Ral.gL6yrs9481uvZA33BP%2FlMheSbgZIX97SialIk%2FhWYMU',
  },
});

ws.on('open', () => {
  console.log('connected');
  local.setState('ws')

  // Object
  notifier.notify({
    title: 'Connected',
    message: 'Successfully connected to websocket server',
    open: `http://localhost:4000`,
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
    const url = `http://localhost:3000/dash\?symbol=${symbol}s\&source=${source}\&title=${title}\&time=${time}\&payload=${encodeURIComponent(JSON.stringify(payload))}`
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




/*
const wss = new ws.Server({
  port: 3001,
});
const handler = applyWSSHandler({ wss, router: appRouter, createContext });

wss.on('connection', (ws) => {
  console.log(` Connection (${wss.clients.size})`);
  ws.once('close', () => {
    console.log(` Connection (${wss.clients.size})`);
  });
});
console.log('✅ WebSocket Server listening on ws://localhost:3001');

process.on('SIGTERM', () => {
  console.log('SIGTERM');
  handler.broadcastReconnectNotification();
  wss.close();
});
*/