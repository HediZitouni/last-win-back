import { Document, WithId } from 'mongodb';

interface Last extends WithId<Document> {
	id: string;
	gameId: string;
	idLastUser: string;
	date: number;
}

export { Last };
