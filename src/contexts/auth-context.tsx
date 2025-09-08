'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {app} from '@/lib/firebase';
import {useToast} from '@/hooks/use-toast';

const ALLOWED_USER = 'matt@afterhoursds.com';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const auth = getAuth(app);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {toast} = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === ALLOWED_USER) {
        setUser(currentUser);
      } else {
        setUser(null);
        if (currentUser) {
          // If a user is signed in but not the allowed one, sign them out.
          signOut(auth);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email !== ALLOWED_USER) {
        await signOut(auth);
        toast({
          title: 'Access Denied',
          description: `Only ${ALLOWED_USER} can log in.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      toast({
        title: 'Sign-In Failed',
        description:
          'Could not sign you in with Google. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-Out Error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !isLoading && !!user,
        user,
        isLoading,
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
