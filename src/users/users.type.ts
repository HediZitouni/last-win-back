import { Document, ObjectId, WithId } from 'mongodb';

export interface UserMongodb extends WithId<Document> {
	_id: ObjectId;
	deviceId: ObjectId;
	name: string;
	score: number;
	credit: number;
}

export interface User extends UserSafe {
	id: string;
	deviceId: string;
	isLast?: boolean;
}

export interface UserSafe {
	name: string;
	score: number;
	credit: number;
}

export function toUser(userMongodb: UserMongodb): User {
	const { _id, deviceId, ...properties } = userMongodb;
	return { id: _id.toString(), deviceId: deviceId.toString(), ...properties } as User;
}

export function toUserArray(usersMongodb: UserMongodb[]): User[] {
	return usersMongodb.map((user) => toUser(user));
}

export function toUserSafe(userMongodb: User): UserSafe {
	const { id, deviceId, ...properties } = userMongodb;
	return { ...properties } as UserSafe;
}

export function toUserSafeArray(usersMongodb: User[]): UserSafe[] {
	return usersMongodb.map((user) => toUserSafe(user));
}
