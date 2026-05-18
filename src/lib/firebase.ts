import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDagcs68MqIBVuUt_EzrbSpswWGgTAuQRM",
  authDomain: "sanad-dz-f14df.firebaseapp.com",
  projectId: "sanad-dz-f14df",
  storageBucket: "sanad-dz-f14df.firebasestorage.app",
  messagingSenderId: "856869700906",
  appId: "1:856869700906:web:3c7fa812c02f1af2484a53",
  measurementId: "G-PK8CF07ZHP",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
