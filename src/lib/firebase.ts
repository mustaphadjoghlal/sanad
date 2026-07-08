import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
// ignoreUndefinedProperties: optional form fields are passed as undefined
// (order note, registration email, notification link, ...) and addDoc/setDoc
// would otherwise throw "Unsupported field value: undefined".
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const auth = getAuth(app);
export const ADMIN_EMAIL = "admin@sanadz.media";
export const FCM_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export async function getMessagingInstance() {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}
