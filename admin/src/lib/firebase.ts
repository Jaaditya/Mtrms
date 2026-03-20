import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDLkJx2UhorOY-GoHSeUeIz-v4wq8srIkw",
  authDomain: "mtrms-6101d.firebaseapp.com",
  projectId: "mtrms-6101d",
  storageBucket: "mtrms-6101d.firebasestorage.app",
  messagingSenderId: "75413077812",
  appId: "1:75413077812:web:257f5f88d1db23f13cef61",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
        // VAPID key is required for web push. 
        // User should replace this with their actual VAPID key from Firebase Console
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
    });
    if (currentToken) {
      return currentToken;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
