import "dotenv/config";
import express from "express";
import { getUsers, setUserScore, getOrCreateUser, setUserName, getUserById } from "./users/users.lib";
import cors from "cors";
import { getLast, getOrCreateLast, updateLast } from "./last/last.lib";
import { logCalls } from "./middlewares/log-calls.middleware";
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(logCalls);

app.get("/back", async (req, res) => {
  res.send("Hello world!");
});

app.get("/back/user", async (req, res) => {
  try {
    const id = req.query.id as string;
    const user = await getUserById(id);
    res.send(user);
  } catch (e) {
    res.send(e);
  }
});

app.get("/back/users", async (req, res) => {
  try {
    const users = await getUsers();
    const last = await getLast();
    if (last) {
      users.map((user) => {
        if (user.id === last.idLastUser) {
          user.score += Math.round(Date.now() / 1000) - last.date;
        }
      });
    }
    res.send(users);
  } catch (e) {
    res.send(e);
  }
});

app.put("/back/last", async (req, res) => {
  try {
    const { id } = req.body;
    const newDateLast = Math.round(Date.now() / 1000);
    const last = await getOrCreateLast(id);
    if (last.idLastUser !== id) {
      await setUserScore(last, newDateLast);
      await updateLast(id, newDateLast);
    }
    res.send("Update done!");
  } catch (e) {
    res.send(e);
  }
});

app.post("/back/users", async (req, res) => {
  try {
    const { deviceId } = req.body;
    const user = await getOrCreateUser(deviceId);
    res.send(user);
  } catch (e) {
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
    res.send(e);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
