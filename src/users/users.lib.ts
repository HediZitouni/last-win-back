import { Last } from '~/last/last.type';
import { toUser, toUserArray, User, UserMongodb } from './users.type';
import { getOrCreateStats } from '~/stats/stats.lib';
import { Stats } from '~/stats/stats.type';
import { getConnection } from '~/config/mongodb';
import { ObjectId } from 'mongodb';
import { maxCredit } from '~/credit/credit.lib';

export async function getUsers(): Promise<User[]> {
	const { connection, client } = await getConnection('users');
	const users = (await connection.find().toArray()) as UserMongodb[];
	client.close();
	return toUserArray(users);
}

export async function setUserScore(last: Last, newDateLast: number) {
	const { connection, client } = await getConnection('users');
	const { idLastUser, date } = last;
	const scoreToAdd = newDateLast - date;
	await connection.updateOne({ _id: new ObjectId(idLastUser) }, { $inc: { score: scoreToAdd } });
	client.close();
}

export async function getOrCreateUser(deviceId: string): Promise<User> {
	const { connection, client } = await getConnection('users');
	const [user] = (await connection.find({ deviceId }).toArray()) as UserMongodb[];

	if (!user) {
		const stats = await getOrCreateStats();
		const userName = generateUserName(stats);
		await connection.insertOne({ deviceId, name: userName, score: 0, credit: maxCredit });
		const [createdUser] = (await connection.find({ deviceId }).toArray()) as UserMongodb[];
		return toUser(createdUser);
	}
	client.close();
	return toUser(user);
}

export async function setUserName(id: string, name: string) {
	const { connection, client } = await getConnection('users');
	await connection.updateOne({ _id: new ObjectId(id) }, { $set: { name } });
	client.close();
}

export async function getUserById(id: string): Promise<User> {
	const { connection, client } = await getConnection('users');
	const user = (await connection.findOne({ _id: new ObjectId(id) })) as UserMongodb;
	client.close();
	return toUser(user);
}

function generateUserName(stats: Stats): string {
	const { users } = stats;
	return `User_${users + 1}`;
}
