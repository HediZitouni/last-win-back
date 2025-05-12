import { MongoClient } from "mongodb";
const url = process.env.MONGODB_HOST || "";
const db = "lastwin";
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
    console.log("Existing collections:", collections);
    const collectionsToCreate = collectionNames
      .filter((col) => !collections.includes(col))
      .map((col) => client.db(db).createCollection(col));
    if (collectionsToCreate.length > 0) {
      console.log("Creating missing collections:", collectionsToCreate);
    }
    await Promise.all(collectionsToCreate);
    console.log("All collections are ready.");
    client.close();
    console.log("MongoDB connection closed.");
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
