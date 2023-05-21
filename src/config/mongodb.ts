import { MongoClient } from "mongodb";
const url = process.env.MONGODB_HOST || "";
const db = "lastwin";
const collectionNames = ["users", "stats", "last"];

export async function initDatabase() {
  const client = new MongoClient(url);
  await client.connect();
  const collections = (await client.db(db).listCollections().toArray()).map((col) => col.name);
  const collectionsToCreate = collectionNames
    .filter((col) => !collections.includes(col))
    .map((col) => client.db(db).createCollection(col));
  await Promise.all(collectionsToCreate);
  client.close();
}

export async function getConnection(collectionName: string) {
  const client = new MongoClient(url);
  await client.connect();
  return {
    connection: client.db(db).collection(collectionName),
    client,
  };
}
