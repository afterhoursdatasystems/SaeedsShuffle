
'use client';

import { useState } from 'react';
import type { Team, Match } from '@/types';
import AppHeader from '@/components/app-header';
import PlayerManagement from '@/components/player-management';
import TeamsSchedule from '@/components/teams-schedule';
import Simulation from '@/components/simulation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ClipboardList, Bot } from 'lucide-react';

export default function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Match[]>([]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-3">
            <TabsTrigger value="players">
              <Users className="mr-2 h-4 w-4" />
              Players
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <ClipboardList className="mr-2 h-4 w-4" />
              Teams & Schedule
            </TabsTrigger>
            <TabsTrigger value="simulate">
              <Bot className="mr-2 h-4 w-4" />
              Simulate Standings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="players" className="mt-6">
            <PlayerManagement teams={teams} />
          </TabsContent>
          <TabsContent value="schedule" className="mt-6">
            <TeamsSchedule
              teams={teams}
              setTeams={setTeams}
              schedule={schedule}
              setSchedule={setSchedule}
            />
          </TabsContent>
          <TabsContent value="simulate" className="mt-6">
            <Simulation schedule={schedule} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
