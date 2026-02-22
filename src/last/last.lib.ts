import { getConnection } from '../config/mongodb';
import { Last } from './last.type';

export async function getLast(gameId: string): Promise<Last> {
	const { connection, client } = await getConnection('last');
	const last = (await connection.findOne({ gameId })) as Last;
	client.close();
	return last;
}

export async function getOrCreateLast(gameId: string, idLastUser: string): Promise<Last> {
	let last = await getLast(gameId);
	if (!last) {
		await createLast(gameId, idLastUser);
		last = await getLast(gameId);
	}
	return last;
}

export async function createLast(gameId: string, idLastUser: string) {
	const { connection, client } = await getConnection('last');
	await connection.insertOne({
		gameId,
		idLastUser,
		date: Math.round(Date.now() / 1000),
	});
	client.close();
}

export async function updateLast(gameId: string, idLastUser: string, newDateLast: number) {
	const { connection, client } = await getConnection('last');
	await connection.updateOne({ gameId }, { $set: { idLastUser, date: newDateLast } });
	client.close();
}
