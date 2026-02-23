import { Document, ObjectId, WithId } from 'mongodb';

export type GameStatus = 'waiting' | 'started';

export interface GameSettings {
	maxPlayers: number;
	maxCredits: number;
	timeLimitMinutes: number | null;
	showOtherCredits: boolean;
	showOtherScores: boolean;
	showOtherIsLast: boolean;
}

export interface Player {
	userId: string;
	name: string;
	score: number;
	credit: number;
}

export interface GameMongodb extends WithId<Document> {
	_id: ObjectId;
	name: string;
	code: string;
	createdBy: string;
	createdAt: number;
	status: GameStatus;
	players: Player[];
	settings: GameSettings;
	configured: boolean;
	startedAt: number | null;
}

export interface Game {
	id: string;
	name: string;
	code: string;
	createdBy: string;
	createdAt: number;
	status: GameStatus;
	players: Player[];
	settings: GameSettings;
	configured: boolean;
	startedAt: number | null;
}

export function toGame(gameMongodb: GameMongodb): Game {
	const { _id, ...properties } = gameMongodb;
	return { id: _id.toString(), ...properties } as Game;
}

export function toGameArray(gamesMongodb: GameMongodb[]): Game[] {
	return gamesMongodb.map((game) => toGame(game));
}
