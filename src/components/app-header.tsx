
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Volleyball, LayoutDashboard, PanelLeft } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from './ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/check-in', label: 'Player Check-in' },
    { href: '/admin/teams', label: 'Team Management' },
    { href: '/admin/schedule', label: 'Schedule Management' },
    { href: '/admin/rule-generator', label: 'Rule Generator' },
    { href: '/admin/simulation', label: 'Simulate Standings' },
];

export default function AppHeader() {
  const { logout } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="lg:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                    <Link
                        href="#"
                        className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                    >
                        <Volleyball className="h-5 w-5 transition-all group-hover:scale-110" />
                        <span className="sr-only">Saeed's Shuffle</span>
                    </Link>
                    {navItems.map(item => (
                         <Link key={item.href} href={item.href} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">{item.label}</Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
      <div className="flex items-center gap-3">
        <Volleyball className="h-7 w-7 text-primary hidden lg:block" />
        <h1 className="text-xl font-bold tracking-tight hidden lg:block">Saeed's Shuffle</h1>
      </div>
      <div className="flex items-center gap-2 ml-auto">
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
