'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

const ALLOWED_USER = 'matt@saeedsvolleyball.com';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_LEAGUE_COMMISSIONER_PASSWORD;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A key for storing the auth state in sessionStorage
const AUTH_STORAGE_KEY = 'saeeds-shuffle-auth';

export function AuthProvider({children}: {children: ReactNode}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check sessionStorage for persisted login state on mount
    try {
      const storedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        // A simple check to re-validate. In a real app, you might check a token's expiry.
        if (authData.isAuthenticated && authData.email === ALLOWED_USER) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
        console.error("Could not parse auth state from storage", error);
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, pass: string) => {
    if (email.toLowerCase() !== ALLOWED_USER) {
      throw new Error(`Only ${ALLOWED_USER} can log in.`);
    }

    if (!ADMIN_PASSWORD) {
        console.error("Admin password environment variable is not set.");
        throw new Error("Login system is not configured correctly. Please contact support.");
    }

    if (pass !== ADMIN_PASSWORD) {
        throw new Error("The password you entered is incorrect.");
    }
    
    setIsAuthenticated(true);
    // Persist login state to sessionStorage
    try {
        const authData = { isAuthenticated: true, email };
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
        console.error("Could not save auth state to storage", error);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    // Clear persisted login state
    try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
        console.error("Could not remove auth state from storage", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !isLoading && isAuthenticated,
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
