'use client';

import { useEffect, useState } from 'react';
import type { Team } from '@/types';
import { getPublishedTeams } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, BarChart2, TrendingUp, Volleyball, RefreshCw } from 'lucide-react';

function getTeamAnalysis(team: Team) {
    const totalSkill = team.players.reduce((sum, p) => sum + p.skill, 0);
    const avgSkill = team.players.length > 0 ? (totalSkill / team.players.length).toFixed(1) : '0';
    const guyCount = team.players.filter(p => p.gender === 'Guy').length;
    const galCount = team.players.filter(p => p.gender === 'Gal').length;
    return { totalSkill, avgSkill, guyCount, galCount };
}

export default function PublicTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPublishedTeams();
      if (result.success && result.data) {
        setTeams(result.data);
      } else {
        setError(result.error || 'Failed to load teams.');
      }
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex h-16 items-center justify-center border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Volleyball className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Saeed's Shuffle</h1>
        </div>
      </header>
      <main className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Tonight's Teams</h2>
             <button onClick={fetchTeams} disabled={isLoading} className="flex items-center text-sm text-muted-foreground hover:text-primary disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
            </button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="p-4"><div className="h-6 w-3/4 rounded bg-muted"></div></CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    {[...Array(4)].map((_, j) => (
                        <div key={j} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted"></div>
                            <div className="h-4 w-1/2 rounded bg-muted"></div>
                            <div className="h-6 w-8 rounded bg-muted ml-auto"></div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 border-t bg-muted/50 p-4">
                    <div className="h-4 w-full rounded bg-muted"></div>
                    <div className="h-4 w-1/2 rounded bg-muted"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
            <Card className="text-center p-8">
                <CardTitle className="text-destructive">Error</CardTitle>
                <CardDescription>{error}</CardDescription>
            </Card>
        ) : teams.length === 0 ? (
            <Card className="text-center p-8">
                <CardTitle>No Teams Published Yet</CardTitle>
                <CardDescription>The commissioner hasn't published the teams for tonight. Please check back later!</CardDescription>
            </Card>
        ) : (
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
                          <Badge variant="outline" className="ml-auto">
                            {player.skill}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col items-start gap-2 border-t bg-muted/50 p-4 text-sm text-muted-foreground">
                    <div className="flex w-full justify-between">
                        <div className='flex items-center gap-2'><BarChart2 className="h-4 w-4" /> Total Skill: <span className="font-bold text-foreground">{totalSkill}</span></div>
                        <div className='flex items-center gap-2'><TrendingUp className="h-4 w-4" /> Avg Skill: <span className="font-bold text-foreground">{avgSkill}</span></div>
                    </div>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Gender: <span className="font-bold text-foreground">{guyCount} Guys, {galCount} Gals</span></div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
