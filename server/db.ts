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
  for (const cb of callbacks) {
    cb(connection);
  }
}).catch(error => {
  console.log('Error connecting to database');
  console.log(error);
});
