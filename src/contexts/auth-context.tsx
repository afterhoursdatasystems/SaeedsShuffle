'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const authStatus = sessionStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(authStatus);
    } catch (e) {
      console.error('Could not access session storage:', e);
    }
    setIsLoading(false);
  }, []);

  const login = () => {
    try {
      sessionStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
    } catch (e) {
      console.error('Could not access session storage:', e);
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem('isAuthenticated');
      setIsAuthenticated(false);
    } catch (e) {
      console.error('Could not access session storage:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
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
