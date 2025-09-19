
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth';
import { getClientApp } from '@/lib/firebase-client';
import { useToast } from '@/hooks/use-toast';

const ALLOWED_USER_EMAIL = 'matt@afterhoursds.com';

interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'saeeds-shuffle-auth';

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const app = getClientApp();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
        setIsLoading(true);
        if (firebaseUser) {
             if (firebaseUser.email?.toLowerCase() === ALLOWED_USER_EMAIL) {
                const userProfile: UserProfile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                };
                setUser(userProfile);
                sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
             } else {
                // User is signed in to Google, but not the allowed user.
                // Force sign them out of our app state.
                setUser(null);
                sessionStorage.removeItem(AUTH_STORAGE_KEY);
                signOut(auth); // Also sign them out of Firebase for this session
                toast({
                  title: 'Authorization Failed',
                  description: 'This account is not authorized to access the admin area.',
                  variant: 'destructive',
                });
             }
        } else {
            setUser(null);
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, toast]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        // The onAuthStateChanged listener will handle the rest.
    } catch (error: any) {
        console.error('Google Sign-In Error:', error);
        toast({
            title: 'Login Error',
            description: error.message || 'An error occurred during sign-in.',
            variant: 'destructive',
        });
    }
  };

  const logout = async () => {
    try {
        await signOut(auth);
        // The onAuthStateChanged listener will handle setting user to null.
    } catch (error: any) {
        console.error('Sign-Out Error:', error);
         toast({
            title: 'Logout Error',
            description: error.message || 'An error occurred during sign-out.',
            variant: 'destructive',
        });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !isLoading && !!user,
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
