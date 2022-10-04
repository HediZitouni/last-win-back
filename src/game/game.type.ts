import { Document, WithId } from 'mongodb';

export interface Game extends WithId<Document> {
	id: string;
	hashtag: string;
	name: string;
	credits: number;
	time: number; // minutes
	blind: boolean;
	maxPlayers: number; // To avoid bots
	idOwner: string;
	users?: UserReady[];
}

export interface GameInput {
	name?: string;
	credits?: number;
	time?: number;
	blind?: boolean;
	maxPlayers?: number;
	idOwner?: string;
}

interface UserReady {
	idUser: string;
	ready: boolean;
}
