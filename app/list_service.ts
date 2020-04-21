import { onMessage, send } from './web_socket_service';

type Callback = (items: Item[]) => void;

export interface Item {
  id: string,
  item: string,
}

export interface Action {
  type: 'add'|'remove',
  item: Item
}

let items: Item[] = [];
const callbacks: Callback[] = [];
const actions: Action[] = [];
let pendingUndo: Action|null = null;

onMessage('update', (message: any) => {
  items = message.items;
  for (const cb of callbacks) {
    cb(getItems());
  }
});

onMessage('confirmation', (message: any) => {
  const action: Action = message.action;
  if (pendingUndo && pendingUndo.type === action.type && pendingUndo.item.id === action.item.id) {
    actions.pop();
    pendingUndo = null;
  } else {
    actions.push(action);
  }
});

onMessage('error', (message: any) => {
  if (pendingUndo && pendingUndo.item.id === message.itemId) {
    actions.pop();
    pendingUndo = null;
  }
  send('get', {});
});

export function getLastAction(): Action|null {
  if (actions.length > 0) {
    return actions[actions.length - 1];
  }
  return null;
}

export function getItems() {
  return items.concat();
}

export function onUpdate(cb: Callback) {
  callbacks.push(cb);
}

export function add(item: string): string|null {
  return send('add', {
    item: {
      item: item,
    },
  });
}

function addWithId(item: Item): string|null {
  return send('add', {
    item: item,
  });
}

export function remove(id: string): string|null {
  return send('remove', {
    id: id,
  });
}

export function canUndo(): boolean {
  if (pendingUndo != null) {
    return false;
  } else if (actions.length === 0) {
    return false;
  }
  return true;
}

export function undo(): string|null {
  if (pendingUndo != null) {
    throw new Error('Currently processing an undo. Cannot currently commence a second one.');
  } else if (actions.length === 0) {
    throw new Error('No actions to undo');
  }
  pendingUndo = actions[actions.length - 1];
  pendingUndo.type = pendingUndo.type === 'add' ? 'remove' : 'add';
  let error = null;
  if (pendingUndo.type === 'add') {
    error = addWithId(pendingUndo.item);
  } else {
    error = remove(pendingUndo.item.id);
  }
  if (error) {
    pendingUndo = null;
  }
  return error;
}
