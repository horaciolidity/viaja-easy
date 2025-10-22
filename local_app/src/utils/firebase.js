import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';

const getFirebaseConfig = () => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  for (const key of requiredKeys) {
    if (!firebaseConfig[key]) {
      console.error(`La clave de configuración de Firebase ${key} falta en el archivo .env. Las notificaciones no funcionarán.`);
      return null;
    }
  }

  return firebaseConfig;
};

const firebaseConfig = getFirebaseConfig();

export const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const messaging = app && typeof window !== 'undefined' ? getMessaging(app) : null;

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && firebaseConfig) {
    const configForSw = { ...firebaseConfig };
    delete configForSw.measurementId;
    const urlParams = new URLSearchParams(configForSw).toString();
    const swUrl = `/firebase-messaging-sw.js?${urlParams}`;

    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('Firebase Service Worker registrado con éxito:', registration);
      })
      .catch((error) => {
        console.error('Error en el registro del Service Worker de Firebase:', error);
      });
  } else if (!firebaseConfig) {
    console.warn("Firebase no está configurado. El Service Worker para notificaciones no se registrará.");
  }
};