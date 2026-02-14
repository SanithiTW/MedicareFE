// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAX4EA-gXGDkwV8DxUxrIRdzU-YdX2cI6Q",
  authDomain: "medicare-91a2f.firebaseapp.com",
  databaseURL: "https://medicare-91a2f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "medicare-91a2f",
  storageBucket: "medicare-91a2f.firebasestorage.app",
  messagingSenderId: "531750916478",
  appId: "1:531750916478:web:dcf93b6e9874211c17632f",
  measurementId: "G-14JB8CDZCV"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
export { firebaseConfig };

