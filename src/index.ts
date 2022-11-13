import "dotenv/config";
import express from "express";
import http from "http";
import WebSocket from "ws";
import { getUsers, setUserScore, getOrCreateUser, setUserName, getUserById, getGameUsers } from "./users/users.lib";
import cors from "cors";
import { getLast, updateLast } from "./last/last.lib";
import { logCalls } from "./middlewares/log-calls.middleware";
import { initDatabase } from "./config/mongodb";
import { initRestatCreditJob } from "./credit/credit.job";
import { decreaseUserCredit } from "./credit/credit.lib";
import { toUserSafeArray } from "./users/users.type";
import { getUserInUsers } from "./users/users.helper";
import { GameInput } from "./game/game.type";
import { createGame, getGameById, getIdGameByHashtag, joinGame, launchGame, setUserReady } from "./game/game.lib";
import { getWsById, setupWebSocket } from "./config/websocket/websocket";

const app = express();
const server = http.createServer(app);
setupWebSocket(server);
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(logCalls);

app.get("/back", async (req, res) => {
  res.send("Hello world!");
});

app.get("/back/user", async (req, res) => {
  try {
    const { idUser } = req.query as { idUser: string };
    const user = await getUserById(idUser);
    res.send(user);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.get("/back/users", async (req, res) => {
  try {
    const { idGame } = req.query as { idGame: string };
    const user = await getGameUsers(idGame);
    res.send(user);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.patch("/back/user-ready", async (req, res) => {
  try {
    const { idGame, idUser } = req.body;
    await setUserReady(idGame, idUser);
    const game = await getGameById(idGame);
    const idUsers = game.users ? game.users.map((user) => user.idUser) : [];
    const socketsOfGame = getWsById(idUsers);
    socketsOfGame.forEach((s) => s.send(JSON.stringify({ message: "userReady", content: { idUser, ready: true } })));
    res.send("User ready");
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.put("/back/last", async (req, res) => {
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
      const socketsOfGame = getWsById(idUsers);
      socketsOfGame.forEach((s) => s.send(JSON.stringify({ message: "lastChanged" })));
    }
    res.send("Update done!");
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.post("/back/users", async (req, res) => {
  try {
    const { deviceId } = req.body;
    const user = await getOrCreateUser(deviceId);
    res.send(user);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.put("/back/users", async (req, res) => {
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

app.post("/back/games", async (req, res) => {
  try {
    const gameInput: GameInput = req.body;
    const idGame = await createGame(gameInput);
    res.send({ idGame });
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.patch("/back/games", async (req, res) => {
  try {
    const { idGame, idUser } = req.body;
    await launchGame(idGame, idUser);
    res.send("Game launched");
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.get("/back/game", async (req, res) => {
  try {
    const id = req.query.id as string;
    const game = await getGameById(id);
    res.send(game);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.get("/back/id-game", async (req, res) => {
  try {
    const hashtag = req.query.hashtag as string;
    const idGame = await getIdGameByHashtag(hashtag);
    idGame ? res.send({ idGame }) : res.status(204).send();
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.patch("/back/join-game", async (req, res) => {
  try {
    const { idGame, idUser } = req.body;
    await joinGame(idGame, idUser);
    const game = await getGameById(idGame);
    const idUsers = game.users ? game.users.map((user) => user.idUser) : [];
    const socketsOfGame = getWsById(idUsers);
    socketsOfGame.forEach((s) => s.send(JSON.stringify({ message: "userReady", content: { idUser, ready: false } })));
    res.send();
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

server.listen(process.env.PORT || 3000, async () => {
  console.log(`Example app listening on port ${port}`);
  await initDatabase();
  await initRestatCreditJob();
});
