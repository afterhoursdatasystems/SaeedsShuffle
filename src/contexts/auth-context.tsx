'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth';
import { app } from '@/lib/firebase-client'; // We'll create this file

const ALLOWED_USER = 'matt@afterhoursds.com';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const auth = getAuth(app);
  const isAuthenticated = !!user;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email?.toLowerCase() === ALLOWED_USER) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const signedInUser = result.user;

      if (signedInUser.email?.toLowerCase() !== ALLOWED_USER) {
        // If the user is not allowed, sign them out immediately.
        await signOut(auth);
        setUser(null);
        throw new Error(`Access denied. Only ${ALLOWED_USER} can log in.`);
      }
      
      setUser(signedInUser);

    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      // Re-throw the error to be caught by the UI
      if (error.code === 'auth/popup-closed-by-user') {
          throw new Error('Sign-in window closed. Please try again.');
      }
      if (error.message.includes('Access denied')) {
        throw error;
      }
      throw new Error('An error occurred during sign-in.');
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    signOut(auth).then(() => {
        setUser(null);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !isLoading && isAuthenticated,
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
