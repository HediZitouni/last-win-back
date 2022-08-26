import { db } from "../config/firebase";
import { collection, getDocs, doc, updateDoc, increment, query, where, addDoc, getDoc } from "firebase/firestore/lite";
import { Last } from "~/last/last.type";
import { User } from "./users.type";
import { getOrCreateStats } from "~/stats/stats.lib";
import { Stats } from "~/stats/stats.type";

export async function getUsers(): Promise<User[]> {
  const usersSnapshot = await getDocs(collection(db, "users"));
  return usersSnapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...data } as User;
  });
}

export async function setUserScore(last: Last, newDateLast: number) {
  const { idLastUser, date } = last;
  const scoreToAdd = newDateLast - date;
  const userRef = doc(db, "users", idLastUser);
  await updateDoc(userRef, { score: increment(scoreToAdd) });
}

export async function getOrCreateUser(deviceId: string): Promise<User> {
  const userQuery = query(collection(db, "users"), where("deviceId", "==", deviceId));
  const userSnapshot = await getDocs(userQuery);
  if (userSnapshot.empty) {
    const stats = await getOrCreateStats();
    const userName = generateUserName(stats);
    await addDoc(collection(db, "users"), { deviceId, name: userName, score: 0 });
    const createdUser = await getDocs(userQuery);
    const createdUserSnapShot = createdUser.docs[0];
    return { id: createdUserSnapShot.id, ...createdUserSnapShot.data() } as User;
  }
  const snapShot = userSnapshot.docs[0];
  return { id: snapShot.id, ...snapShot.data() } as User;
}

export async function setUserName(id: string, name: string) {
  const userRef = doc(db, "users", id);
  await updateDoc(userRef, { name });
}

export async function getUserById(id: string): Promise<User> {
  const userRef = doc(db, "users", id);
  const userSnap = await getDoc(userRef);
  return { id: userSnap.id, ...userSnap.data() } as User;
}

function generateUserName(stats: Stats): string {
  const { users } = stats;
  return `User_${users + 1}`;
}
