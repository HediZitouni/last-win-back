import { Document, ObjectId, WithId } from 'mongodb';

export interface UserMongodb extends WithId<Document> {
	_id: ObjectId;
	name: string;
	score: number;
}

export interface User {
	id: string;
	name: string;
	score: number;
}

export function toUser(userMongodb: UserMongodb): User {
	const { _id, ...properties } = userMongodb;
	return { id: _id.toString(), ...properties } as User;
}

export function toUserArray(usersMongodb: UserMongodb[]): User[] {
	return usersMongodb.map((user) => toUser(user));
}
