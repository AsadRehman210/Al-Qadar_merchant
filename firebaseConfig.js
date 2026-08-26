// Import Firebase
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging"; // ✅ Import FCM

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
// Initialize Firebase with config from environment variables
const app = initializeApp(FIREBASE_CONFIG);
const messaging = getMessaging(app);

// Export Firebase instances
export { messaging }; // ✅ Export messaging
