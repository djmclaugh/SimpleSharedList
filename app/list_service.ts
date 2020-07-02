import { onMessage, send } from './web_socket_service';

type Callback = (items: Item[]) => void;

export interface Item {
  id: string,
  item: string,
  index: number,
}

export interface Action {
  type: 'add'|'remove'|'move',
  item: Item,
  previousIndex?: number,
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
    // There is no need to add an undo for move actions since the user can just move the item back.
    // I prefer not to enable it because it might cause issues if another user removed an item,
    // making the list smaller, making the undo invalid...
    // Need to think more carfully about the whole undo feature.
    if (action.type != 'move') {
      actions.push(action);
    }
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

export function move(id: string, newPosition: number): string|null {
  return send('move', {
    id: id,
    index: newPosition,
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
  pendingUndo = Object.assign({}, actions[actions.length - 1]);
  let error = null;
  switch (pendingUndo.type) {
    case 'add':
      pendingUndo.type = 'remove';
      error = remove(pendingUndo.item.id);
      break;
    case 'remove':
      pendingUndo.type = 'add';
      error = addWithId(pendingUndo.item);
      break;
    case 'move':
      error = move(pendingUndo.item.id, pendingUndo.previousIndex!);
      break;
  }
  if (error) {
    pendingUndo = null;
  }
  return error;
}
