

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
    
    // Validation
    if (teamNames.length < 2) {
        throw new Error('Need at least 2 teams to generate schedule');
    }
    
    // Phase 1: Create Game Pool
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
    
    // Phase 2: Schedule Games
    const schedule = [];
    const teamGameCounts: { [key: string]: number } = {};
    teamNames.forEach(name => teamGameCounts[name] = 0);
    
    const startTime = new Date();
    startTime.setHours(18, 45, 0, 0);
    const gameDuration = 30;
    let timeSlotIndex = 0;
    
    while (gamePool.length > 0) {
        const currentTime = addMinutes(startTime, timeSlotIndex * gameDuration);
        const timeSlot = format(currentTime, 'h:mm a');
        console.log(`\n--- Time Slot ${timeSlot} ---`);
        
        // Find valid games
        const validGamesWithIndex: { game: { teamA: string; teamB: string; }; index: number; }[] = [];
        gamePool.forEach((game, index) => {
            if (teamGameCounts[game.teamA] < gamesPerTeam && 
                teamGameCounts[game.teamB] < gamesPerTeam) {
                validGamesWithIndex.push({ game, index });
            }
        });
        
        console.log(`Found ${validGamesWithIndex.length} valid games`);
        
        // Select non-conflicting games
        const selectedGames: { game: { teamA: string; teamB: string; }; index: number; }[] = [];
        const usedTeams = new Set();
        
        for (const { game, index } of validGamesWithIndex) {
            if (!usedTeams.has(game.teamA) && !usedTeams.has(game.teamB)) {
                selectedGames.push({ game, index });
                usedTeams.add(game.teamA);
                usedTeams.add(game.teamB);
                
                if (selectedGames.length >= courts.length) break;
            }
        }
        
        console.log(`Selected ${selectedGames.length} games for scheduling`);
        
        if (selectedGames.length === 0) {
            console.log('No more games can be scheduled');
            break;
        }
        
        // Schedule selected games
        selectedGames.forEach(({ game }, courtIndex) => {
            const match: Match = {
                id: crypto.randomUUID(),
                teamA: game.teamA,
                teamB: game.teamB,
                court: courts[courtIndex],
                time: timeSlot,
                resultA: null,
                resultB: null
            };
            
            schedule.push(match);
            teamGameCounts[game.teamA]++;
            teamGameCounts[game.teamB]++;
            console.log(`  ${courts[courtIndex]}: ${game.teamA} vs ${game.teamB}`);
        });
        
        // Remove scheduled games from pool (reverse order to maintain indices)
        selectedGames
            .sort((a, b) => b.index - a.index)
            .forEach(({ index }) => gamePool.splice(index, 1));
        
        timeSlotIndex++;
        
        // Safety valve
        if (timeSlotIndex > 100) {
            console.error('Safety break: Too many iterations');
            break;
        }
    }
    
    console.log('=== SCHEDULING COMPLETE ===');
    console.log(`Generated ${schedule.length} matches across ${timeSlotIndex} time slots`);
    console.log('Final game counts:', teamGameCounts);
    
    return schedule;
}


export function ScheduleGenerator() {
  const { teams, schedule, setSchedule, gameFormat, gameVariant, players, activeRule, pointsToWin, gamesPerTeam } = usePlayerContext();
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
