import { ObjectId } from 'mongodb';
import { getConnection } from '..//config/mongodb';

export const maxCredit = 10;

export async function setUserCredit() {
	const { connection, client } = await getConnection('users');
	await connection.updateMany({}, { $set: { credit: maxCredit } });
	console.log(`Credits has been reset to : ${maxCredit}`);
	client.close();
}

export async function decreaseUserCredit(idUser: number) {
	const { connection, client } = await getConnection('users');
	await connection.updateOne({ _id: new ObjectId(idUser) }, { $inc: { credit: -1 } });
	client.close();
}
