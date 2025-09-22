
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Volleyball } from 'lucide-react';
import Link from 'next/link';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.226-11.283-7.581l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.434 36.316 48 29.561 48 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);


export default function LoginPage() {
  const { signInWithGoogle, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = async () => {
    setIsSigningIn(true);
    await signInWithGoogle();
    // The auth context will handle redirection
    setTimeout(() => setIsSigningIn(false), 2000);
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Volleyball className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">Saeed's Shuffle</CardTitle>
          <CardDescription>Commissioner Login</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button 
                onClick={handleLogin} 
                className="w-full"
                disabled={isSigningIn}
            >
                {isSigningIn ? (
                    'Signing in...'
                ) : (
                    <>
                        <GoogleIcon className="mr-2 h-5 w-5" />
                        Sign in with Google
                    </>
                )}
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:underline">
                View Public Dashboard
              </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
