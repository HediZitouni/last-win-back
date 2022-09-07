import { MongoClient } from 'mongodb';
const url = 'mongodb://localhost:27017/lastwin';
const collectionNames = ['users', 'stats', 'last'];

export async function initDatabase() {
	const client = new MongoClient(url);
	await client.connect();
	const collections = (await client.db().listCollections().toArray()).map((col) => col.name);
	const collectionsToCreate = collectionNames.filter((col) => !collections.includes(col)).map((col) => client.db().createCollection(col));
	await Promise.all(collectionsToCreate);
	client.close();
}

export async function getConnection(collectionName: string) {
	const client = new MongoClient(url);
	await client.connect();
	return {
		connection: client.db().collection(collectionName),
		client,
	};
}
