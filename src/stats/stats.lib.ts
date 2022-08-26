import { db } from "../config/firebase";
import { collection, getDocs, doc, updateDoc, increment, addDoc, getDoc, setDoc } from "firebase/firestore/lite";
import { Stats } from "./stats.type";

export async function getOrCreateStats(): Promise<Stats> {
  let stats = await getStats();
  if (!stats) {
    await createStats();
  } else {
    await increaseUsersStats();
  }
  stats = await getStats();
  return stats;
}

async function getStats(): Promise<Stats> {
  const statsRef = doc(db, "stats", "stats");
  const statsSnap = await getDoc(statsRef);
  return statsSnap.data() as Stats;
}

async function createStats() {
  const statsRef = doc(db, "stats", "stats");
  await setDoc(statsRef, {
    users: 1,
  });
}

async function increaseUsersStats() {
  const statsRef = doc(db, "stats", "stats");
  await updateDoc(statsRef, { users: increment(1) });
}
