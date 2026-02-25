import { ObjectId } from 'mongodb';
import { getConnection } from '../config/mongodb';
import { Game, GameMongodb, GameSettings, Player, toGame, toGameArray } from './games.type';
import { Last } from '../last/last.type';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export const DEFAULT_SETTINGS: GameSettings = {
	maxPlayers: 10,
	maxCredits: 10,
	timeLimitSeconds: 60,
	showOtherCredits: true,
	showOtherScores: true,
	showOtherIsLast: true,
};

function generateCode(): string {
	let code = '';
	for (let i = 0; i < CODE_LENGTH; i++) {
		code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
	}
	return code;
}

function createPlayer(userId: string, index: number, maxCredits: number): Player {
	return { userId, name: `Joueur_${index + 1}`, score: 0, credit: maxCredits };
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
	const player = createPlayer(createdBy, 0, DEFAULT_SETTINGS.maxCredits);
	const result = await connection.insertOne({
		name,
		code,
		createdBy,
		createdAt: Math.round(Date.now() / 1000),
		status: 'waiting',
		players: [player],
		settings: DEFAULT_SETTINGS,
		configured: false,
		startedAt: null,
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
		if (game.players.length >= game.settings.maxPlayers) {
			client.close();
			return null;
		}
		const player = createPlayer(userId, game.players.length, game.settings.maxCredits);
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
	await connection.updateOne(
		{ _id: new ObjectId(gameId) },
		{ $set: { status: 'started', startedAt: Math.round(Date.now() / 1000) } },
	);
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
		const maxCredits = game.settings?.maxCredits ?? DEFAULT_SETTINGS.maxCredits;
		const updates: Record<string, number> = {};
		game.players.forEach((_, i) => {
			updates[`players.${i}.credit`] = maxCredits;
		});
		await connection.updateOne({ _id: game._id }, { $set: updates });
	}
	console.log('Credits reset for all started games');
	client.close();
}

export async function updateGameSettings(gameId: string, userId: string, settings: GameSettings): Promise<Game | null> {
	const { connection, client } = await getConnection('games');
	const game = (await connection.findOne({ _id: new ObjectId(gameId) })) as GameMongodb | null;
	if (!game || game.createdBy !== userId || game.status !== 'waiting') {
		client.close();
		return null;
	}
	const creditUpdates: Record<string, number> = {};
	game.players.forEach((_, i) => {
		creditUpdates[`players.${i}.credit`] = settings.maxCredits;
	});
	await connection.updateOne(
		{ _id: new ObjectId(gameId) },
		{ $set: { settings, configured: true, ...creditUpdates } },
	);
	const updated = (await connection.findOne({ _id: new ObjectId(gameId) })) as GameMongodb;
	client.close();
	return toGame(updated);
}

export function getPlayerFromGame(game: Game, userId: string): Player | undefined {
	return game.players.find((p) => p.userId === userId);
}

export function enhancePlayersWithLast(players: Player[], last: Last | null, game?: Game): (Player & { isLast?: boolean })[] {
	if (!last) return players;
	let now = Math.round(Date.now() / 1000);
	if (game?.startedAt && game?.settings?.timeLimitSeconds) {
		const endTime = game.startedAt + game.settings.timeLimitSeconds;
		if (now > endTime) now = endTime;
	}
	return players.map((p) => {
		if (p.userId === last.idLastUser) {
			return { ...p, score: p.score + (now - last.date), isLast: true };
		}
		return p;
	});
}

export async function finalizeExpiredGame(game: Game): Promise<void> {
	if (!game.settings.timeLimitSeconds || !game.startedAt) return;
	const endTime = game.startedAt + game.settings.timeLimitSeconds;
	if (Math.round(Date.now() / 1000) < endTime) return;
	const { connection, client } = await getConnection('last');
	const result = await connection.findOneAndUpdate(
		{ gameId: game.id, date: { $lt: endTime } },
		{ $set: { date: endTime } },
	);
	client.close();
	const last = result.value as Last | null;
	if (!last) return;
	const scoreToAdd = endTime - last.date;
	if (scoreToAdd > 0) {
		await addPlayerScore(game.id, last.idLastUser, scoreToAdd);
	}
}
