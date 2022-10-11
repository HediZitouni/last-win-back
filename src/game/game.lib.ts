import { ObjectId } from 'mongodb';
import { getConnection } from '../config/mongodb';
import { Game, GameInput } from './game.type';

export async function createGame(gameInput: GameInput): Promise<string> {
	const { connection, client } = await getConnection('game');
	const { idOwner } = gameInput;
	const { insertedId } = await connection.insertOne({
		...gameInput,
		hashtag: `${Math.round(Date.now() / 1000)}`,
		users: [{ idUser: new ObjectId(idOwner), ready: true }],
		playing: 0,
	});
	client.close();
	return insertedId.toString();
}

export async function launchGame(idGame: string, idUser: string) {
	const { connection, client } = await getConnection('game');
	const _id = new ObjectId(idGame);
	const game = (await connection.findOne({ _id })) as Game;
	if (game.idOwner.toString() === idUser) {
		await connection.updateOne({ _id }, { $set: { playing: 1 } });
	}
	client.close();
}

export async function setUserReady(idGame: string, idUser: string) {
	const { connection, client } = await getConnection('game');
	await connection.updateOne({ _id: new ObjectId(idGame), 'users.idUser': new ObjectId(idUser) }, { $set: { 'users.$.ready': true } });
	client.close();
}

export async function getGameById(idGame: string): Promise<Game> {
	const { connection, client } = await getConnection('game');
	const game = (await connection.findOne({ _id: new ObjectId(idGame) })) as Game;
	client.close();
	if (game) {
		game.id = game._id.toString();
		game.users?.forEach((user) => (user.idUser = user.idUser.toString()));
	}
	return game;
}

export async function getIdGameByHashtag(hashtag: string): Promise<string> {
	const { connection, client } = await getConnection('game');
	const game = (await connection.findOne({ hashtag })) as Game;
	client.close();
	return game?._id.toString() || '';
}

export async function joinGame(idGame: string, idUser: string) {
	const game = await getGameById(idGame);
	if (!game) return;

	const idUsers = game.users?.map(({ idUser }) => idUser.toString());
	if (idUsers?.includes(idUser)) return;

	const { connection, client } = await getConnection('game');
	await connection.updateOne({ _id: new ObjectId(idGame) }, { $push: { users: { idUser: new ObjectId(idUser), ready: false } } });
	client.close();
}