import { ObjectId } from "mongodb";
import { getWsById } from "~/config/websocket/websocket";
import { addGameToUser } from "~/users/users.lib";
import { getConnection } from "../config/mongodb";
import { Game, GameInput } from "./game.type";

export async function createGame(gameInput: GameInput): Promise<string> {
  const { connection, client } = await getConnection("game");
  const { idOwner } = gameInput;
  const { insertedId } = await connection.insertOne({
    ...gameInput,
    hashtag: `${Math.round(Date.now() / 1000)}`,
    users: [{ idUser: new ObjectId(idOwner), ready: true }],
    last: { idUser: null, date: null },
  });
  client.close();
  return insertedId.toString();
}

export async function launchGame(idGame: string, idUser: string) {
  const { connection, client } = await getConnection("game");
  const _id = new ObjectId(idGame);
  const game = (await connection.findOne({ _id })) as Game;
  if (game.idOwner.toString() !== idUser) {
    throw new Error("Player is not the owner of the game");
  }
  if (game.users?.some(({ ready }) => !ready)) {
    throw new Error("Some players of the game are not ready");
  }
  if (game.startedAt) {
    throw new Error("Game already started");
  }
  const socketsOfGame = getWsById(game.users?.map(({ idUser }) => idUser.toString()) || []);
  socketsOfGame.forEach((s) =>
    s.send(JSON.stringify({ message: "gameStarted", content: { idGame: game._id.toString() } }))
  );
  await connection.updateOne({ _id }, { $set: { startedAt: Math.round(Date.now() / 1000) } });
  client.close();
}

export async function setUserReady(idGame: string, idUser: string) {
  const { connection, client } = await getConnection("game");
  await connection.updateOne(
    { _id: new ObjectId(idGame), "users.idUser": new ObjectId(idUser) },
    { $set: { "users.$.ready": true } }
  );
  client.close();
}

export async function getGameById(idGame: string): Promise<Game> {
  const { connection, client } = await getConnection("game");
  const game = (await connection.findOne({ _id: new ObjectId(idGame) })) as Game;
  client.close();
  if (game) {
    game.id = game._id.toString();
    game.users?.forEach((user) => (user.idUser = user.idUser.toString()));
  }
  return game;
}

export async function getIdGameByHashtag(hashtag: string): Promise<string> {
  const { connection, client } = await getConnection("game");
  const game = (await connection.findOne({ hashtag })) as Game;
  client.close();
  return game?._id.toString() || "";
}

export async function joinGame(idGame: string, idUser: string) {
  const game = await getGameById(idGame);
  if (!game) throw new Error("Game does not exist");
  if (game.startedAt) throw new Error("Cannot join a game that already started");
  if (game.users?.length === game.maxPlayers) throw new Error("Max number of players is reached");

  const idUsers = game.users?.map(({ idUser }) => idUser.toString());
  if (idUsers?.includes(idUser)) throw new Error("Player is already in the game");

  const { connection, client } = await getConnection("game");
  await connection.updateOne(
    { _id: new ObjectId(idGame) },
    { $push: { users: { idUser: new ObjectId(idUser), ready: false } } }
  );
  await addGameToUser(idGame, idUser);
  client.close();
}
