

'use client';

import type { Match, Player, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, CalendarDays, Send, Trash2, Clock } from 'lucide-react';
import React, { useMemo } from 'react';
import { usePlayerContext } from '@/contexts/player-context';
import { publishData } from '@/app/actions';
import { addMinutes, format, parse } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { GameMatrix } from './game-matrix';


const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const PlayerRoster = ({ players }: { players: Player[] }) => (
    <div className="space-y-2 px-4 py-2">
        {players.length > 0 ? (
            players.sort((a,b) => a.name.localeCompare(b.name)).map(player => (
                <div key={player.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-muted text-xs">
                            {player.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{player.name}</span>
                </div>
            ))
        ) : (
            <p className="text-sm text-muted-foreground">Roster not available.</p>
        )}
    </div>
);


function generateRoundRobinSchedule(
    teamNames: string[], 
    gamesPerTeam: number, 
    startTimeStr: string,
    courts = ['Court 1', 'Court 2']
): Match[] {
    console.log('=== TOURNAMENT SCHEDULER START ===');
    console.log(`Teams: ${teamNames.length} (${teamNames.join(', ')})`);
    console.log(`Games per team: ${gamesPerTeam}`);
    console.log(`Available courts: ${courts.length}`);
    
    if (teamNames.length < 2) {
        return [];
    }
    
    // --- Phase 1: Create a fair game pool ---
    const totalGamesNeeded = Math.ceil((teamNames.length * gamesPerTeam) / 2);
    console.log(`Total games to schedule: ${totalGamesNeeded}`);

    let gamePool: { teamA: string; teamB: string }[] = [];
    const allPossibleMatchups: { teamA: string; teamB: string }[] = [];
    for (let i = 0; i < teamNames.length; i++) {
        for (let j = i + 1; j < teamNames.length; j++) {
            allPossibleMatchups.push({ teamA: teamNames[i], teamB: teamNames[j] });
        }
    }

    const teamPlayCounts: { [key: string]: number } = {};
    teamNames.forEach(name => teamPlayCounts[name] = 0);
    
    // Iteratively build the game pool to ensure fairness
    let poolAttempts = 0;
    while(gamePool.length < totalGamesNeeded && poolAttempts < 1000) {
      let shuffledMatchups = shuffleArray(allPossibleMatchups);
      for(const candidateGame of shuffledMatchups) {
        if(gamePool.length >= totalGamesNeeded) break;

        const { teamA, teamB } = candidateGame;
        if(teamPlayCounts[teamA] < gamesPerTeam && teamPlayCounts[teamB] < gamesPerTeam) {
           const isAlreadyInPool = gamePool.some(g => (g.teamA === teamA && g.teamB === teamB) || (g.teamA === teamB && g.teamB === teamA));
           if (!isAlreadyInPool) { // Avoid adding duplicate matchups if gamesPerTeam is low
              gamePool.push(candidateGame);
              teamPlayCounts[teamA]++;
              teamPlayCounts[teamB]++;
           }
        }
      }
      poolAttempts++;
    }


    console.log('Final pool game counts:', teamPlayCounts);
    
    // --- Phase 1B: Shuffle the generated pool ---
    gamePool = shuffleArray(gamePool);


    // --- Phase 2: Schedule games from the pool ---
    const schedule: Match[] = [];
    
    const startTime = parse(startTimeStr, 'HH:mm', new Date());
    const gameDuration = 30;
    let timeSlotIndex = 0;
    
    let unschedulableGameCounter = 0;

    while (gamePool.length > 0) {
        const currentTime = addMinutes(startTime, timeSlotIndex * gameDuration);
        const timeSlot = format(currentTime, 'h:mm a');
        console.log(`\n--- Time Slot ${timeSlot} ---`);
        
        let scheduledInThisSlot = 0;
        let scheduledGameIndices: number[] = [];

        // Exhaustive search for a compatible pair
        let foundPair = false;
        if (gamePool.length >= 2) {
            for (let i = 0; i < gamePool.length; i++) {
                for (let j = i + 1; j < gamePool.length; j++) {
                    const game1 = gamePool[i];
                    const game2 = gamePool[j];
                    const teamsInPair = new Set([game1.teamA, game1.teamB, game2.teamA, game2.teamB]);
                    if (teamsInPair.size === 4) { // No shared teams, this is a valid pair
                        // Schedule game 1
                        schedule.push({ id: crypto.randomUUID(), court: courts[0], time: timeSlot, resultA: null, resultB: null, ...game1 });
                        console.log(`  ${courts[0]}: ${game1.teamA} vs ${game1.teamB}`);
                        // Schedule game 2
                        schedule.push({ id: crypto.randomUUID(), court: courts[1], time: timeSlot, resultA: null, resultB: null, ...game2 });
                        console.log(`  ${courts[1]}: ${game2.teamA} vs ${game2.teamB}`);
                        
                        scheduledGameIndices = [i, j];
                        foundPair = true;
                        break;
                    }
                }
                if (foundPair) break;
            }
        }
        
        if (foundPair) {
            scheduledGameIndices.sort((a,b) => b-a).forEach(idx => gamePool.splice(idx, 1));
            scheduledInThisSlot = 2;
        } else if (gamePool.length > 0) {
            const singleGame = gamePool[0];
            console.log(`Could not find a pair. Scheduling single game: ${singleGame.teamA} vs ${singleGame.teamB}`);
            schedule.push({ id: crypto.randomUUID(), court: courts[0], time: timeSlot, resultA: null, resultB: null, ...singleGame });
            console.log(`  ${courts[0]}: ${singleGame.teamA} vs ${singleGame.teamB}`);
            gamePool.splice(0, 1);
            scheduledInThisSlot = 1;
        }

        if (scheduledInThisSlot > 0) {
            timeSlotIndex++;
            unschedulableGameCounter = 0; // Reset counter on success
        } else {
             unschedulableGameCounter++;
             console.warn("No games could be scheduled in this slot. Games remaining: ", gamePool.length);
             if (unschedulableGameCounter > 5 || gamePool.length === 0) {
                console.error("Breaking due to too many unschedulable slots. Remaining pool:", gamePool);
                break;
             }
        }
        
        if (timeSlotIndex > 100) {
            console.error('Safety break: Too many iterations');
            break;
        }
    }
    
    console.log('=== SCHEDULING COMPLETE ===');
    console.log(`Generated ${schedule.length} matches across ${timeSlotIndex} time slots`);
    
    return schedule;
}


export function ScheduleGenerator() {
  const { teams, schedule, setSchedule, gameFormat, gameVariant, players, activeRule, pointsToWin, gamesPerTeam, setGamesPerTeam } = usePlayerContext();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [startTime, setStartTime] = React.useState('18:45');

  const timeOptions = useMemo(() => {
    const options = [];
    const startHour = 13; // 1 PM
    const endHour = 22; // 10 PM
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = String(h).padStart(2, '0');
        const minute = String(m).padStart(2, '0');
        options.push(`${hour}:${minute}`);
      }
    }
    return options;
  }, []);
  
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
        time: '6:45 PM'
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
            time: '6:45 PM'
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
            time: 'N/A'
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
        case 'level-up':
            newSchedule = generateRoundRobinSchedule(teams.map(t => t.name), gamesPerTeam, startTime);
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
            // Blind draw logic would be different and might not use generateRoundRobinSchedule
            toast({ title: 'Blind Draw schedule not implemented yet.' });
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
    // Here you would typically send the results to your backend/DB
    // For this prototype, we just toast
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

  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach(team => map.set(team.name, team));
    return map;
  }, [teams]);

  return (
    <div className="space-y-8">
       <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Schedule Generation</CardTitle>
                <CardDescription>Generate the match schedule for the chosen game format.</CardDescription>
              </div>
           </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:flex items-end gap-4">
            <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                 <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="max-w-xs" id="start-time">
                        <SelectValue placeholder="Select a start time" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeOptions.map(time => {
                             const displayTime = format(parse(time, 'HH:mm', new Date()), 'h:mm a');
                             return (
                                <SelectItem key={time} value={time}>{displayTime}</SelectItem>
                             );
                        })}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 flex-grow">
                <Label htmlFor="games-per-team">Games Per Team</Label>
                <Select value={String(gamesPerTeam)} onValueChange={(val) => setGamesPerTeam(Number(val))}>
                    <SelectTrigger className="max-w-xs" id="games-per-team">
                        <SelectValue placeholder="Select games per team" />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2 w-full md:w-auto pt-4 md:pt-0">
                <Button onClick={handleGenerateSchedule} className="w-full sm:w-auto">
                <CalendarDays className="mr-2 h-4 w-4" />
                Generate Schedule
                </Button>
                <Button onClick={handleClearSchedule} variant="outline" className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Schedule
                </Button>
            </div>
        </CardContent>
       </Card>

      {schedule.length > 0 && (
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Match Schedule & Results</CardTitle>
                    <CardDescription>Enter results as games are completed.</CardDescription>
                </div>
                 <div className="flex gap-2 w-full sm:w-auto">
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
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">Court / Status</th>
                        <th className="p-2 text-left">Team A</th>
                        <th className="p-2 text-left">vs Team B / Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((match) => (
                        <tr key={match.id} className="border-b">
                          <td className="p-2"><Badge>{match.court}</Badge></td>
                          <td className="p-2 font-medium">{match.teamA}</td>
                          <td className="p-2 font-medium">{match.teamB}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            ) : groupedSchedule && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(groupedSchedule).map(([time, matches]) => (
                    <Card key={time}>
                      <CardHeader className="p-4 bg-muted/50">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold">
                          <Clock className="h-6 w-6 text-primary" />
                          Matches at {time}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 sm:p-4 space-y-2">
                        {matches.map((match) => {
                            const teamA = teamMap.get(match.teamA);
                            const teamB = teamMap.get(match.teamB);
                            return (
                                <div key={match.id} className="text-base rounded-lg border bg-background overflow-hidden">
                                  <div className="p-2 font-bold text-center bg-muted text-muted-foreground">{match.court}</div>
                                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full p-2">
                                      <div className="font-medium text-left">
                                          {match.teamA}
                                      </div>
                                      <div className="flex items-center gap-1">
                                         <input
                                            type="number"
                                            className="h-8 w-12 p-1 text-center border rounded-md"
                                            value={match.resultA ?? ''}
                                            onChange={(e) => handleResultChange(match.id, 'A', e.target.value)}
                                            aria-label={`${match.teamA} score`}
                                          />
                                          <span>-</span>
                                          <input
                                            type="number"
                                            className="h-8 w-12 p-1 text-center border rounded-md"
                                            value={match.resultB ?? ''}
                                            onChange={(e) => handleResultChange(match.id, 'B', e.target.value)}
                                            aria-label={`${match.teamB} score`}
                                          />
                                      </div>
                                      <div className="font-medium text-right">
                                          {match.teamB}
                                      </div>
                                  </div>
                                  <Separator />
                                  <div className="grid grid-cols-2">
                                    <div>
                                      <PlayerRoster players={teamA?.players || []} />
                                    </div>
                                    <div className="border-l">
                                      <PlayerRoster players={teamB?.players || []} />
                                    </div>
                                  </div>
                                </div>
                            )
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
            )}
          </CardContent>
        </Card>
      )}
      {schedule.length > 0 && !isKOTC && (
        <GameMatrix teams={teams} schedule={schedule} />
      )}
    </div>
  );
}
