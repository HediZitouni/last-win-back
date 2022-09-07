import { ObjectId } from 'mongodb';
import { getConnection } from '../config/mongodb';
import { Last } from './last.type';
const _id = new ObjectId('63190f12785c77a817e6ef5a');

export async function getLast(): Promise<Last> {
	const { connection, client } = await getConnection('last');
	const last = (await connection.findOne({ _id })) as Last;
	client.close();
	return last;
}

export async function getOrCreateLast(idLastUser: string): Promise<Last> {
	let last = await getLast();
	if (!last) {
		await createLast(idLastUser);
		last = await getLast();
	}
	return last;
}

export async function createLast(idLastUser: string) {
	const { connection, client } = await getConnection('last');
	await connection.insertOne({
		_id,
		idLastUser,
		date: Math.round(Date.now() / 1000),
	});

	client.close();
}

export async function updateLast(idLastUser: string, newDateLast: number) {
	const { connection, client } = await getConnection('last');
	await connection.updateOne({ _id }, { $set: { idLastUser, date: newDateLast } });
	client.close();
}
