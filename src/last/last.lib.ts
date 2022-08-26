import { db } from "../config/firebase";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore/lite";
import { Last } from "./last.type";

export async function getLast(): Promise<Last> {
  const lastSnapshot = await getDoc(doc(db, "last", "last"));
  return lastSnapshot.data() as Last;
}

export async function getOrCreateLast(idLastUser: string): Promise<Last> {
  let last = await getLast();
  if (!last) {
    await createLast(idLastUser);
    last = await getLast();
  }
  return last;
}

export async function createLast(idLastUser: string) {
  const lastRef = doc(db, "last", "last");
  await setDoc(lastRef, {
    idLastUser,
    date: Math.round(Date.now() / 1000),
  });
}

export async function updateLast(idLastUser: string, newDateLast: number) {
  const userRef = doc(db, "last", "last");
  await updateDoc(userRef, { idLastUser, date: newDateLast });
}
