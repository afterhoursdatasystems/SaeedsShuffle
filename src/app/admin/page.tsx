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
  { id: '1', name: 'Cole Deaver', gender: 'Guy', skill: 6, present: true },
  { id: '2', name: 'Melissa Roy', gender: 'Gal', skill: 6, present: true },
  { id: '3', name: 'Kristin Drinka', gender: 'Gal', skill: 7, present: true },
  { id: '4', name: 'Kyle Novak', gender: 'Gal', skill: 9, present: true },
  { id: '5', name: 'Nicole Malone', gender: 'Gal', skill: 5, present: true },
  { id: '6', name: 'Heidi Kempert', gender: 'Gal', skill: 4, present: true },
  { id: '7', name: 'Brian Kempert', gender: 'Guy', skill: 8, present: true },
  { id: '8', name: 'Abby Gilpin', gender: 'Gal', skill: 6, present: true },
  { id: '9', name: 'Miranda Griego', gender: 'Gal', skill: 3, present: true },
  { id: '10', name: 'Jonathan Bradley', gender: 'Guy', skill: 5, present: true },
  { id: '11', name: 'Aditya Singh', gender: 'Guy', skill: 7, present: true },
  { id: '12', name: 'Giovanni Salvatore', gender: 'Guy', skill: 7, present: true },
  { id: '13', name: 'Emily Victoria', gender: 'Gal', skill: 6, present: true },
  { id: '14', name: 'Eric Ahrens', gender: 'Guy', skill: 7, present: true },
  { id: '15', name: 'Stephen Jaqua', gender: 'Guy', skill: 4, present: true },
  { id: '16', name: 'Lindsey Victoria', gender: 'Gal', skill: 7, present: true },
  { id: '17', name: 'Shaylyn Murphy', gender: 'Gal', skill: 8, present: true },
  { id: '18', name: 'William Van Meter', gender 'Guy', skill: 3, present: true },
  { id: '19', name: 'Colleen Palman', gender: 'Gal', skill: 2, present: true },
  { id: '20', name: 'Rachel Nystrom', gender: 'Gal', skill: 8, present: true },
  { id: '21', name: 'Pat Sobotka', gender: 'Guy', skill: 6, present: true },
  { id: '22', name: 'Jasona Jones', gender: 'Gal', skill: 1, present: true },
  { id: '23', name: 'Joy Swasy', gender: 'Gal', skill: 6, present: true },
  { id: '24', name: 'Jesica Bullrich', gender: 'Gal', skill: 2, present: true },
  { id: '25', name: 'Lauren Hopkins', gender: 'Gal', skill: 6, present: true },
  { id: '26', name: 'Matt Taylor', gender: 'Guy', skill: 7, present: true },
  { id: '27', name: 'Alaina McCoy', gender: 'Gal', skill: 4, present: true },
  { id: '28', name: 'Alexandra Broskey', gender: 'Gal', skill: 6, present: true },
];

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Match[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
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
