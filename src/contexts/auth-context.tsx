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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
       if (currentUser && currentUser.email === ALLOWED_USER) {
        setUser(currentUser);
      } else {
        setUser(null);
         if (currentUser) {
           // If a user is signed in but not the allowed one, sign them out.
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
  
  useEffect(() => {
    const handleRedirectResult = async () => {
        setIsLoading(true);
        try {
            const result = await getRedirectResult(auth);
            if (result && result.user.email !== ALLOWED_USER) {
                await signOut(auth);
                setUser(null);
                toast({
                    title: 'Access Denied',
                    description: `Only ${ALLOWED_USER} can log in.`,
                    variant: 'destructive',
                });
            }
            // Let onAuthStateChanged handle setting the user and loading state
        } catch (error: any) {
            // Don't show an error if user is not signed in
            if (error.code !== 'auth/no-user-for-redirect') {
                console.error('Google Sign-In Redirect Error:', error);
                toast({
                    title: 'Sign-In Failed',
                    description: 'Could not complete sign-in. Please try again.',
                    variant: 'destructive',
                });
            }
        } finally {
             // onAuthStateChanged will set loading to false
        }
    };
    handleRedirectResult();
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
