import { ObjectId } from "mongodb";
import { getConnection } from "../config/mongodb";
import { Last } from "./last.type";

export async function getLast(idGame: string): Promise<Last> {
  const { connection, client } = await getConnection("game");
  const last = (await connection.findOne({ _id: new ObjectId(idGame) })) as Last;
  client.close();
  return last;
}

export async function updateLast(idGame: string, idUser: string, newDateLast: number) {
  const { connection, client } = await getConnection("game");
  await connection.updateOne({ _id: new ObjectId(idGame) }, { $set: { last: { idUser, date: newDateLast } } });
  client.close();
}
