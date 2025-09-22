'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Volleyball } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.196 44 30.023 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);


export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);
  
  const handleLogin = async () => {
    try {
      await login();
    } catch (err: any) {
        toast({
            title: 'Login Failed',
            description: err.message,
            variant: 'destructive',
        });
    }
  };


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Volleyball className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">Saeed's Shuffle</CardTitle>
          <CardDescription>Commissioner Login</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <Button onClick={handleLogin} disabled={isLoading} className="w-full">
                    {isLoading ? (
                        'Signing in...'
                    ) : (
                        <>
                            <GoogleIcon />
                            Sign In with Google
                        </>
                    )}
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
