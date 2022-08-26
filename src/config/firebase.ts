import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";

const { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } = process.env;
const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
