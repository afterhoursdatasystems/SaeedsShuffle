
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PlayerProvider } from '@/contexts/player-context';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { LayoutDashboard, UserCheck, Users, Calendar, Wand2, Bot, Volleyball } from 'lucide-react';
import Link from 'next/link';
import AppHeader from '@/components/app-header';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/player-management', label: 'Player Management', icon: Users },
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
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <div className="flex">
                    <Sidebar>
                        <div className="flex h-14 items-center border-b px-6">
                            <Link href="/admin" className="flex items-center gap-2 font-semibold">
                                <Volleyball className="h-6 w-6 text-primary" />
                                <span className="group-data-[collapsible=icon]:hidden">Saeed's Shuffle</span>
                            </Link>
                        </div>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                     <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </Sidebar>
                    <div className="flex flex-col flex-1">
                        <AppHeader />
                        {children}
                    </div>
                </div>
            </div>
        </SidebarProvider>
    </PlayerProvider>
  );
}
