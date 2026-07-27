import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createLocalUser = (email = 'local@hakken.dev'): AppUser => ({
  uid: 'local-user',
  email,
  getIdToken: async () => 'local-dev-token',
});
const canUseLocalAuth = import.meta.env.DEV;
const firebaseSetupError =
  'Firebase is not configured for this build. Add the VITE_FIREBASE_* variables in Vercel, then redeploy.';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() =>
    isFirebaseConfigured ? null : canUseLocalAuth ? createLocalUser() : null,
  );
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      if (!canUseLocalAuth) throw new Error(firebaseSetupError);
      setUser(createLocalUser(email));
      return;
    }

    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      if (!canUseLocalAuth) throw new Error(firebaseSetupError);
      setUser(createLocalUser(email));
      return;
    }

    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      if (!canUseLocalAuth) throw new Error(firebaseSetupError);
      setUser(createLocalUser());
      return;
    }

    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      return;
    }

    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
