import http from 'http';
import https from 'https';
import fs from 'fs';

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

import { onConnect, Item, items, addItem, removeItem } from './db';

let config: any;
try {
  config = require("../config.json");
  console.log("Successfully loaded configuration file 'config.json'");
} catch (error) {
  console.log("Failed to load 'config.json': " + error);
  console.log("Using default configurations found in config_default.json instead");
  config = require("../config_default.json");
}

const app = express();

app.use(express.static('public/'));

const server = config.certChainLocation.length > 0
    ? https.createServer({
        cert: fs.readFileSync(config.certChainLocation),
        key: fs.readFileSync(config.certKeyLocation)
      }, app)
    : http.createServer(app);

const webSocketServer = new WebSocket.Server({ server });

webSocketServer.on('connection', (ws: WebSocket) => {
  async function processMessage(text: string) {
    const message: any = JSON.parse(text);
    switch (message.type) {
      case 'add': {
        const addedItem = await addItem(message.item.item, message.item.id);
        ws.send(JSON.stringify({
          type: 'confirmation',
          action: {
            type: 'add',
            item: addedItem,
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
        let removedItem: Item;
        try {
          removedItem = await removeItem(message.id);
        } catch (e) {
          ws.send(JSON.stringify({
            type: 'error',
            errorMessage: e.message,
            itemId: message.id,
          }));
          return;
        }
        // The items id has been removed from it when it got deleted from the data base.
        // Add it back so that the client can have it.
        removedItem.id = message.id;
        ws.send(JSON.stringify({
          type: 'confirmation',
          action: {
            type: 'remove',
            item: removedItem,
          },
        }));
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

server.listen(config.port, () => {
  if (config.certChainLocation.length > 0) {
    console.log('HTTPS server listening on port %s', config.port);
  } else {
    console.log('HTTP server listening on port %s', config.port);
  }
});
