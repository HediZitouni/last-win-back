import { ObjectId } from 'mongodb';
import { getConnection } from '../config/mongodb';
import { Game, GameMongodb, toGame, toGameArray } from './games.type';

export async function getGames(): Promise<Game[]> {
	const { connection, client } = await getConnection('games');
	const games = (await connection.find().sort({ createdAt: -1 }).toArray()) as GameMongodb[];
	client.close();
	return toGameArray(games);
}

export async function getGameById(id: string): Promise<Game | null> {
	const { connection, client } = await getConnection('games');
	const game = (await connection.findOne({ _id: new ObjectId(id) })) as GameMongodb | null;
	client.close();
	return game ? toGame(game) : null;
}

export async function createGame(name: string, createdBy: string): Promise<Game> {
	const { connection, client } = await getConnection('games');
	const result = await connection.insertOne({
		name,
		createdBy,
		createdAt: Math.round(Date.now() / 1000),
		status: 'waiting',
		players: [createdBy],
	});
	const game = (await connection.findOne({ _id: result.insertedId })) as GameMongodb;
	client.close();
	return toGame(game);
}

export async function joinGame(gameId: string, userId: string): Promise<Game | null> {
	const { connection, client } = await getConnection('games');
	const game = (await connection.findOne({ _id: new ObjectId(gameId) })) as GameMongodb | null;
	if (!game) {
		client.close();
		return null;
	}
	const isPlayer = game.players.includes(userId);
	if (game.status === 'started' && !isPlayer) {
		client.close();
		return null;
	}
	if (!isPlayer) {
		await connection.updateOne({ _id: new ObjectId(gameId) }, { $addToSet: { players: userId } });
	}
	const updated = (await connection.findOne({ _id: new ObjectId(gameId) })) as GameMongodb;
	client.close();
	return toGame(updated);
}

export async function startGame(gameId: string, userId: string): Promise<Game | null> {
	const { connection, client } = await getConnection('games');
	const game = (await connection.findOne({ _id: new ObjectId(gameId) })) as GameMongodb | null;
	if (!game || game.createdBy !== userId || game.status !== 'waiting') {
		client.close();
		return null;
	}
	await connection.updateOne({ _id: new ObjectId(gameId) }, { $set: { status: 'started' } });
	const updated = (await connection.findOne({ _id: new ObjectId(gameId) })) as GameMongodb;
	client.close();
	return toGame(updated);
}
