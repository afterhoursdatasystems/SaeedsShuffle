

'use client';

import type { Match, GameFormat, GameVariant, Player, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, CalendarDays, Send, Trash2, Clock } from 'lucide-react';
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePlayerContext } from '@/contexts/player-context';
import { publishData } from '@/app/actions';
import { format, addMinutes } from 'date-fns';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


export function ScheduleGenerator() {
  const { teams, schedule, setSchedule, gameFormat, gameVariant, players, activeRule, pointsToWin, gamesPerTeam, setGamesPerTeam } = usePlayerContext();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = React.useState(false);

  const presentPlayers = players.filter(p => p.presence === 'Present');
  
  const generateRoundRobinSchedule = (teamsInput: string[], gamesPerTeam: number): Match[] => {
    const courts = ['Court 1', 'Court 2'];
    const numCourts = courts.length;
    const gameDuration = 20; // in minutes
    let startTime = new Date();
    startTime.setHours(18, 45, 0, 0); // 6:45 PM
    
    let teamNames = [...teamsInput];
    const numTeams = teamNames.length;
    if (numTeams < 2) return [];

    let allPairings: { teamA: string, teamB: string }[] = [];
    for (let i = 0; i < numTeams; i++) {
        for (let j = i + 1; j < numTeams; j++) {
            allPairings.push({ teamA: teamNames[i], teamB: teamNames[j] });
        }
    }
    allPairings = shuffleArray(allPairings);

    const newSchedule: Match[] = [];
    const gamesCount: { [teamName: string]: number } = {};
    teamNames.forEach(name => gamesCount[name] = 0);

    const timeSlots: { time: Date, courts: (Match | null)[] }[] = [{ time: startTime, courts: Array(numCourts).fill(null) }];
    const teamsInCurrentTimeslot: Set<string> = new Set();
    let pairingsUsed = 0;

    while (Object.values(gamesCount).some(c => c < gamesPerTeam) && pairingsUsed < allPairings.length) {
        let scheduledInThisPass = false;
        
        for (let i = 0; i < allPairings.length; i++) {
            const pairing = allPairings[i];
            if (!pairing) continue;

            const { teamA, teamB } = pairing;
            
            if (gamesCount[teamA] >= gamesPerTeam || gamesCount[teamB] >= gamesPerTeam) {
                continue;
            }

            let scheduled = false;
            // Try to find a slot for the current pairing
            for (const slot of timeSlots) {
                const teamsInSlot = slot.courts.flatMap(m => m ? [m.teamA, m.teamB] : []);
                if (teamsInSlot.includes(teamA) || teamsInSlot.includes(teamB)) {
                    continue; // One of the teams is busy in this slot
                }
                const openCourtIndex = slot.courts.indexOf(null);
                if (openCourtIndex !== -1) {
                    const match = {
                        id: crypto.randomUUID(),
                        teamA,
                        teamB,
                        resultA: null,
                        resultB: null,
                        court: courts[openCourtIndex],
                        time: format(slot.time, 'h:mm a'),
                    };
                    slot.courts[openCourtIndex] = match;
                    newSchedule.push(match);
                    gamesCount[teamA]++;
                    gamesCount[teamB]++;
                    scheduled = true;
                    scheduledInThisPass = true;
                    allPairings[i] = null as any; // Mark pairing as used
                    break; 
                }
            }
        }
        
        // If we went through all pairings and couldn't schedule anything, add a new time slot
        if (!scheduledInThisPass) {
            const lastSlotTime = timeSlots[timeSlots.length - 1].time;
            timeSlots.push({ time: addMinutes(lastSlotTime, gameDuration), courts: Array(numCourts).fill(null) });
        }
    }


    return newSchedule.sort((a, b) => {
        const timeA = new Date(`1/1/1970 ${a.time}`).getTime();
        const timeB = new Date(`1/1/1970 ${b.time}`).getTime();
        if(timeA !== timeB) return timeA - timeB;
        return a.court.localeCompare(b.court);
    });
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
    const startTime = "6:45 PM"; // KOTC is continuous but starts at a set time

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
            newSchedule = generateRoundRobinSchedule(teams.map(t => t.name), gamesPerTeam);
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
  
  const handleSaveAllResults = async () => {
    toast({ title: "Results saved", description: "All match results have been updated." });
    // Also publish the data so the public dashboard is updated
    await handlePublish();
  };
  
    const handleClearSchedule = () => {
    setSchedule([]);
    toast({
      title: 'Schedule Cleared',
      description: 'The match schedule has been cleared.',
    });
  };
  
  const isKOTC = gameFormat === 'king-of-the-court';

  const groupedSchedule = useMemo(() => {
    if (isKOTC) return null;
    
    return schedule.reduce((acc, match) => {
      const time = match.time;
      if (!acc[time]) {
        acc[time] = [];
      }
      acc[time].push(match);
      return acc;
    }, {} as Record<string, Match[]>);
  }, [schedule, isKOTC]);
  
  const maxGamesPerTeam = teams.length > 1 ? teams.length - 1 : 0;


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
        {!isKOTC && gameFormat !== 'blind-draw' && (
             <CardContent>
                <div className='space-y-2 max-w-xs'>
                    <Label>Games Per Team</Label>
                    <Select 
                        value={String(gamesPerTeam)} 
                        onValueChange={(val) => setGamesPerTeam(Number(val))}
                        disabled={maxGamesPerTeam === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of games" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: maxGamesPerTeam }, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={String(num)}>{num} game{num > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
            </CardContent>
        )}
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
            {isKOTC ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Time</TableHead>
                        <TableHead className="w-[150px]">Court / Status</TableHead>
                        <TableHead>Team A</TableHead>
                        <TableHead>vs Team B / Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.map((match) => (
                        <TableRow key={match.id}>
                          <TableCell className="font-bold">{match.time}</TableCell>
                          <TableCell><Badge>{match.court}</Badge></TableCell>
                          <TableCell className="font-medium">{match.teamA}</TableCell>
                          <TableCell className="font-medium">{match.teamB}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupedSchedule && Object.entries(groupedSchedule).map(([time, matches]) => (
                    <Card key={time}>
                      <CardHeader className="p-4 bg-muted/50">
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <Clock className="h-5 w-5 text-primary" />
                          Matches at {time}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableBody>
                            {matches.map((match) => (
                                <React.Fragment key={match.id}>
                                    <TableRow className="border-b-0">
                                        <TableCell colSpan={3} className="p-2 text-center">
                                            <Badge variant="outline">{match.court}</Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium p-2">{match.teamA}</TableCell>
                                        <TableCell className="p-1 w-[120px]">
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
                                        <TableCell className="font-medium p-2 text-right">{match.teamB}</TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
