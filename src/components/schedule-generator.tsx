
'use client';

import type { Match, GameFormat, GameVariant, Player } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, CalendarDays, Send, BookOpen, Trophy, Crown, Shuffle } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { usePlayerContext } from '@/contexts/player-context';
import { publishData } from '@/app/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


export function ScheduleGenerator() {
  const { teams, schedule, setSchedule, gameFormat, setGameFormat, gameVariant, setGameVariant, players } = usePlayerContext();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = React.useState(false);

  const presentPlayers = players.filter(p => p.present);
  
  const generateRoundRobinSchedule = (teamNames: string[]): Match[] => {
    const newSchedule: Match[] = [];
    const courts = ['Court 1', 'Court 2'];
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
    return shuffleArray(newSchedule);
  };

  const generateBlindDrawSchedule = (playersForDraw: Player[]): Match[] => {
      const newSchedule: Match[] = [];
      const courts = ['Court 1', 'Court 2'];
      const teamSize = 4;
      const numMatches = Math.floor(playersForDraw.length / (teamSize * 2));

      if(numMatches < 1) {
        toast({ title: 'Not enough players', description: `Need at least ${teamSize*2} players for a blind draw match.`, variant: 'destructive' });
        return [];
      }
      
      const shuffledPlayers = shuffleArray(playersForDraw);
      
      for(let i = 0; i < numMatches; i++) {
        const teamAPlayers = shuffledPlayers.splice(0, teamSize);
        const teamBPlayers = shuffledPlayers.splice(0, teamSize);
        
        newSchedule.push({
            id: crypto.randomUUID(),
            teamA: teamAPlayers.map(p => p.name).join(', '),
            teamB: teamBPlayers.map(p => p.name).join(', '),
            resultA: null,
            resultB: null,
            court: courts[i % courts.length],
        });
      }

      // In a real app, you'd handle leftover players
      return newSchedule;
  };

  const generateKOTCSchedule = (teamNames: string[]): Match[] => {
    if (teamNames.length < 2) return [];
    
    const shuffledTeams = shuffleArray(teamNames);

    let waitingTeams = [...shuffledTeams];
    const kingCourtMatch: Match = {
        id: crypto.randomUUID(),
        teamA: waitingTeams.shift()!,
        teamB: waitingTeams.shift()!,
        resultA: null,
        resultB: null,
        court: 'King Court',
    };

    let newSchedule: Match[] = [kingCourtMatch];

    if (waitingTeams.length >= 2) {
        const challengerCourtMatch: Match = {
            id: crypto.randomUUID(),
            teamA: waitingTeams.shift()!,
            teamB: waitingTeams.shift()!,
            resultA: null,
            resultB: null,
            court: 'Challenger Court',
        };
        newSchedule.push(challengerCourtMatch);
    }
    
    waitingTeams.forEach((teamName, index) => {
        newSchedule.push({
            id: crypto.randomUUID(),
            teamA: teamName,
            teamB: `Waiting #${index + 1}`,
            resultA: null,
            resultB: null,
            court: 'Challenger Line',
        });
    });

    return newSchedule;
  };

  const handleGenerateSchedule = () => {
    if (gameFormat !== 'blind-draw' && teams.length < 2) {
      toast({
        title: 'Not enough teams',
        description: 'Please generate teams before creating a schedule.',
        variant: 'destructive',
      });
      return;
    }

    let newSchedule: Match[] = [];
    let formatDescription = '';

    switch(gameFormat) {
        case 'pool-play-bracket':
        case 'round-robin':
            newSchedule = generateRoundRobinSchedule(teams.map(t => t.name));
            formatDescription = gameFormat === 'round-robin' ? "Round Robin" : "Pool Play / Bracket";
            break;
        case 'king-of-the-court':
            newSchedule = generateKOTCSchedule(teams.map(t => t.name));
            switch(gameVariant) {
                case 'standard': formatDescription = "King of the Court"; break;
                case 'monarch-of-the-court': formatDescription = "Monarch of the Court"; break;
                case 'king-s-ransom': formatDescription = "King's Ransom"; break;
                case 'power-up-round': formatDescription = "Power-Up Round"; break;
            }
            break;
        case 'blind-draw':
            newSchedule = generateBlindDrawSchedule(presentPlayers);
            formatDescription = 'Blind Draw';
            break;
        default:
             toast({
                title: 'Unknown game format',
                description: 'Please select a valid game format.',
                variant: 'destructive',
             });
             return;
    }

    setSchedule(newSchedule);
    
    toast({
      title: 'Schedule Generated!',
      description: `${newSchedule.length} matches have been created for the ${formatDescription} format.`,
    });
  };
  
  const handlePublish = async () => {
     if (schedule.length === 0) {
      toast({
        title: 'No Schedule Generated',
        description: 'Please generate a schedule before publishing.',
        variant: 'destructive',
      });
      return;
    }

    let finalFormat: any = gameFormat;
    if (gameFormat === 'king-of-the-court' && gameVariant !== 'standard') {
        finalFormat = gameVariant;
    }


    setIsPublishing(true);
    // For blind draw, we pass the players as teams since teams are ephemeral
    const teamsToPublish = gameFormat === 'blind-draw' ? [] : teams;
    const result = await publishData(teamsToPublish, finalFormat, schedule);
    setIsPublishing(false);

    if (result.success) {
      toast({
        title: 'Data Published!',
        description: (
          <span>
            Players can now view the schedule at{' '}
            <a href="/" target="_blank" className="underline font-bold">
              the public dashboard
            </a>.
          </span>
        ),
      });
    } else {
      toast({
        title: 'Error Publishing Data',
        description: result.error,
        variant: 'destructive',
      });
    }
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
  };
  
  const isKOTC = gameFormat === 'king-of-the-court';

  return (
    <div className="space-y-8">
       <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Schedule Generation</CardTitle>
                <CardDescription>Generate the match schedule for the chosen game format.</CardDescription>
              </div>
           </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between rounded-lg border p-4">
                <div className='flex flex-col sm:flex-row gap-4'>
                    <div className='space-y-2'>
                        <Label>Game Format</Label>
                        <Select value={gameFormat} onValueChange={(val: GameFormat) => setGameFormat(val)}>
                          <SelectTrigger className="w-full sm:w-[240px]">
                            <SelectValue placeholder="Select a format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="king-of-the-court"><Crown className="inline-block h-4 w-4 mr-2" /> King of the Court</SelectItem>
                            <SelectItem value="round-robin"><BookOpen className="inline-block h-4 w-4 mr-2" /> Round Robin</SelectItem>
                            <SelectItem value="pool-play-bracket"><Trophy className="inline-block h-4 w-4 mr-2" /> Pool Play / Bracket</SelectItem>
                            <SelectItem value="blind-draw"><Shuffle className="inline-block h-4 w-4 mr-2" /> Blind Draw</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    { isKOTC && (
                        <div className='space-y-2'>
                            <Label>Game Variant</Label>
                            <Select value={gameVariant} onValueChange={(val: GameVariant) => setGameVariant(val)}>
                              <SelectTrigger className="w-full sm:w-[240px]">
                                <SelectValue placeholder="Select a variant" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard KOTC</SelectItem>
                                <SelectItem value="monarch-of-the-court">Monarch of the Court</SelectItem>
                                <SelectItem value="king-s-ransom">King's Ransom</SelectItem>
                                <SelectItem value="power-up-round">Power-up Round</SelectItem>
                              </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                 <Button onClick={handleGenerateSchedule}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Generate Schedule
              </Button>
            </div>
        </CardContent>
       </Card>

      {schedule.length > 0 && (
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Match Schedule & Results</CardTitle>
                    <CardDescription>Enter results as games are completed.</CardDescription>
                </div>
                 <div className="flex gap-2 mt-4 sm:mt-0">
                    <Button onClick={handleSaveAllResults} variant="secondary">
                        <Save className="mr-2 h-4 w-4" />
                        Save All Results
                    </Button>
                     <Button onClick={handlePublish} disabled={isPublishing}>
                        <Send className="mr-2 h-4 w-4" />
                        {isPublishing ? 'Publishing...' : 'Publish to Dashboard'}
                    </Button>
                 </div>
             </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Court / Status</TableHead>
                    <TableHead>Team A</TableHead>
                    <TableHead>{ isKOTC ? 'vs Team B / Status' : 'Team B'}</TableHead>
                    <TableHead className={cn("w-[120px] text-center", isKOTC && "hidden")}>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell><Badge>{match.court}</Badge></TableCell>
                      <TableCell className="font-medium">{match.teamA}</TableCell>
                      <TableCell className="font-medium">{match.teamB}</TableCell>
                      <TableCell className={cn(isKOTC && "hidden")}>
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
