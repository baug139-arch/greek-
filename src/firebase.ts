import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance
let app: any;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (err2) {
    console.warn('Firebase App initialization warning:', err2);
  }
}

// Initialize Firebase Auth
let authInstance: any = null;
let googleProviderInstance = new GoogleAuthProvider();
try {
  googleProviderInstance.setCustomParameters({ prompt: 'select_account' });
  if (app) {
    authInstance = getAuth(app);
  }
} catch (error) {
  console.warn('Firebase Auth initialization warning:', error);
}

export const auth = authInstance;
export const googleProvider = googleProviderInstance;

// Initialize Firestore (with databaseId if configured and fallback)
let dbInstance: any = null;
try {
  if (app) {
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
      try {
        dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      } catch (dbErr) {
        console.warn('Could not initialize named firestore database, falling back to default:', dbErr);
        dbInstance = getFirestore(app);
      }
    } else {
      dbInstance = getFirestore(app);
    }

    // Enable offline persistence for seamless offline work on mobile & tablet
    if (typeof window !== 'undefined' && dbInstance) {
      enableIndexedDbPersistence(dbInstance).catch((err: any) => {
        // Multi-tab or unsupported browser - graceful fallback to memory cache
        if (err?.code !== 'failed-precondition' && err?.code !== 'unimplemented') {
          console.warn('Firestore offline persistence warning:', err);
        }
      });
    }
  }
} catch (error) {
  console.warn('Firestore service is not available (falling back to local storage):', error);
}

export const db = dbInstance;

// Auth helper functions with mobile fallback
export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error('Firebase Auth не инициализирован');
  }

  // Detect mobile device / touchscreen
  const isMobile = typeof window !== 'undefined' && (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
  );

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup was blocked or failed on mobile Safari/Chrome, fallback to redirect
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request' || isMobile) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        console.error('Error signing in with Redirect:', redirectError);
        throw redirectError;
      }
    }
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const checkRedirectResult = async () => {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.warn('Error checking redirect auth result:', error);
    return null;
  }
};

export const logOut = async () => {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export { 
  onAuthStateChanged, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  writeBatch
};
export type { FirebaseUser };
