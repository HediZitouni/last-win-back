"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"));

// src/config/firebase.ts
var import_app = require("firebase/app");
var import_lite = require("firebase/firestore/lite");
var { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } = process.env;
var firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};
var app = (0, import_app.initializeApp)(firebaseConfig);
var db = (0, import_lite.getFirestore)(app);

// src/users/users.lib.ts
var import_lite3 = require("firebase/firestore/lite");

// src/stats/stats.lib.ts
var import_lite2 = require("firebase/firestore/lite");
async function getOrCreateStats() {
  let stats = await getStats();
  if (!stats) {
    await createStats();
  } else {
    await increaseUsersStats();
  }
  stats = await getStats();
  return stats;
}
async function getStats() {
  const statsRef = (0, import_lite2.doc)(db, "stats", "stats");
  const statsSnap = await (0, import_lite2.getDoc)(statsRef);
  return statsSnap.data();
}
async function createStats() {
  const statsRef = (0, import_lite2.doc)(db, "stats", "stats");
  await (0, import_lite2.setDoc)(statsRef, {
    users: 1
  });
}
async function increaseUsersStats() {
  const statsRef = (0, import_lite2.doc)(db, "stats", "stats");
  await (0, import_lite2.updateDoc)(statsRef, { users: (0, import_lite2.increment)(1) });
}

// src/users/users.lib.ts
async function getUsers() {
  const usersSnapshot = await (0, import_lite3.getDocs)((0, import_lite3.collection)(db, "users"));
  return usersSnapshot.docs.map((doc4) => {
    const data = doc4.data();
    return { id: doc4.id, ...data };
  });
}
async function setUserScore(last, newDateLast) {
  const { idLastUser, date } = last;
  const scoreToAdd = newDateLast - date;
  const userRef = (0, import_lite3.doc)(db, "users", idLastUser);
  await (0, import_lite3.updateDoc)(userRef, { score: (0, import_lite3.increment)(scoreToAdd) });
}
async function getOrCreateUser(deviceId) {
  const userQuery = (0, import_lite3.query)((0, import_lite3.collection)(db, "users"), (0, import_lite3.where)("deviceId", "==", deviceId));
  const userSnapshot = await (0, import_lite3.getDocs)(userQuery);
  if (userSnapshot.empty) {
    const stats = await getOrCreateStats();
    const userName = generateUserName(stats);
    await (0, import_lite3.addDoc)((0, import_lite3.collection)(db, "users"), { deviceId, name: userName, score: 0 });
    const createdUser = await (0, import_lite3.getDocs)(userQuery);
    const createdUserSnapShot = createdUser.docs[0];
    return { id: createdUserSnapShot.id, ...createdUserSnapShot.data() };
  }
  const snapShot = userSnapshot.docs[0];
  return { id: snapShot.id, ...snapShot.data() };
}
async function setUserName(id, name) {
  const userRef = (0, import_lite3.doc)(db, "users", id);
  await (0, import_lite3.updateDoc)(userRef, { name });
}
async function getUserById(id) {
  const userRef = (0, import_lite3.doc)(db, "users", id);
  const userSnap = await (0, import_lite3.getDoc)(userRef);
  return { id: userSnap.id, ...userSnap.data() };
}
function generateUserName(stats) {
  const { users } = stats;
  return `User_${users + 1}`;
}

// src/index.ts
var import_cors = __toESM(require("cors"));

// src/last/last.lib.ts
var import_lite4 = require("firebase/firestore/lite");
async function getLast() {
  const lastSnapshot = await (0, import_lite4.getDoc)((0, import_lite4.doc)(db, "last", "last"));
  return lastSnapshot.data();
}
async function getOrCreateLast(idLastUser) {
  let last = await getLast();
  if (!last) {
    await createLast(idLastUser);
    last = await getLast();
  }
  return last;
}
async function createLast(idLastUser) {
  const lastRef = (0, import_lite4.doc)(db, "last", "last");
  await (0, import_lite4.setDoc)(lastRef, {
    idLastUser,
    date: Math.round(Date.now() / 1e3)
  });
}
async function updateLast(idLastUser, newDateLast) {
  const userRef = (0, import_lite4.doc)(db, "last", "last");
  await (0, import_lite4.updateDoc)(userRef, { idLastUser, date: newDateLast });
}

// src/middlewares/log-calls.middleware.ts
function logCalls(req, res, next) {
  console.log(
    `[${req.method}] '${req.originalUrl}'
        BODY: ${JSON.stringify(req.body) || "null"}
        QUERY: ${JSON.stringify(req.query) || "null"}`
  );
  next();
}

// src/index.ts
var app2 = (0, import_express.default)();
var port = 3e3;
app2.use((0, import_cors.default)());
app2.use(import_express.default.json());
app2.use(logCalls);
app2.get("/", async (req, res) => {
  res.send("Hello world!");
});
app2.get("/user", async (req, res) => {
  try {
    const id = req.query.id;
    const user = await getUserById(id);
    res.send(user);
  } catch (e) {
    res.send(e);
  }
});
app2.get("/users", async (req, res) => {
  try {
    const users = await getUsers();
    const last = await getLast();
    if (last) {
      users.map((user) => {
        if (user.id === last.idLastUser) {
          user.score += Math.round(Date.now() / 1e3) - last.date;
        }
      });
    }
    res.send(users);
  } catch (e) {
    res.send(e);
  }
});
app2.put("/last", async (req, res) => {
  try {
    const { id } = req.body;
    const newDateLast = Math.round(Date.now() / 1e3);
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
app2.post("/users", async (req, res) => {
  try {
    const { deviceId } = req.body;
    const user = await getOrCreateUser(deviceId);
    res.send(user);
  } catch (e) {
    res.send(e);
  }
});
app2.put("/users", async (req, res) => {
  try {
    const { id, name } = req.body;
    await setUserName(id, name);
    const user = await getUserById(id);
    res.send(user);
  } catch (e) {
    res.send(e);
  }
});
app2.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
