'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

// These env vars are required — app will not function without them.
// Validation occurs at startup in the layout.tsx initialization.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY']!,
  authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN']!,
  projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID']!,
  storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET']!,
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID']!,
  appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID']!,
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApps()[0]!;
  return initializeApp(firebaseConfig);
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getAuth(getFirebaseApp());
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const auth = getAuth(getFirebaseApp());
      await signInWithEmailAndPassword(auth, email, password);
    },
    []
  );

  const signInAsGuest = useCallback(async () => {
    const auth = getAuth(getFirebaseApp());
    await signInAnonymously(auth);
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getAuth(getFirebaseApp());
    await signOut(auth);
  }, []);

  const getIdToken = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken(true); // Force refresh
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signInAsGuest,
        signOutUser,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
