import { ObjectId } from 'mongodb';
import { getConnection } from '../config/mongodb';
import { Game, GameMongodb, Player, toGame, toGameArray } from './games.type';
import { Last } from '../last/last.type';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
export const MAX_CREDIT = 10;

function generateCode(): string {
	let code = '';
	for (let i = 0; i < CODE_LENGTH; i++) {
		code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
	}
	return code;
}

function createPlayer(userId: string, index: number): Player {
	return { userId, name: `Joueur_${index + 1}`, score: 0, credit: MAX_CREDIT };
}

export async function getGamesByPlayer(userId: string): Promise<Game[]> {
	const { connection, client } = await getConnection('games');
	const games = (await connection.find({ 'players.userId': userId }).sort({ createdAt: -1 }).toArray()) as GameMongodb[];
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
	const code = generateCode();
	const player = createPlayer(createdBy, 0);
	const result = await connection.insertOne({
		name,
		code,
		createdBy,
		createdAt: Math.round(Date.now() / 1000),
		status: 'waiting',
		players: [player],
	});
	const game = (await connection.findOne({ _id: result.insertedId })) as GameMongodb;
	client.close();
	return toGame(game);
}

export async function joinGameByCode(code: string, userId: string): Promise<Game | null> {
	const { connection, client } = await getConnection('games');
	const game = (await connection.findOne({ code: code.toUpperCase() })) as GameMongodb | null;
	if (!game) {
		client.close();
		return null;
	}
	const isPlayer = game.players.some((p) => p.userId === userId);
	if (game.status === 'started' && !isPlayer) {
		client.close();
		return null;
	}
	if (!isPlayer) {
		const player = createPlayer(userId, game.players.length);
		await connection.updateOne({ _id: game._id }, { $push: { players: player } });
	}
	const updated = (await connection.findOne({ _id: game._id })) as GameMongodb;
	client.close();
	return toGame(updated);
}

export async function rejoinGame(gameId: string, userId: string): Promise<Game | null> {
	const { connection, client } = await getConnection('games');
	const game = (await connection.findOne({ _id: new ObjectId(gameId) })) as GameMongodb | null;
	if (!game) {
		client.close();
		return null;
	}
	if (!game.players.some((p) => p.userId === userId)) {
		client.close();
		return null;
	}
	client.close();
	return toGame(game);
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

export async function updatePlayerName(gameId: string, userId: string, name: string): Promise<Game | null> {
	const { connection, client } = await getConnection('games');
	await connection.updateOne(
		{ _id: new ObjectId(gameId), 'players.userId': userId },
		{ $set: { 'players.$.name': name } },
	);
	const game = (await connection.findOne({ _id: new ObjectId(gameId) })) as GameMongodb;
	client.close();
	return game ? toGame(game) : null;
}

export async function addPlayerScore(gameId: string, userId: string, scoreToAdd: number): Promise<void> {
	const { connection, client } = await getConnection('games');
	await connection.updateOne(
		{ _id: new ObjectId(gameId), 'players.userId': userId },
		{ $inc: { 'players.$.score': scoreToAdd } },
	);
	client.close();
}

export async function decreasePlayerCredit(gameId: string, userId: string): Promise<void> {
	const { connection, client } = await getConnection('games');
	await connection.updateOne(
		{ _id: new ObjectId(gameId), 'players.userId': userId },
		{ $inc: { 'players.$.credit': -1 } },
	);
	client.close();
}

export async function resetAllCredits(): Promise<void> {
	const { connection, client } = await getConnection('games');
	const games = (await connection.find({ status: 'started' }).toArray()) as GameMongodb[];
	for (const game of games) {
		const updates: Record<string, number> = {};
		game.players.forEach((_, i) => {
			updates[`players.${i}.credit`] = MAX_CREDIT;
		});
		await connection.updateOne({ _id: game._id }, { $set: updates });
	}
	console.log(`Credits reset to ${MAX_CREDIT} for all started games`);
	client.close();
}

export function getPlayerFromGame(game: Game, userId: string): Player | undefined {
	return game.players.find((p) => p.userId === userId);
}

export function enhancePlayersWithLast(players: Player[], last: Last | null): (Player & { isLast?: boolean })[] {
	if (!last) return players;
	const now = Math.round(Date.now() / 1000);
	return players.map((p) => {
		if (p.userId === last.idLastUser) {
			return { ...p, score: p.score + (now - last.date), isLast: true };
		}
		return p;
	});
}
