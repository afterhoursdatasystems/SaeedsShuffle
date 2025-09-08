'use client';

import type { Player, Team, Match } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Swords, Save, Users, BarChart2, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import React, { useMemo, useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

interface TeamsScheduleProps {
  players: Player[];
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  schedule: Match[];
  setSchedule: React.Dispatch<React.SetStateAction<Match[]>>;
}

const teamNames = [
  'Birkdale Bombers', 'Cool Fish Commandos', 'Jetton Juggernauts',
  'McGuire Nuclear Knockouts', 'Peninsula Powerhouse', 'Soda Shop Slammers',
  'Langtree Lightning', 'Bailey\'s Bruisers', 'Antiquity Attackers',
  'Summit Strikers', 'Toast Titans'
];

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
  const [teamSize, setTeamSize] = useState<number>(4);

  const presentPlayers = useMemo(() => players.filter((p) => p.present), [players]);
  const possibleTeamsCount = Math.floor(presentPlayers.length / teamSize);

  const handleGenerate = () => {
    if (presentPlayers.length < teamSize) {
      toast({
        title: 'Not enough players',
        description: `You need at least ${teamSize} present players to generate teams.`,
        variant: 'destructive',
      });
      return;
    }

    const numTeams = Math.floor(presentPlayers.length / teamSize);
    if (numTeams === 0) {
       toast({
        title: 'Not enough players',
        description: `Not enough players to form any ${teamSize}-player teams.`,
        variant: 'destructive',
      });
      return;
    }

    // Sort players by skill descending for fair distribution
    const sortedPlayers = [...presentPlayers].sort((a, b) => b.skill - a.skill);

    const shuffledTeamNames = shuffleArray(teamNames);

    const newTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
      name: shuffledTeamNames[i % shuffledTeamNames.length],
      players: [],
    }));
    
    // Snake draft distribution
    let direction = 1;
    let teamIndex = 0;
    sortedPlayers.slice(0, numTeams * teamSize).forEach(player => {
        newTeams[teamIndex].players.push(player);
        teamIndex += direction;
        if (teamIndex < 0 || teamIndex >= numTeams) {
            direction *= -1;
            teamIndex += direction;
        }
    });

    setTeams(newTeams);

    // Round Robin schedule generation
    const teamNamesForSchedule = newTeams.map(t => t.name);
    const newSchedule: Match[] = [];
    if (teamNamesForSchedule.length < 2) {
      setSchedule([]);
    } else {
        const courts = ['Court 1', 'Court 2'];
        let courtIndex = 0;
        for (let i = 0; i < teamNamesForSchedule.length; i++) {
          for (let j = i + 1; j < teamNamesForSchedule.length; j++) {
            newSchedule.push({
              id: crypto.randomUUID(),
              teamA: teamNamesForSchedule[i],
              teamB: teamNamesForSchedule[j],
              resultA: null,
              resultB: null,
              court: courts[courtIndex % courts.length]
            });
            courtIndex++;
          }
        }
        setSchedule(shuffleArray(newSchedule));
    }
    
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

  const getTeamAnalysis = (team: Team) => {
    const totalSkill = team.players.reduce((sum, p) => sum + p.skill, 0);
    const avgSkill = (totalSkill / team.players.length).toFixed(1);
    const guyCount = team.players.filter(p => p.gender === 'Guy').length;
    const galCount = team.players.filter(p => p.gender === 'Gal').length;
    return { totalSkill, avgSkill, guyCount, galCount };
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Team & Schedule Generation</CardTitle>
          <CardDescription>Generate balanced teams and a match schedule for tonight.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                <div className='space-y-2'>
                    <Label>Team Size</Label>
                    <RadioGroup value={String(teamSize)} onValueChange={(val) => setTeamSize(Number(val))} className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="3" id="3v3" />
                            <Label htmlFor="3v3">3 vs 3</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="4" id="4v4" />
                            <Label htmlFor="4v4">4 vs 4</Label>
                        </div>
                    </RadioGroup>
                </div>
                <Separator orientation='vertical' className='hidden sm:block h-12' />
                <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Present Players</p>
                    <p className="text-2xl font-bold">{presentPlayers.length}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Possible Teams</p>
                    <p className="text-2xl font-bold">{possibleTeamsCount}</p>
                </div>
                <Button onClick={handleGenerate} className="mt-4 sm:mt-0">
                    <Swords className="mr-2 h-4 w-4" />
                    Generate Teams & Schedule
                </Button>
            </div>
        </CardContent>
      </Card>
      
      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tonight's Teams</CardTitle>
            <CardDescription>Analysis of the generated teams.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => {
              const { totalSkill, avgSkill, guyCount, galCount } = getTeamAnalysis(team);
              return (
              <Card key={team.name} className="flex flex-col">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow p-4 pt-0">
                  <div className="space-y-3">
                    {team.players.map(player => (
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
                        <div className='flex items-center gap-2'><BarChart2 className="h-4 w-4" /> Total Skill: <span className="font-bold text-foreground">{totalSkill}</span></div>
                        <div className='flex items-center gap-2'><TrendingUp className="h-4 w-4" /> Avg Skill: <span className="font-bold text-foreground">{avgSkill}</span></div>
                    </div>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Gender: <span className="font-bold text-foreground">{guyCount} Guys, {galCount} Gals</span></div>
                </CardFooter>
              </Card>
            )})}
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
