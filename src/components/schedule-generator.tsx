

'use client';

import type { Match, GameFormat, GameVariant, Player, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, CalendarDays, Send, Trash2 } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { usePlayerContext } from '@/contexts/player-context';
import { publishData } from '@/app/actions';
import { format } from 'date-fns';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


export function ScheduleGenerator() {
  const { teams, schedule, setSchedule, gameFormat, gameVariant, players, activeRule, pointsToWin } = usePlayerContext();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = React.useState(false);

  const presentPlayers = players.filter(p => p.present);
  
  const generateRoundRobinSchedule = (teamsInput: string[]): Match[] => {
    const courts = ['Court 1', 'Court 2'];
    const gameDuration = 30; // in minutes
    const startTime = new Date();
    startTime.setHours(18, 45, 0, 0); // 6:45 PM
    
    let teamNames = [...teamsInput];
    // If odd number of teams, add a "BYE" team
    if (teamNames.length % 2 !== 0) {
      teamNames.push('BYE');
    }
    
    const numTeams = teamNames.length;
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const newSchedule: Match[] = [];

    for (let round = 0; round < numRounds; round++) {
      const roundTime = new Date(startTime.getTime() + round * gameDuration * 60000);
      
      for (let i = 0; i < matchesPerRound; i++) {
        const teamA = teamNames[i];
        const teamB = teamNames[numTeams - 1 - i];

        if (teamA !== 'BYE' && teamB !== 'BYE') {
          newSchedule.push({
            id: crypto.randomUUID(),
            teamA,
            teamB,
            resultA: null,
            resultB: null,
            court: 'To be assigned', // We'll assign courts later
            time: format(roundTime, 'h:mm a'),
          });
        }
      }

      // Rotate teams for the next round
      const lastTeam = teamNames.pop()!;
      teamNames.splice(1, 0, lastTeam);
    }
    
    // Assign courts to matches within each time slot
    const scheduleByTime = newSchedule.reduce((acc, match) => {
      if (!acc[match.time]) {
        acc[match.time] = [];
      }
      acc[match.time].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    const finalSchedule: Match[] = [];
    Object.values(scheduleByTime).forEach(timeSlotMatches => {
      timeSlotMatches.forEach((match, index) => {
        match.court = courts[index % courts.length];
        finalSchedule.push(match);
      });
    });

    return finalSchedule.sort((a, b) => new Date(`1/1/1970 ${a.time}`).getTime() - new Date(`1/1/1970 ${b.time}`).getTime());
  };

  const generateBlindDrawSchedule = (playersForDraw: Player[]): Match[] => {
      const newSchedule: Match[] = [];
      const courts = ['Court 1', 'Court 2'];
      const teamSize = 4;
      const gameDuration = 30; // in minutes
      const numMatchesPerRound = Math.floor(playersForDraw.length / (teamSize * 2));

      if(numMatchesPerRound < 1) {
        toast({ title: 'Not enough players', description: `Need at least ${teamSize*2} players for a blind draw match.`, variant: 'destructive' });
        return [];
      }
      
      const shuffledPlayers = shuffleArray(playersForDraw);
      
      const startTime = new Date();
      startTime.setHours(18, 45, 0, 0); // 6:45 PM

      for(let i = 0; i < numMatchesPerRound; i++) {
        const teamAPlayers = shuffledPlayers.splice(0, teamSize);
        const teamBPlayers = shuffledPlayers.splice(0, teamSize);
        const matchTime = new Date(startTime.getTime() + Math.floor(i / courts.length) * gameDuration * 60000);
        
        newSchedule.push({
            id: crypto.randomUUID(),
            teamA: teamAPlayers.map(p => p.name).join(', '),
            teamB: teamBPlayers.map(p => p.name).join(', '),
            resultA: null,
            resultB: null,
            court: courts[i % courts.length],
            time: format(matchTime, 'h:mm a'),
        });
      }

      // In a real app, you'd handle leftover players
      return newSchedule;
  };

  const generateKOTCSchedule = (teamNames: string[]): Match[] => {
    if (teamNames.length < 2) return [];
    
    const shuffledTeams = shuffleArray(teamNames);
    const startTime = format(new Date(), 'h:mm a'); // KOTC is continuous

    let waitingTeams = [...shuffledTeams];
    const kingCourtMatch: Match = {
        id: crypto.randomUUID(),
        teamA: waitingTeams.shift()!,
        teamB: waitingTeams.shift()!,
        resultA: null,
        resultB: null,
        court: 'King Court',
        time: startTime,
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
            time: startTime,
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
            time: '---'
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
        case 'level-up':
        case 'pool-play-bracket':
        case 'round-robin':
            newSchedule = generateRoundRobinSchedule(teams.map(t => t.name));
            if (gameFormat === 'round-robin') formatDescription = "Round Robin";
            else if (gameFormat === 'level-up') formatDescription = "Level Up";
            else formatDescription = "Pool Play / Bracket";
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
     if (schedule.length === 0 && gameFormat !== 'blind-draw') {
      toast({
        title: 'No Schedule Generated',
        description: 'Please generate a schedule before publishing.',
        variant: 'destructive',
      });
      return;
    }
    
    if (gameFormat === 'blind-draw' && teams.length > 0) {
      toast({
        title: 'Blind Draw incompatible with generated teams',
        description: 'Please clear teams before publishing a blind draw format',
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
    const result = await publishData(teamsToPublish, finalFormat, schedule, activeRule, pointsToWin);
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
  
    const handleClearSchedule = () => {
    setSchedule([]);
    toast({
      title: 'Schedule Cleared',
      description: 'The match schedule has been cleared.',
    });
  };
  
  const isKOTC = gameFormat === 'king-of-the-court';

  return (
    <div className="space-y-8">
       <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Schedule Generation</CardTitle>
                <CardDescription>Generate the match schedule for the chosen game format.</CardDescription>
              </div>
               <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 <Button onClick={handleGenerateSchedule} className="w-full sm:w-auto">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Generate Schedule
                </Button>
                <Button onClick={handleClearSchedule} variant="outline" className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Schedule
                </Button>
              </div>
           </div>
        </CardHeader>
       </Card>

      {schedule.length > 0 && (
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Match Schedule & Results</CardTitle>
                    <CardDescription>Enter results as games are completed.</CardDescription>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button onClick={handleSaveAllResults} variant="secondary" className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        Save All Results
                    </Button>
                     <Button onClick={handlePublish} disabled={isPublishing} className="w-full sm:w-auto">
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
                    <TableHead className="w-[100px]">Time</TableHead>
                    <TableHead className="w-[150px]">Court / Status</TableHead>
                    <TableHead>Team A</TableHead>
                    <TableHead>{ isKOTC ? 'vs Team B / Status' : 'Team B'}</TableHead>
                    <TableHead className={cn("w-[120px] text-center", isKOTC && "hidden")}>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-bold">{match.time}</TableCell>
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

    