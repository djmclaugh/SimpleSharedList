type Callback = (message: any) => void;

const callbacks = new Map<string, Callback[]>();

const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  console.log('Received: ' + event.data);
  const message = JSON.parse(event.data);
  for (const cb of getOrCreateList(message.type)) {
    cb(message);
  }
};

function getOrCreateList(type: string) {
  let list = callbacks.get(type);
  if (!list) {
    list = [];
    callbacks.set(type, list);
  }
  return list;
}

export function onMessage(type: string, cb: Callback) {
  getOrCreateList(type).push(cb);
}

export function stopListening(type: string, cb: Callback) {
  const list = getOrCreateList(type);
  const index = list.indexOf(cb);
  if (index !== -1) {
    list.splice(index, 1);
  }
}

export function send(type: string, message: any) {
  message.type = type;
  ws.send(JSON.stringify(message));
}
