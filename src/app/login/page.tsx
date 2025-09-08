'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Volleyball } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // In a real app, you'd have more robust validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    try {
      login(email, password);
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
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                        id="email" 
                        type="email" 
                        placeholder="" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                        id="password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                    Sign In
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
