
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Volleyball, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AppHeader() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Volleyball className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Saeed's Shuffle</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
            <Link href="/" target="_blank">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Public Dashboard
            </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
