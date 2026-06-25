import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

/**
 * Configuration Firebase du projet `snake-s-rule`.
 * Identique à la v1 — même projet, mêmes données.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyBI5nQ9umTNerRPiXxdhJdCsxKLrV1xvss',
  authDomain: 'snake-s-rule.firebaseapp.com',
  projectId: 'snake-s-rule',
  storageBucket: 'snake-s-rule.firebasestorage.app',
  messagingSenderId: '195967724839',
  appId: '1:195967724839:web:384e1d39d9e85fd2728d02',
};

export let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let firebaseReady = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Nouvelle API (v9.19+) : cache IndexedDB persistant multi-onglets,
  // remplace enableIndexedDbPersistence() qui est dépréciée.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  firebaseReady = true;
} catch (e) {
  console.error('Firebase init error:', e);
}

export type { User };
