import { MongoClient } from "mongodb";
const url = process.env.MONGODB_HOST || "";
const db = "lastwin2";
const collectionNames = ["users", "stats", "last"];

export async function initDatabase() {
  try {
    if (!url) {
      throw new Error("MongoDB URL is not defined in environment variables.");
    }
    console.log(`Initializing database connection on ${url}...`);
    const client = new MongoClient(url);
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB.");
    console.log("Checking for existing collections...");
    const collections = (await client.db(db).listCollections().toArray()).map((col) => col.name);

    const collectionsToCreate = collectionNames
      .filter((col) => !collections.includes(col))
      .map((col) => client.db(db).createCollection(col));
    await Promise.all(collectionsToCreate);
    client.close();
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

export async function getConnection(collectionName: string) {
  const client = new MongoClient(url);
  await client.connect();
  return {
    connection: client.db(db).collection(collectionName),
    client,
  };
}
