import { Document, ObjectId, WithId } from 'mongodb';

export type GameStatus = 'waiting' | 'started';

export interface GameMongodb extends WithId<Document> {
	_id: ObjectId;
	name: string;
	createdBy: string;
	createdAt: number;
	status: GameStatus;
	players: string[];
}

export interface Game {
	id: string;
	name: string;
	createdBy: string;
	createdAt: number;
	status: GameStatus;
	players: string[];
}

export function toGame(gameMongodb: GameMongodb): Game {
	const { _id, ...properties } = gameMongodb;
	return { id: _id.toString(), ...properties } as Game;
}

export function toGameArray(gamesMongodb: GameMongodb[]): Game[] {
	return gamesMongodb.map((game) => toGame(game));
}
