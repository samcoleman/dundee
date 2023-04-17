
import { appRouter } from './api/root';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws, { WebSocket } from 'ws';
import { LocalStorage } from "node-localstorage";
import { z } from 'zod';
import { type Message } from '../shared/types';
import { parseSource, parseSymbols } from '../shared/messageParse';

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
    Cookie: `tree_login_cookie=${process.env.TREE_COOKIE as string}`,
  },
});

type log = {
  [key: string]: {'incoming': unknown, 'parsed': Message} 
}

const logMessage = (location: string, obj: unknown, message: Message ) => {
  const logString  = localstorage.getItem(location)
  const logHistory = logString ? JSON.parse(logString) as log : undefined

  if (logHistory) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    logHistory[new Date().getTime().toString()] = {'incoming': obj, 'parsed': message}
    localstorage.setItem(location, JSON.stringify(logHistory))
  } else {
    const log : log = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [new Date().getTime().toString()]: {'incoming': obj, 'parsed': message}
    }
    localstorage.setItem(location, JSON.stringify(log))
  }

}

const suggestions = z.array(z.object({
  found: z.array(z.string()),
  coin: z.string(),
  symbols: z.array(z.object({
    symbol: z.string(),
    exchange: z.string()
  }))}))

const handleSource = (obj: unknown) => {
  const sourceMessage = z.object({
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
    ...sourceMessage,
    source: parseSource(sourceMessage.source),
    symbols: parseSymbols(sourceMessage.suggestions.map(suggestion => suggestion.symbols.map(s => s.symbol)).flat()),
    body: ''
  }

  return message
};

const handleType = (obj: unknown) => {
  const typeMessage = z.object({
    title: z.string(),
    body: z.string(),
    icon: z.string(),
    image: z.string().optional(),
    link: z.string(),
    time: z.number(),
    _id: z.string(),
    type: z.string(),
    suggestions: suggestions})
  .parse(obj)

  const message : Message = {
    ...typeMessage,
    source: parseSource(typeMessage.type),
    url: typeMessage.link,
    symbols: parseSymbols(typeMessage.suggestions.map(suggestion => suggestion.symbols.map(s => s.symbol)).flat()),
  }

  return message
};


const handleUnknown = (obj: unknown) => {
  console.log('Unknown message');
  return obj as Message
};

tws.on('open', () => {
  console.log('[TreeOfAlpha] connected');
});


tws.on('message', (data) => {
  try {
    // This is as can be any shape
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const obj = JSON.parse(data.toString());

    let message : Message
    if ('source' in obj) {
      console.log('Source message')
      message = handleSource(obj);
    } else if ('type' in obj){
      console.log('Type message')
      message = handleType(obj);
    } else {
      console.log('Unknown message')
      message = handleUnknown(obj);
    }

    console.log(message)
    if (message) {
      void caller.tree.message(message);
      logMessage('handled_messages.json', obj, message)
    }else{
      logMessage('unhandled_messages.json', obj, message)
    }

  } catch (err) {
    console.log(err);
  }
});

tws.on('close', () => {
  // Object
  console.log('[TreeOfAlpha] disconnected');
});

tws.on('error', () => {
  // Object
  console.log('[TreeOfAlpha] error');
});

