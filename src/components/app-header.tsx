
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Volleyball, LayoutDashboard, PanelLeft, UserCheck, Users, Calendar, Wand2, Bot, Home } from 'lucide-react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import React from 'react';
import { SidebarTrigger } from './ui/sidebar';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/player-management', label: 'Player Management', icon: Users },
    { href: '/admin/check-in', label: 'Player Check-in', icon: UserCheck },
    { href: '/admin/teams', label: 'Team Management', icon: Users },
    { href: '/admin/schedule', label: 'Schedule Management', icon: Calendar },
    { href: '/admin/rule-generator', label: 'Rule Generator', icon: Wand2 },
    { href: '/admin/simulation', label: 'Simulate Standings', icon: Bot },
];

export default function AppHeader() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <SidebarTrigger className="md:flex hidden" />
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                    <div className="mb-4">
                        <Link
                            href="/admin"
                            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                        >
                            <Volleyball className="h-5 w-5 transition-all group-hover:scale-110" />
                            <span className="sr-only">Saeed's Shuffle</span>
                        </Link>
                    </div>
                    {navItems.map(item => (
                         <Link key={item.href} href={item.href} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
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
