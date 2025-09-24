

'use client';

import type { Match, GameFormat, GameVariant, Player, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, CalendarDays, Send, Trash2, Clock } from 'lucide-react';
import React, { useMemo, useEffect } from 'react';
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
  
    const generateRoundRobinSchedule = (teamNames: string[], gamesPerTeam: number): Match[] => {
        const numTeams = teamNames.length;
        if (numTeams < 2) return [];

        if ((numTeams * gamesPerTeam) % 2 !== 0) {
            // This case should be prevented by the UI, but as a safeguard:
            toast({
                title: "Scheduling Impossible",
                description: `With an odd number of teams, each team must play an even number of games.`,
                variant: "destructive",
            });
            return [];
        }

        let allPossiblePairings: { teamA: string; teamB: string }[] = [];
        for (let i = 0; i < numTeams; i++) {
            for (let j = i + 1; j < numTeams; j++) {
                allPossiblePairings.push({ teamA: teamNames[i], teamB: teamNames[j] });
            }
        }
        
        let gamePool: { teamA: string; teamB: string }[] = [];
        // Create a large enough pool of games to satisfy the requirements
        let repeats = Math.ceil((numTeams * gamesPerTeam) / (2 * allPossiblePairings.length));
        for (let i = 0; i < repeats; i++) {
            gamePool.push(...shuffleArray(allPossiblePairings));
        }
        gamePool = shuffleArray(gamePool);


        const newSchedule: Match[] = [];
        const gamesCount: { [key: string]: number } = {};
        teamNames.forEach(name => (gamesCount[name] = 0));
        
        const startTime = new Date();
        startTime.setHours(18, 45, 0, 0); // 6:45 PM
        const courts = ['Court 1', 'Court 2'];
        const gameDuration = 30; // 30 minutes
        let timeSlotIndex = 0;

        const totalGamesToSchedule = (numTeams * gamesPerTeam) / 2;

        while(newSchedule.length < totalGamesToSchedule) {
            const currentTime = addMinutes(startTime, timeSlotIndex * gameDuration);
            const teamsInCurrentTimeslot = new Set<string>();
            
            // Try to fill both courts for the current time slot
            for (const court of courts) {
                if (newSchedule.length >= totalGamesToSchedule) break;

                // Find a valid game for this court in this time slot
                let gameFound = false;
                for (let i = 0; i < gamePool.length; i++) {
                    const { teamA, teamB } = gamePool[i];

                    if (
                        !teamsInCurrentTimeslot.has(teamA) &&
                        !teamsInCurrentTimeslot.has(teamB) &&
                        gamesCount[teamA] < gamesPerTeam &&
                        gamesCount[teamB] < gamesPerTeam
                    ) {
                        newSchedule.push({
                            id: crypto.randomUUID(),
                            teamA,
                            teamB,
                            resultA: null,
                            resultB: null,
                            court: court,
                            time: format(currentTime, 'h:mm a'),
                        });
                        
                        gamesCount[teamA]++;
                        gamesCount[teamB]++;
                        teamsInCurrentTimeslot.add(teamA);
                        teamsInCurrentTimeslot.add(teamB);
                        gamePool.splice(i, 1); // Remove the scheduled game from the pool
                        gameFound = true;
                        break; // Move to the next court
                    }
                }
            }
            
            timeSlotIndex++;
            
            // Safety break to prevent infinite loops in case logic fails
            if (timeSlotIndex > 50) { 
                toast({ title: "Scheduler timed out", description: "Could not create a full schedule.", variant: "destructive" });
                break;
            }
        }
        
        return newSchedule;
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
            if(newSchedule.length > 0) {
              if (gameFormat === 'round-robin') formatDescription = "Round Robin";
              else if (gameFormat === 'level-up') formatDescription = "Level Up";
              else formatDescription = "Pool Play / Bracket";
            }
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
    
    if (newSchedule.length > 0 || formatDescription === 'Blind Draw') {
        setSchedule(newSchedule);
        toast({
            title: 'Schedule Generated!',
            description: `${newSchedule.length} matches have been created for the ${formatDescription} format.`,
        });
    }
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
  
  const isOddTeamCount = teams.length % 2 !== 0;
  const gameOptions = [2, 3, 4, 5, 6];
  
  const validGameOptions = useMemo(() => {
      if (isOddTeamCount) {
          return gameOptions.filter(num => num % 2 === 0);
      }
      return gameOptions;
  }, [isOddTeamCount]);
  
  // Effect to auto-correct gamesPerTeam if it becomes invalid
  useEffect(() => {
    if (isOddTeamCount && gamesPerTeam % 2 !== 0) {
        const closestEven = gamesPerTeam > 2 ? gamesPerTeam - 1 : 2;
        if(validGameOptions.includes(closestEven)) {
            setGamesPerTeam(closestEven);
            toast({
                title: 'Game Count Adjusted',
                description: `With an odd number of teams, game count must be even. Switched to ${closestEven} games per team.`,
                variant: 'default'
            });
        }
    }
  }, [isOddTeamCount, gamesPerTeam, setGamesPerTeam, toast, validGameOptions]);


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
                        disabled={teams.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of games" />
                      </SelectTrigger>
                      <SelectContent>
                        {validGameOptions.map(num => (
                            <SelectItem key={num} value={String(num)}>{num} games</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isOddTeamCount && <p className='text-xs text-muted-foreground pt-1'>With an odd number of teams, only even game counts are selectable to ensure a fair schedule.</p>}
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
