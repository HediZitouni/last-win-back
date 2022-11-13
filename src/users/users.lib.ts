import { Last } from "../last/last.type";
import { toUser, toUserArray, User, UserMongodb } from "./users.type";
import { getOrCreateStats } from "../stats/stats.lib";
import { Stats } from "../stats/stats.type";
import { getConnection } from "../config/mongodb";
import { ObjectId } from "mongodb";
import { maxCredit } from "../credit/credit.lib";
import { getGameById } from "~/game/game.lib";

export async function getUsers(): Promise<User[]> {
  const { connection, client } = await getConnection("users");
  const users = (await connection.find().toArray()) as UserMongodb[];
  client.close();
  return toUserArray(users);
}

export async function setUserScore(idGame: string, last: Last, newDateLast: number) {
  const { connection, client } = await getConnection("game");
  const { idUser, date } = last;
  const scoreToAdd = newDateLast - date;
  await connection.updateOne(
    { _id: new ObjectId(idGame), "users.idUser": new ObjectId(idUser) },
    { $inc: { "users.$.score": scoreToAdd } }
  );
  client.close();
}

export async function getOrCreateUser(deviceId: string): Promise<User> {
  const { connection, client } = await getConnection("users");
  const [user] = (await connection.find({ deviceId }).toArray()) as UserMongodb[];

  if (!user) {
    const stats = await getOrCreateStats();
    const userName = generateUserName(stats);
    await connection.insertOne({ deviceId, name: userName });
    const [createdUser] = (await connection.find({ deviceId }).toArray()) as UserMongodb[];
    return toUser(createdUser);
  }
  client.close();
  return toUser(user);
}

export async function setUserName(id: string, name: string) {
  const { connection, client } = await getConnection("users");
  await connection.updateOne({ _id: new ObjectId(id) }, { $set: { name } });
  client.close();
}

export async function getUserById(id: string): Promise<User> {
  const { connection, client } = await getConnection("users");
  const user = (await connection.findOne({ _id: new ObjectId(id) })) as UserMongodb;
  client.close();
  return toUser(user);
}

export async function getUsersByIds(ids: string[]): Promise<User[]> {
  const { connection, client } = await getConnection("users");
  const objectIds = ids.map((id) => new ObjectId(id));
  const users = (await connection.find({ _id: { $in: [objectIds] } }).toArray()) as UserMongodb[];
  client.close();
  return toUserArray(users);
}

function generateUserName(stats: Stats): string {
  const { users } = stats;
  return `User_${users + 1}`;
}

export async function getGameUsers(idGame: string): Promise<User[]> {
  const { connection, client } = await getConnection("users");
  const users = (await connection.find({ games: idGame }).toArray()) as UserMongodb[];
  client.close();
  return toUserArray(users);
}

export async function addGameToUser(idGame: string, idUser: string) {
  const { connection, client } = await getConnection("users");
  await connection.updateOne({ _id: new ObjectId(idUser) }, { $push: { games: idGame } });
  client.close();
}
