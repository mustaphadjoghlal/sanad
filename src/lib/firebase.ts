import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
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
export const storage = getStorage(app);
export const ADMIN_EMAIL = "admin@sanadz.media";
export const FCM_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

/**
 * The messaging worker lives on its own scope. The PWA worker owns "/", and
 * two workers registered on the same scope evict each other on every load —
 * which is what used to break offline caching and push registration in turn.
 */
export const FCM_SW_SCOPE = "/firebase-cloud-messaging-push-scope";

/**
 * Config travels in the worker's registration URL rather than a postMessage,
 * because the browser starts the worker with no page attached when a push
 * arrives while the site is closed. Only the four values FCM actually needs
 * are passed; all of them are public client identifiers, not secrets.
 */
export const FCM_SW_URL =
  "/firebase-messaging-sw.js?" +
  new URLSearchParams({
    apiKey: firebaseConfig.apiKey ?? "",
    projectId: firebaseConfig.projectId ?? "",
    messagingSenderId: firebaseConfig.messagingSenderId ?? "",
    appId: firebaseConfig.appId ?? "",
  }).toString();

export async function getMessagingInstance() {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}
