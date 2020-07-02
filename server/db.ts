import { BaseEntity, Entity, PrimaryColumn, Column, Connection, Generated, createConnection } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

let connection: Connection|null = null;
export let items: Item[] = [];

@Entity()
export class Item extends BaseEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('text')
  item!: string;

  @Column('int', {unique: true})
  index!: number;
}

export async function addItem(itemText: string, itemId: string = ''): Promise<Item> {
  const item = new Item();
  item.item = itemText;
  if (itemId.length > 0) {
    item.id = itemId;
  } else {
    item.id = uuidv4();
  }
  item.index = items.length;
  await item.save();
  items.push(item);
  return item;
}

export async function removeItem(itemId: string): Promise<Item> {
  const indexToRemove = items.findIndex((x: Item) => x.id === itemId);
  if (indexToRemove === -1) {
    throw new Error(`No items with id ${itemId} found`);
  }
  await connection!.transaction(async transactionalEntityManager => {
    const itemToRemove = items[indexToRemove];
    await transactionalEntityManager.remove(itemToRemove);
    for (let i = indexToRemove; i < items.length - 1; ++i) {
      items[i + 1].index = i;
      await transactionalEntityManager.save(items[i + 1]);
    }
  });
  return items.splice(indexToRemove, 1)[0];
}

export async function moveItem(itemId: string, newPosition: number): Promise<Item> {
  if (newPosition >= items.length || newPosition < 0) {
    throw new Error(`Index ${newPosition} is out of range.`);
  }
  const indexToMove = items.findIndex((x: Item) => x.id === itemId);
  if (indexToMove === -1) {
    throw new Error(`No items with id ${itemId} found`);
  }
  await connection!.transaction(async transactionalEntityManager => {
    const itemToMove = items[indexToMove];
    itemToMove.index = -1;
    await transactionalEntityManager.save(itemToMove);
    if (indexToMove < newPosition) {
      for (let i = indexToMove + 1; i <= newPosition; ++i) {
        items[i].index = i - 1;
        await transactionalEntityManager.save(items[i]);
      }
    } else {
      for (let i = indexToMove - 1; i >= newPosition; --i) {
        items[i].index = i + 1;
        await transactionalEntityManager.save(items[i]);
      }
    }
    itemToMove.index = newPosition;
    await transactionalEntityManager.save(itemToMove);
  });
  const movedItem = items.splice(indexToMove, 1)[0];
  items.splice(newPosition, 0, movedItem);
  return movedItem;
}

const callbacks: ((connection: Connection) => void)[] = [];
export function onConnect(cb: (connection: Connection) => void) {
  callbacks.push(cb);
  if (connection) {
    cb(connection);
  }
}

createConnection({
  type: 'sqlite',
  database: 'list.db',
  entities: [
    Item,
  ],
  synchronize: true,
}).then(async (c) => {
  console.log('Successfully connected to database');
  connection = c;
  items = await connection.manager.find(Item);
  items.sort((a, b) => {
    return a.index - b.index;
  });
  for (const cb of callbacks) {
    cb(connection);
  }
}).catch(error => {
  console.log('Error connecting to database');
  console.log(error);
});
