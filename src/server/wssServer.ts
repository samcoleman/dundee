import WebSocket from 'ws';
import notifier from 'node-notifier';

const url = 'wss://news.treeofalpha.com/ws';

const ws = new WebSocket(url, {
  headers: {
    Cookie:
      'tree_login_cookie=s%3AkT_W-vPFN1oEgl2LER1tOIICWOxw3Ral.gL6yrs9481uvZA33BP%2FlMheSbgZIX97SialIk%2FhWYMU',
  },
});

ws.on('open', () => {
  console.log('connected');
  // Object
  notifier.notify({
    title: 'Connected',
    message: 'Successfully connected to websocket server',
    open: `http://localhost:4000`,
  });
});

ws.on('message', (data) => {
  try {
    const obj = JSON.parse(data.toString())
    // Object
    notifier.notify({
      title: 'Message',
      message: data.toString(),
        open: `http://localhost:4000?data=${data}`,
    });
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