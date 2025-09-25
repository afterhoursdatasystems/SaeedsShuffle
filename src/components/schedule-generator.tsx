

'use client';

import type { Match, Player, Team } from '@/types';
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
import { addMinutes, format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

function generateRoundRobinSchedule(teamNames: string[], gamesPerTeam: number, courts = ['Court 1', 'Court 2']) {
    console.log('=== TOURNAMENT SCHEDULER START ===');
    console.log(`Teams: ${teamNames.length} (${teamNames.join(', ')})`);
    console.log(`Games per team: ${gamesPerTeam}`);
    console.log(`Available courts: ${courts.length}`);

    if (teamNames.length < 2) {
        throw new Error('Need at least 2 teams to generate schedule');
    }

    const totalGamesNeeded = Math.ceil((teamNames.length * gamesPerTeam) / 2);
    console.log(`Total games to schedule: ${totalGamesNeeded}`);

    const allMatchups = [];
    for (let i = 0; i < teamNames.length; i++) {
        for (let j = i + 1; j < teamNames.length; j++) {
            allMatchups.push({ teamA: teamNames[i], teamB: teamNames[j] });
        }
    }

    let gamePool = [];
    while (gamePool.length < totalGamesNeeded) {
        gamePool.push(...shuffleArray([...allMatchups]));
    }
    gamePool = gamePool.slice(0, totalGamesNeeded);
    
    const schedule = [];
    const teamGameCounts: { [key: string]: number } = {};
    teamNames.forEach(name => teamGameCounts[name] = 0);
    
    const startTime = new Date();
    startTime.setHours(18, 45, 0, 0);
    const gameDuration = 30;
    let timeSlotIndex = 0;
    
    let originalPool = [...gamePool];

    while (gamePool.length > 0) {
        const currentTime = addMinutes(startTime, timeSlotIndex * gameDuration);
        const timeSlot = format(currentTime, 'h:mm a');
        console.log(`\n--- Time Slot ${timeSlot} ---`);

        let scheduledInSlot = 0;
        let teamsInSlot = new Set<string>();

        let court1GameIndex = -1;
        let court2GameIndex = -1;

        // Try to find a pair
        for (let i = 0; i < gamePool.length; i++) {
            const game1 = gamePool[i];
            
            for (let j = i + 1; j < gamePool.length; j++) {
                const game2 = gamePool[j];
                
                // Check for team conflict
                const teams = new Set([game1.teamA, game1.teamB, game2.teamA, game2.teamB]);
                if (teams.size === 4) {
                    // Found a compatible pair
                    court1GameIndex = i;
                    court2GameIndex = j;
                    break;
                }
            }
            if (court1GameIndex !== -1) break;
        }

        if (court1GameIndex !== -1 && court2GameIndex !== -1) {
            // Schedule the pair
            const game1 = gamePool[court1GameIndex];
            const game2 = gamePool[court2GameIndex];

            const match1: Match = {
                id: crypto.randomUUID(),
                teamA: game1.teamA, teamB: game1.teamB, court: courts[0], time: timeSlot,
                resultA: null, resultB: null
            };
            schedule.push(match1);
            console.log(`  - Scheduled on ${courts[0]}: ${game1.teamA} vs ${game1.teamB}`);

            const match2: Match = {
                id: crypto.randomUUID(),
                teamA: game2.teamA, teamB: game2.teamB, court: courts[1], time: timeSlot,
                resultA: null, resultB: null
            };
            schedule.push(match2);
            console.log(`  - Scheduled on ${courts[1]}: ${game2.teamA} vs ${game2.teamB}`);
            
            // Remove in reverse index order to not mess up indices
            gamePool.splice(court2GameIndex, 1);
            gamePool.splice(court1GameIndex, 1);

        } else if (gamePool.length > 0) {
            // Could not find a pair, schedule a single game
            const game = gamePool[0];
             const match: Match = {
                id: crypto.randomUUID(),
                teamA: game.teamA, teamB: game.teamB, court: courts[0], time: timeSlot,
                resultA: null, resultB: null
            };
            schedule.push(match);
            console.log(`  - Scheduled on ${courts[0]} (no pair found): ${game.teamA} vs ${game.teamB}`);
            gamePool.splice(0, 1);
        } else {
             console.log('No more games could be scheduled.');
             break;
        }

        if (schedule.length >= totalGamesNeeded) {
             console.log('All required games have been scheduled. Exiting loop.');
             break;
        }
        
        timeSlotIndex++;
        
        if (timeSlotIndex > 100) {
            console.error('Safety break: Too many iterations');
            break;
        }
    }
    
    console.log('=== SCHEDULING COMPLETE ===');
    console.log(schedule);
    
    return schedule;
}


export function ScheduleGenerator() {
  const { teams, schedule, setSchedule, gameFormat, gameVariant, players, activeRule, pointsToWin, gamesPerTeam, setGamesPerTeam } = usePlayerContext();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = React.useState(false);

  const presentPlayers = players.filter(p => p.presence === 'Present');
  
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
        <CardContent className="flex flex-col sm:flex-row items-end gap-4">
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
            <div className="flex gap-2 w-full sm:w-auto">
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
