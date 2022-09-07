import { ObjectId } from 'mongodb';
import { getConnection } from '../config/mongodb';
import { Stats } from './stats.type';
const _id = new ObjectId('0000000133bb2491a9b16747');

export async function getOrCreateStats(): Promise<Stats> {
	let stats = await getStats();
	if (!stats) {
		await createStats();
	} else {
		await increaseUsersStats();
	}
	stats = await getStats();
	return stats;
}

async function getStats(): Promise<Stats> {
	const { connection, client } = await getConnection('stats');
	const stats = (await connection.findOne({ _id })) as Stats;
	client.close();
	return stats;
}

async function createStats() {
	const { connection, client } = await getConnection('stats');

	await connection.insertOne({
		_id,
		users: 1,
	});

	client.close();
}

async function increaseUsersStats() {
	const { connection, client } = await getConnection('stats');
	await connection.updateOne({ _id }, { $inc: { users: 1 } });
	client.close();
}
