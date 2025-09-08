
'use client';

import { useEffect, useState } from 'react';
import { getPublishedTeams } from '@/app/actions';
import type { Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Volleyball, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublicTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      // Don't show loading skeleton on subsequent polls
      if (teams.length === 0) {
        setIsLoading(true);
      }
      const result = await getPublishedTeams();
      if (result.success && result.data) {
        setTeams(result.data);
      } else {
        console.error('Failed to fetch teams:', result.error);
      }
      setIsLoading(false);
    }
    
    fetchTeams(); // Initial fetch

    const interval = setInterval(fetchTeams, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const renderSkeletons = () => (
    Array.from({ length: 6 }).map((_, index) => (
       <Card key={index} className="flex flex-col shadow-lg">
        <CardHeader className="p-6">
          <Skeleton className="h-8 w-3/4 rounded-md" />
        </CardHeader>
        <CardContent className="flex-grow p-6 pt-0">
          <div className="space-y-4">
            {Array.from({length: 4}).map((_, pIndex) => (
              <div key={pIndex} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-7 w-1/2 flex-grow rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-20 items-center justify-between border-b bg-card px-6 md:px-8">
        <div className="flex items-center gap-4">
          <Volleyball className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Saeed's Shuffle</h1>
        </div>
        <p className="hidden text-base text-muted-foreground sm:block">Teams refresh automatically</p>
      </header>
      <main className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="mx-auto max-w-screen-2xl">
          <div className="mb-10 text-center">
            <h2 className="text-5xl font-bold tracking-tight sm:text-6xl">Tonight's Teams</h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Welcome to the shuffle! Find your team below.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renderSkeletons()}
            </div>
          ) : teams.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teams.map((team) => (
                  <Card key={team.name} className="flex flex-col rounded-xl border-2 shadow-lg transition-transform hover:scale-105">
                    <CardHeader className="p-6">
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                        <Users className="h-7 w-7 text-primary" />
                        {team.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-6 pt-0">
                      <div className="space-y-4">
                        {team.players.map((player) => (
                          <div key={player.id} className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-4 border-white">
                              <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                                {player.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xl font-medium">{player.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <h3 className="text-3xl font-semibold">Teams not yet published</h3>
              <p className="mt-4 text-xl text-muted-foreground">The commissioner is still drafting. Check back soon!</p>
            </div>
          )}
        </div>
      </main>
       <footer className="mt-auto py-6 text-center text-base text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Saeed's Volleyball. All rights reserved.</p>
          <a href="/login" className="mt-2 inline-block text-sm underline">Commissioner Login</a>
        </footer>
    </div>
  );
}
