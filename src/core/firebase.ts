import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyCqvyinnC-yRknWnTmS0MJEc7wHElWBaoI',
  authDomain: 'athlete-domains.firebaseapp.com',
  projectId: 'athlete-domains',
  storageBucket: 'athlete-domains.firebasestorage.app',
  messagingSenderId: '542808154613',
  appId: '1:542808154613:web:f5765059f060c8994ac0bc',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only in browser (not SSR/test)
export const analyticsPromise = isSupported().then((yes) =>
  yes ? getAnalytics(app) : null
);
