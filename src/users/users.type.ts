import { Document, ObjectId, WithId } from 'mongodb';

export interface UserMongodb extends WithId<Document> {
	_id: ObjectId;
	deviceId: string;
}

export interface User {
	id: string;
	deviceId: string;
}

export function toUser(userMongodb: UserMongodb): User {
	const { _id, deviceId } = userMongodb;
	return { id: _id.toString(), deviceId: deviceId.toString() };
}
