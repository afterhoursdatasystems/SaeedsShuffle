'use client';

import type { Player, Team, Match } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Swords, Save } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import React from 'react';

interface TeamsScheduleProps {
  players: Player[];
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  schedule: Match[];
  setSchedule: React.Dispatch<React.SetStateAction<Match[]>>;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function TeamsSchedule({ players, teams, setTeams, schedule, setSchedule }: TeamsScheduleProps) {
  const { toast } = useToast();

  const handleGenerate = () => {
    const presentPlayers = players.filter((p) => p.present);
    if (presentPlayers.length < 4) {
      toast({
        title: 'Not enough players',
        description: 'You need at least 4 present players to generate teams.',
        variant: 'destructive',
      });
      return;
    }

    // Simple randomization, could be improved with skill/gender balancing
    const shuffledPlayers = shuffleArray(presentPlayers);
    const numTeams = Math.floor(shuffledPlayers.length / 4);
    const newTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
      name: `Team ${i + 1}`,
      players: [],
    }));

    shuffledPlayers.slice(0, numTeams * 4).forEach((player, i) => {
      newTeams[i % numTeams].players.push(player);
    });

    setTeams(newTeams);

    // Round Robin schedule generation
    const teamNames = newTeams.map(t => t.name);
    const newSchedule: Match[] = [];
    if (teamNames.length < 2) {
      setSchedule([]);
      return;
    }

    const courts = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];
    let courtIndex = 0;

    for (let i = 0; i < teamNames.length; i++) {
      for (let j = i + 1; j < teamNames.length; j++) {
        newSchedule.push({
          id: crypto.randomUUID(),
          teamA: teamNames[i],
          teamB: teamNames[j],
          resultA: null,
          resultB: null,
          court: courts[courtIndex % courts.length]
        });
        courtIndex++;
      }
    }

    setSchedule(shuffleArray(newSchedule));
    toast({
      title: 'Teams & Schedule Generated!',
      description: `${newTeams.length} teams and ${newSchedule.length} matches have been created.`,
    });
  };

  const handleResultChange = (matchId: string, team: 'A' | 'B', value: string) => {
    setSchedule(schedule.map(m => {
      if (m.id === matchId) {
        return team === 'A' ? { ...m, resultA: value === '' ? null : parseInt(value) } : { ...m, resultB: value === '' ? null : parseInt(value) };
      }
      return m;
    }));
  };
  
  const handleSaveAllResults = () => {
    toast({ title: "Results saved", description: "All match results have been updated." });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Team & Schedule Generation</CardTitle>
              <CardDescription>Generate teams and a match schedule for tonight.</CardDescription>
            </div>
            <Button onClick={handleGenerate} className="mt-4 sm:mt-0">
              <Swords className="mr-2 h-4 w-4" />
              Generate Teams & Schedule
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tonight's Teams</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teams.map((team) => (
              <Card key={team.name} className="flex flex-col">
                <CardHeader className="flex-row items-center justify-between p-4">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <Badge variant="secondary">{team.players.length} Players</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {team.players.map(player => (
                      <div key={player.id} className="flex items-center gap-3">
                         <Avatar className="h-8 w-8 border-2 border-white">
                           <AvatarFallback className="bg-primary/20 text-primary font-bold">
                             {player.name.charAt(0)}
                           </AvatarFallback>
                         </Avatar>
                        <span className="font-medium">{player.name}</span>
                        <Badge variant="outline" className="ml-auto">{player.skill}/10</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {schedule.length > 0 && (
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Match Schedule & Results</CardTitle>
                    <CardDescription>Enter results as games are completed.</CardDescription>
                </div>
                 <Button onClick={handleSaveAllResults} variant="secondary" className="mt-4 sm:mt-0">
                    <Save className="mr-2 h-4 w-4" />
                    Save All Results
                </Button>
             </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Court</TableHead>
                    <TableHead>Team A</TableHead>
                    <TableHead>Team B</TableHead>
                    <TableHead className="w-[120px] text-center">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell><Badge>{match.court}</Badge></TableCell>
                      <TableCell className="font-medium">{match.teamA}</TableCell>
                      <TableCell className="font-medium">{match.teamB}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            className="h-8 w-12 p-1 text-center"
                            value={match.resultA ?? ''}
                            onChange={(e) => handleResultChange(match.id, 'A', e.target.value)}
                            aria-label={`${match.teamA} score`}
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            className="h-8 w-12 p-1 text-center"
                            value={match.resultB ?? ''}
                            onChange={(e) => handleResultChange(match.id, 'B', e.target.value)}
                            aria-label={`${match.teamB} score`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
