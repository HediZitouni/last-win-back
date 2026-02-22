import { toUser, User, UserMongodb } from './users.type';
import { getConnection } from '../config/mongodb';
import { ObjectId } from 'mongodb';

export async function getOrCreateUser(deviceId: string): Promise<User> {
	const { connection, client } = await getConnection('users');
	const [user] = (await connection.find({ deviceId }).toArray()) as UserMongodb[];

	if (!user) {
		await connection.insertOne({ deviceId });
		const [createdUser] = (await connection.find({ deviceId }).toArray()) as UserMongodb[];
		client.close();
		return toUser(createdUser);
	}
	client.close();
	return toUser(user);
}

export async function getUserById(id: string): Promise<User | null> {
	const { connection, client } = await getConnection('users');
	const user = (await connection.findOne({ _id: new ObjectId(id) })) as UserMongodb | null;
	client.close();
	return user ? toUser(user) : null;
}
