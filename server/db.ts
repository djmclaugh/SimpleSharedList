import { Entity, PrimaryColumn, Column, Connection, createConnection } from 'typeorm';

@Entity()
export class Item {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('text')
  item!: string;
}

let connection: Connection|null = null;

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
}).then(c => {
  console.log('successfully connected to database');
  connection = c;
  for (const cb of callbacks) {
    cb(connection);
  }
}).catch(error => {
  console.log('error connecting to database');
  console.log(error);
});
