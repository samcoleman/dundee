
import { appRouter } from './api/root';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws from 'ws';

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