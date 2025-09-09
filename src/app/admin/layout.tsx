
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PlayerProvider } from '@/contexts/player-context';
import AppHeader from '@/components/app-header';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, UserCheck, Users, Calendar, Wand2, Bot } from 'lucide-react';
import Link from 'next/link';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/check-in', label: 'Player Check-in', icon: UserCheck },
    { href: '/admin/teams', label: 'Team Management', icon: Users },
    { href: '/admin/schedule', label: 'Schedule Management', icon: Calendar },
    { href: '/admin/rule-generator', label: 'Rule Generator', icon: Wand2 },
    { href: '/admin/simulation', label: 'Simulate Standings', icon: Bot },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <PlayerProvider>
        <SidebarProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <AppHeader />
                <div className="flex">
                    <Sidebar className="hidden lg:block border-r">
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <Link href={item.href} legacyBehavior passHref>
                                        <SidebarMenuButton isActive={pathname === item.href}>
                                            <item.icon />
                                            {item.label}
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </Sidebar>
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    </PlayerProvider>
  );
}
