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
  signInWithRedirect,
  getRedirectResult,
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
    // This effect handles the result of a sign-in redirect.
    // It should run once on component mount.
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user.email !== ALLOWED_USER) {
          // If a user signed in, but they are not the allowed user...
          await signOut(auth); // ...sign them out immediately...
          setUser(null);
          toast({
            title: 'Access Denied',
            description: `Only ${ALLOWED_USER} can log in.`,
            variant: 'destructive',
          });
        }
        // If the user is the correct one, or if there's no redirect result,
        // we let onAuthStateChanged handle setting the user state.
      } catch (error: any) {
        // This error code means the user just landed on the page without
        // coming from a sign-in redirect. We can safely ignore it.
        if (error.code !== 'auth/no-user-for-redirect') {
          console.error('Google Sign-In Redirect Error:', error);
          toast({
            title: 'Sign-In Failed',
            description: 'Could not complete sign-in. Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        // After processing the redirect, onAuthStateChanged will take over,
        // so we don't need to set loading to false here.
      }
    };

    handleRedirectResult();

    // This listener is the source of truth for the user's sign-in state.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === ALLOWED_USER) {
        setUser(currentUser);
      } else {
        setUser(null);
        if (currentUser) {
          // This case handles if a disallowed user somehow gets here
          // without a redirect, e.g., from a previous session.
          signOut(auth);
          toast({
            title: 'Access Denied',
            description: `Only ${ALLOWED_USER} can log in.`,
            variant: 'destructive',
          });
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);


  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-Out Error:', error);
       toast({
        title: 'Sign-Out Failed',
        description: 'Could not sign you out. Please try again.',
        variant: 'destructive',
      });
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
