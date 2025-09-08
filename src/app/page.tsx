'use client';

import { useEffect, useState } from 'react';
import { getPublishedTeams } from '@/app/actions';
import type { Team, Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, BarChart2, TrendingUp, Volleyball } from 'lucide-react';
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

  const getTeamAnalysis = (team: Team) => {
    const totalSkill = team.players.reduce((sum, p) => sum + p.skill, 0);
    const avgSkill = team.players.length > 0 ? (totalSkill / team.players.length).toFixed(1) : '0';
    const guyCount = team.players.filter(p => p.gender === 'Guy').length;
    const galCount = team.players.filter(p => p.gender === 'Gal').length;
    return { totalSkill, avgSkill, guyCount, galCount };
  };

  const renderSkeletons = () => (
    Array.from({ length: 6 }).map((_, index) => (
       <Card key={index} className="flex flex-col">
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-3/4 rounded-md" />
        </CardHeader>
        <CardContent className="flex-grow p-4 pt-0">
          <div className="space-y-3">
            {Array.from({length: 4}).map((_, pIndex) => (
              <div key={pIndex} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-1/2 flex-grow rounded-md" />
                <Skeleton className="h-5 w-8 ml-auto rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 border-t bg-muted/50 p-4 text-sm text-muted-foreground">
           <Skeleton className="h-4 w-full rounded-md" />
           <Skeleton className="h-4 w-2/3 rounded-md" />
        </CardFooter>
      </Card>
    ))
  );

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Volleyball className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Saeed's Shuffle</h1>
        </div>
        <p className="text-sm text-muted-foreground">Teams refresh automatically</p>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tonight's Teams</h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Welcome to the shuffle! Find your team below.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {renderSkeletons()}
            </div>
          ) : teams.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => {
                const { totalSkill, avgSkill, guyCount, galCount } = getTeamAnalysis(team);
                return (
                  <Card key={team.name} className="flex flex-col">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-4 pt-0">
                      <div className="space-y-3">
                        {team.players.map((player) => (
                          <div key={player.id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border-2 border-white">
                              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                {player.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{player.name}</span>
                            <Badge variant="outline" className="ml-auto">{player.skill}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 border-t bg-muted/50 p-4 text-sm text-muted-foreground">
                      <div className="flex w-full justify-between">
                        <div className="flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Total Skill: <span className="font-bold text-foreground">{totalSkill}</span></div>
                        <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Avg Skill: <span className="font-bold text-foreground">{avgSkill}</span></div>
                      </div>
                      <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Gender: <span className="font-bold text-foreground">{guyCount} Guys, {galCount} Gals</span></div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold">Teams not yet published</h3>
              <p className="text-muted-foreground mt-2">The commissioner is still drafting. Check back soon!</p>
            </div>
          )}
        </div>
      </main>
       <footer className="mt-auto py-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Saeed's Volleyball. All rights reserved.</p>
          <a href="/login" className="mt-2 inline-block text-xs underline">Commissioner Login</a>
        </footer>
    </>
  );
}
