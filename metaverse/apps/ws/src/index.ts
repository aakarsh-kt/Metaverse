import { WebSocketServer } from 'ws';
import { User } from './User';

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', function connection(ws) {
  let user=new User(ws);
  console.log("user connected")
  ws.on('error', console.error);
 
  ws.on('close', function close() {
    console.log('disconnected');
    user?.destroy();
  });


});