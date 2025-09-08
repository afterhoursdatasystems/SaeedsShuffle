
'use client';

import AppHeader from '@/components/app-header';
import PlayerManagement from '@/components/player-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ClipboardList, Bot, Zap, Calendar, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-5">
            <TabsTrigger value="players">
              <Users className="mr-2 h-4 w-4" />
              Players
            </TabsTrigger>
             <TabsTrigger value="teams" asChild>
              <Link href="/admin/teams"><UserPlus className="mr-2 h-4 w-4" /> Teams</Link>
            </TabsTrigger>
            <TabsTrigger value="schedule" asChild>
               <Link href="/admin/schedule"><Calendar className="mr-2 h-4 w-4" /> Schedule</Link>
            </TabsTrigger>
            <TabsTrigger value="simulate" asChild>
               <Link href="/admin/simulation"><Bot className="mr-2 h-4 w-4" /> Simulate</Link>
            </TabsTrigger>
            <TabsTrigger value="rules" asChild>
              <Link href="/admin/rule-generator"><Zap className="mr-2 h-4 w-4" /> Rule Generator</Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="players" className="mt-6">
            <PlayerManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
