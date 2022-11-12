import { ObjectId } from "mongodb";
import { getConnection } from "..//config/mongodb";

export const maxCredit = 10;

export async function setUserCredit() {
  try {
    const { connection, client } = await getConnection("game");
    await connection.updateMany({}, { $set: { "users.$[].credit": maxCredit } });
    console.log(`Credits has been reset to : ${maxCredit}`);
    client.close();
  } catch (error) {
    console.log(error);
  }
}

export async function decreaseUserCredit(idGame: number, idUser: number) {
  const { connection, client } = await getConnection("game");
  await connection.updateOne(
    { _id: new ObjectId(idGame), "users.idUser": new ObjectId(idUser) },
    { $inc: { "users.$.credit": -1 } }
  );
  client.close();
}
