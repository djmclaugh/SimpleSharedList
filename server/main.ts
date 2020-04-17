import { createServer } from 'http';
import * as express from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as WebSocket from 'ws';
import { onConnect, Item } from './db';
import { Connection } from 'typeorm';

const app = express();

app.use(express.static('public'));

const server = createServer(app);

const webSocketServer = new WebSocket.Server({ server });

let items: Item[] = [];

let connection: Connection|null = null;

onConnect(async(c) => {
  connection = c;
  items = await connection.manager.find(Item);
});

webSocketServer.on('connection', (ws: WebSocket) => {
  async function processMessage(text: string) {
    const message: any = JSON.parse(text);
    switch (message.type) {
      case 'add': {
        const item = new Item();
        item.item = message.item.item;
        if (message.item.id) {
          item.id = message.item.id;
        } else {
          item.id = uuidv4();
        }
        await connection!.manager.save(item);
        items.push(item);
        ws.send(JSON.stringify({
          type: 'confirmation',
          action: {
            type: 'add',
            item: item,
          },
        }));
        break;
      }
      case 'get':
        ws.send(JSON.stringify({
          type: 'update',
          items: items,
        }));
        break;
      case 'remove': {
        const indexToRemove = items.findIndex((x: Item) => x.id === message.id);
        if (indexToRemove === -1) {
          ws.send(JSON.stringify({
            type: 'error',
            errorMessage: `No items with id ${message.id} found`,
            itemId: message.id,
          }));
        } else {
          const item = items.splice(indexToRemove, 1)[0];
          // Save item since it will be removed once the item is deleted.
          const itemId = item.id;
          await connection!.manager.remove(item);
          ws.send(JSON.stringify({
            type: 'confirmation',
            action: {
              type: 'remove',
              item: {
                id: itemId,
                item: item.item,
              },
            },
          }));
        }
        break;
      }
      default:
        console.log(`Unknown message type: ${message.type}`);
        return;
    }
    webSocketServer.clients.forEach((client: WebSocket) => {
      client.send(JSON.stringify({
        type: 'update',
        items: items,
      }));
    });
  }

  ws.on('message', processMessage);

  ws.send(JSON.stringify({
    type: 'update',
    items: items,
  }));
});

server.listen(8080, () => {
  console.log('listening on port 8080');
});
