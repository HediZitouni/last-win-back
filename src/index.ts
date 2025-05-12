import "dotenv/config";
import express from "express";
import http from "http";
import { setUserScore, getOrCreateUser, setUserName, getUserById, getUserByIdGame } from "./users/users.lib";
import cors from "cors";
import { updateLast } from "./last/last.lib";
import { logCalls } from "./middlewares/log-calls.middleware";
import { initDatabase } from "./config/mongodb";
import { decreaseUserCredit } from "./credit/credit.lib";
import { getUserInUsers } from "./users/users.helper";
import { GameInput } from "./game/game.type";
import { createGame, getGameById, getGameByHashtag, joinGame, launchGame, setUserReady } from "./game/game.lib";
import { getWsById, setupWebSocket } from "./config/websocket/websocket";

console.log("process.env.MONGODB_HOST", process.env.MONGODB_HOST);
const app = express();
const server = http.createServer(app);
setupWebSocket(server);
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(logCalls);

app.get("/", async (req, res) => {
  res.send("Hello world!");
});

app.get("/user", async (req, res) => {
  try {
    const { idUser } = req.query as { idUser: string };
    const user = await getUserById(idUser);
    res.send(user);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.get("/users", async (req, res) => {
  try {
    const { idGame } = req.query as { idGame: string };
    const user = await getUserByIdGame(idGame);
    res.send(user);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.patch("/user-ready", async (req, res) => {
  try {
    const { idGame, idUser } = req.body;
    await setUserReady(idGame, idUser);
    const game = await getGameById(idGame);
    const idUsers = game.users ? game.users.map((user) => user.idUser) : [];
    const socketsOfGame = getWsById(idUsers);
    if (socketsOfGame.length === idUsers.length) {
      console.log(`send to ${idUsers} userReady`);
    } else {
      console.log(`one of ${idUsers} dont get userReady`);
    }
    socketsOfGame.forEach((s) =>
      s.send(JSON.stringify({ type: "userReady", content: { idGame, idUser, ready: true } }))
    );
    res.send("User ready");
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.put("/last", async (req, res) => {
  try {
    const { idGame, idUser } = req.body;
    const newDateLast = Math.round(Date.now() / 1000);
    const { last, users } = await getGameById(idGame);
    const user = getUserInUsers(idUser, users);
    if (user.credit < 1) return res.send("User has no credit");

    if (last.idUser !== idUser) {
      await setUserScore(idGame, last, newDateLast);
      await decreaseUserCredit(idGame, idUser);
      await updateLast(idGame, idUser, newDateLast);
      const idUsers = users ? users.map((user) => user.idUser) : [];
      const socketsOfGame = getWsById(idUsers, "lastChanged");
      socketsOfGame.forEach((s) => s.send(JSON.stringify({ message: "lastChanged" })));
    }
    res.send("Update done!");
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.post("/users", async (req, res) => {
  try {
    console.log(`Route well called`);
    const { deviceId } = req.body;
    const user = await getOrCreateUser(deviceId);
    res.send(user);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.put("/users", async (req, res) => {
  try {
    const { id, name } = req.body;
    await setUserName(id, name);
    const user = await getUserById(id);
    res.send(user);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.post("/games", async (req, res) => {
  try {
    const gameInput: GameInput = req.body;
    const idGame = await createGame(gameInput);
    res.send({ idGame });
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.patch("/games", async (req, res) => {
  try {
    const { idGame, idUser } = req.body;
    await launchGame(idGame, idUser);
    res.send("Game launched");
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.get("/game", async (req, res) => {
  try {
    const id = req.query.id as string;
    const game = await getGameById(id);
    res.send(game);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.get("/id-game", async (req, res) => {
  try {
    const { hashtag, idUser } = req.query as { hashtag: string; idUser: string };
    const game = await getGameByHashtag(hashtag);
    if (!game) return res.status(204).send();
    if (game.users?.some(({ idUser: idUig }) => idUser === idUig)) res.status(403).send();
    res.send({ idGame: game._id.toString() });
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.patch("/join-game", async (req, res) => {
  try {
    const { idGame, idUser } = req.body;
    await joinGame(idGame, idUser);
    const game = await getGameById(idGame);
    if (!game) res.status(204).send();
    const idUsers = game.users ? game.users.map((user) => user.idUser) : [];
    const socketsOfGame = getWsById(idUsers);
    if (socketsOfGame.length === idUsers.length) {
      console.log(`send to ${idUsers} userReady2`);
    } else {
      console.log(`one of ${idUsers} dont get userReady2`);
    }
    socketsOfGame.forEach((s) =>
      s.send(JSON.stringify({ type: "userReady", content: { idGame, idUser, ready: false } }))
    );
    res.send({});
  } catch (e: any) {
    console.log(e);
    res.send({ message: e.message });
  }
});

server.listen(process.env.PORT || 3000, async () => {
  console.log(`Example app listening on port ${port}`);
  await initDatabase();
  //await initRestatCreditJob();
});
