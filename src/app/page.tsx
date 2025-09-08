'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { Player, Team, Match } from '@/types';
import AppHeader from '@/components/app-header';
import PlayerManagement from '@/components/player-management';
import TeamsSchedule from '@/components/teams-schedule';
import Simulation from '@/components/simulation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ClipboardList, Bot } from 'lucide-react';

const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'Saeed', skill: 'Advanced', gender: 'Male', present: true },
  { id: '2', name: 'John Doe', skill: 'Intermediate', gender: 'Male', present: true },
  { id: '3', name: 'Jane Smith', skill: 'Beginner', gender: 'Female', present: true },
  { id: '4', name: 'Alex Ray', skill: 'Advanced', gender: 'Other', present: true },
  { id: '5', name: 'Emily White', skill: 'Intermediate', gender: 'Female', present: false },
  { id: '6', name: 'Michael Brown', skill: 'Advanced', gender: 'Male', present: true },
  { id: '7', name: 'Sarah Green', skill: 'Beginner', gender: 'Female', present: true },
  { id: '8', name: 'Chris Lee', skill: 'Intermediate', gender: 'Male', present: true },
];

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Match[]>([]);

  useEffect(() => {
    setIsClient(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isClient || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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
            <PlayerManagement players={players} setPlayers={setPlayers} />
          </TabsContent>
          <TabsContent value="schedule" className="mt-6">
            <TeamsSchedule
              players={players}
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
  );
}
