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

if (!apiKey || !authDomain || !projectId || !appId) {
  console.error('❌ Missing Firebase configuration. Please ensure all Firebase environment variables are set.');
  console.error('Missing:', {
    apiKey: !apiKey,
    authDomain: !authDomain,
    projectId: !projectId,
    appId: !appId
  });
}

const firebaseConfig = {
  apiKey: apiKey || '',
  authDomain: authDomain || '',
  projectId: projectId || '',
  storageBucket: storageBucket || '',
  messagingSenderId: messagingSenderId || '',
  appId: appId || '',
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

  // On native platforms (iOS/Android), use AsyncStorage-backed persistence
  // so the signed-in user survives app restarts. On web, getAuth defaults to
  // browser local persistence which is correct.
  // getReactNativePersistence is only exported from the RN build of
  // @firebase/auth (Metro resolves it via the "react-native" package field).
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
        console.warn('⚠️ getReactNativePersistence not available — using default auth persistence');
      }
    } catch (persistenceError) {
      console.warn('⚠️ Failed to initialize RN persistence, falling back to getAuth:', persistenceError);
      auth = getAuth(app);
    }
  } else {
    auth = getAuth(app);
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

export { db, auth, app };
export default app;