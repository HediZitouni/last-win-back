import { MongoClient } from "mongodb";
const url = process.env.MONGODB_HOST || "";
const db = "lastwin2";
const collectionNames = ["users", "stats", "last"];

export async function initDatabase() {
  console.log(url);
  const client = new MongoClient(url);
  console.log("Creating client...");
  await client.connect();

  console.log("Connected to MongoDB server");
  const collections = (await client.db(db).listCollections().toArray()).map((col) => col.name);
  console.log("Collections in database:", collections);
  const collectionsToCreate = collectionNames
    .filter((col) => !collections.includes(col))
    .map((col) => client.db(db).createCollection(col));
  await Promise.all(collectionsToCreate);
  console.log(
    "Collections created:",
    collectionNames.filter((col) => !collections.includes(col))
  );
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
