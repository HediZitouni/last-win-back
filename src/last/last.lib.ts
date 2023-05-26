import { ObjectId } from "mongodb";
import { getConnection } from "../config/mongodb";
import { Last, LastMongo } from "./last.type";
import { Game } from "~/game/game.type";
import { enhanceUser } from "~/users/users.helper";

export async function getLast(idGame: string): Promise<Last> {
  const { connection, client } = await getConnection("game");
  const lastMongo = (await connection.findOne(
    { _id: new ObjectId(idGame) },
    { projection: { _id: 0, last: 1 } }
  )) as LastMongo;
  client.close();
  const { _id, ...last } = lastMongo;
  return last;
}

export async function updateLast(idGame: string, idUser: string, newDateLast: number) {
  const { connection, client } = await getConnection("game");
  const game = (
    await connection.findOneAndUpdate(
      { _id: new ObjectId(idGame) },
      { $set: { last: { idUser, date: newDateLast } } },
      { returnDocument: "after" }
    )
  ).value as Game;
  client.close();
  await enhanceUser(game);
  return game;
}
