import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

const firebaseConfig = {
  apiKey: apiKey || 'dummy-api-key',
  authDomain: authDomain || 'dummy.firebaseapp.com',
  projectId: projectId || 'harmony-frequency-app',
  storageBucket: storageBucket || 'dummy.appspot.com',
  messagingSenderId: messagingSenderId || '00000000000',
  appId: appId || '1:00000000000:web:00000000000',
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } else {
    app = getApps()[0];
    console.log('✅ Using existing Firebase app');
  }

  db = getFirestore(app);

  if (Platform.OS !== 'web') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const authModule = require('firebase/auth');
      const rnPersistence = (authModule as any).getReactNativePersistence;
      if (typeof rnPersistence === 'function') {
        auth = initializeAuth(app, {
          persistence: rnPersistence(AsyncStorage),
        });
        console.log('✅ Firebase Auth initialized with React Native persistence');
      } else {
        auth = getAuth(app);
      }
    } catch (persistenceError) {
      console.warn('⚠️ Failed to initialize RN persistence, falling back to getAuth:', persistenceError);
      auth = getAuth(app);
    }
  } else {
    auth = getAuth(app);
  }
} catch (error) {
  console.warn('⚠️ Firebase initialization caught error:', error);
  // Fallback app/db/auth to prevent app-level crash in unconfigured env
  app = getApps()[0] || initializeApp(firebaseConfig);
  db = getFirestore(app);
  try {
    auth = getAuth(app);
  } catch {
    auth = {} as Auth;
  }
}

export { db, auth, app };
export default app;
