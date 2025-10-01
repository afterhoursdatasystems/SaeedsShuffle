'use client';

<<<<<<< HEAD
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
=======
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
>>>>>>> db.json

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
<<<<<<< HEAD
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
=======
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
>>>>>>> db.json
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

<<<<<<< HEAD
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        toast({
          title: 'Authentication Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to sign in with Google',
        variant: 'destructive',
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: 'Sign Out Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Sign Out Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
=======
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
>>>>>>> db.json
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}