import { Document, WithId } from 'mongodb';

interface Stats extends WithId<Document> {
	users: number;
}

export { Stats };
