

'use client';

import type { Match, Player, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, CalendarDays, Send, Trash2, Clock, Trophy } from 'lucide-react';
import React, { useMemo } from 'react';
import { usePlayerContext } from '@/contexts/player-context';
import { publishData } from '@/app/actions';
import { addMinutes, format, parse } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { GameMatrix } from './game-matrix';
import { cn } from '@/lib/utils';


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
    console.log(`--- SCHEDULER START: ${teamNames.length} teams, ${gamesPerTeam} games each, ${courts.length} courts ---`);
    
    if (teamNames.length < 2) return [];

    let gamePool: { teamA: string; teamB: string }[] = [];
    const totalGamesNeeded = Math.ceil((teamNames.length * gamesPerTeam) / 2);
    
    const buildGamePool = (): { teamA: string; teamB: string }[] => {
        let pool: { teamA: string; teamB: string }[] = [];
        const teamPlayCounts: { [key: string]: number } = {};
        const matchups: { [key: string]: string[] } = {};
        teamNames.forEach(name => {
            teamPlayCounts[name] = 0;
            matchups[name] = [];
        });

        const allPossibleMatchups: { teamA: string; teamB: string }[] = [];
        for (let i = 0; i < teamNames.length; i++) {
            for (let j = i + 1; j < teamNames.length; j++) {
                allPossibleMatchups.push({ teamA: teamNames[i], teamB: teamNames[j] });
            }
        }
        
        let availableGames = shuffleArray(allPossibleMatchups);
        let passes = 0;
        const maxPasses = 10; // Safety break

        // Pass 1: Prioritize unique matchups
        while (pool.length < totalGamesNeeded && passes < maxPasses) {
            let gameAddedInThisRound = false;
            for (const matchup of availableGames) {
                if (pool.length >= totalGamesNeeded) break;
                const { teamA, teamB } = matchup;

                const isUnique = !matchups[teamA].includes(teamB);
                if (isUnique && teamPlayCounts[teamA] < gamesPerTeam && teamPlayCounts[teamB] < gamesPerTeam) {
                    pool.push(matchup);
                    teamPlayCounts[teamA]++;
                    teamPlayCounts[teamB]++;
                    matchups[teamA].push(teamB);
                    matchups[teamB].push(teamA);
                    gameAddedInThisRound = true;
                }
            }
            if (!gameAddedInThisRound && pool.length < totalGamesNeeded) {
                // If no unique games can be added, break to backfill pass
                break;
            }
            passes++;
        }
        console.log("Pool after pass 1:", pool.length, "games. Counts:", teamPlayCounts);

        // Pass 2 (Backfill): If still not enough games, allow repeats to meet quotas
        passes = 0; // Reset for backfill
        while(pool.length < totalGamesNeeded && passes < maxPasses) {
            let gameAdded = false;
            availableGames = shuffleArray(allPossibleMatchups); // Reshuffle to try different combinations

            for (const matchup of availableGames) {
                 if (pool.length >= totalGamesNeeded) break;
                const { teamA, teamB } = matchup;
                if (teamPlayCounts[teamA] < gamesPerTeam && teamPlayCounts[teamB] < gamesPerTeam) {
                    pool.push(matchup);
                    teamPlayCounts[teamA]++;
                    teamPlayCounts[teamB]++;
                    matchups[teamA].push(teamB);
                    matchups[teamB].push(teamA);
                    gameAdded = true;
                }
            }
            if (!gameAdded) break; 
            passes++;
        }
        
        console.log('Final game counts:', teamPlayCounts);
        console.log(`--- SCHEDULING COMPLETE: ${pool.length} matches generated. ---`);
        return pool;
    };
    
    gamePool = buildGamePool();


    // --- 2. Schedule the games into time slots ---
    const schedule: Match[] = [];
    const startTime = parse(startTimeStr, 'HH:mm', new Date());
    const gameDuration = 30; // in minutes
    let timeSlotIndex = 0;

    const teamLastPlayTimeSlot: { [team: string]: number } = {};
    teamNames.forEach(t => teamLastPlayTimeSlot[t] = -1);

    let tempGamePool = [...gamePool];
    let schedulingAttempts = 0;

    while (tempGamePool.length > 0 && schedulingAttempts < 500) {
        const currentTime = addMinutes(startTime, timeSlotIndex * gameDuration);
        const currentTimeSlotStr = format(currentTime, 'h:mm a');
        let teamsPlayingInThisSlot: string[] = [];
        
        let gamesScheduledInThisSlot = 0;

        // Shuffle courts for this time slot to ensure fairness
        const shuffledCourts = shuffleArray(courts);

        // Try to fill all courts in the current time slot
        for (const court of shuffledCourts) {
            if (tempGamePool.length === 0) break;

            let bestGameIndex = -1;
            let bestGameScore = -1;

            // Find the best game for the current court and time slot
            for (let i = 0; i < tempGamePool.length; i++) {
                const game = tempGamePool[i];
                if (teamsPlayingInThisSlot.includes(game.teamA) || teamsPlayingInThisSlot.includes(game.teamB)) {
                    continue; // One of the teams is already playing in this time slot
                }
                
                // Prioritize games with teams that have rested the longest
                const teamARest = timeSlotIndex - (teamLastPlayTimeSlot[game.teamA] ?? -1);
                const teamBRest = timeSlotIndex - (teamLastPlayTimeSlot[game.teamB] ?? -1);
                const score = teamARest + teamBRest;

                if (score > bestGameScore) {
                    bestGameScore = score;
                    bestGameIndex = i;
                }
            }
            
            if (bestGameIndex !== -1) {
                const [gameToSchedule] = tempGamePool.splice(bestGameIndex, 1);
                const { teamA, teamB } = gameToSchedule;

                schedule.push({
                    id: crypto.randomUUID(),
                    court: court,
                    time: currentTimeSlotStr,
                    resultA: null,
                    resultB: null,
                    ...gameToSchedule
                });

                teamsPlayingInThisSlot.push(teamA, teamB);
                teamLastPlayTimeSlot[teamA] = timeSlotIndex;
                teamLastPlayTimeSlot[teamB] = timeSlotIndex;
                gamesScheduledInThisSlot++;
            }
        }
        
        // Only advance time slot if we actually scheduled games or if we're out of games
        if (gamesScheduledInThisSlot > 0 || tempGamePool.length === 0) {
            timeSlotIndex++;
        }
        schedulingAttempts++;
    }


    console.log(`--- Analyzing Generated Schedule ---`);
    teamNames.forEach(teamName => {
        const teamSchedule = schedule.filter(m => m.teamA === teamName || m.teamB === teamName);
        console.log(`Schedule for ${teamName} (${teamSchedule.length} games):`);
        teamSchedule.forEach(match => {
            const opponent = match.teamA === teamName ? match.teamB : match.teamA;
            console.log(`- ${match.time} on ${match.court} vs ${opponent}`);
        });
    });
    console.log(`--- Analysis Complete ---`);


    return schedule;
}

const isScheduleValid = (schedule: Match[], teams: Team[], gamesPerTeam: number): boolean => {
    if (teams.length === 0) return true;
    if (schedule.length === 0 && (teams.length > 0 && gamesPerTeam > 0)) return false;

    const teamNames = teams.map(t => t.name);
    const gameCounts: { [key: string]: number } = {};
    const matchups: { [key: string]: { [opponent: string]: number } } = {};
    
    teamNames.forEach(name => {
        gameCounts[name] = 0;
        matchups[name] = {};
    });

    for (const match of schedule) {
        if (gameCounts[match.teamA] !== undefined) gameCounts[match.teamA]++;
        if (gameCounts[match.teamB] !== undefined) gameCounts[match.teamB]++;
        
        if (matchups[match.teamA]) {
            matchups[match.teamA][match.teamB] = (matchups[match.teamA][match.teamB] || 0) + 1;
        }
        if (matchups[match.teamB]) {
            matchups[match.teamB][match.teamA] = (matchups[match.teamB][match.teamA] || 0) + 1;
        }
    }
    
    const timeStringToMinutes = (timeStr: string): number => parse(timeStr, 'h:mm a', new Date()).getTime();

    for (const teamName of teamNames) {
        // 1. Check if every team has the correct number of games
        if (gameCounts[teamName] !== gamesPerTeam) {
            console.warn(`Validation failed: ${teamName} has ${gameCounts[teamName]} games, expected ${gamesPerTeam}.`);
            return false;
        }
        
        const teamSchedule = schedule
            .filter(m => m.teamA === teamName || m.teamB === teamName)
            .sort((a, b) => timeStringToMinutes(a.time) - timeStringToMinutes(b.time));

        // 2. Check for fair court distribution
        if(teamSchedule.length > 1) {
            const courtUsage = new Set(teamSchedule.map(m => m.court));
            if (courtUsage.size === 1 && !courtUsage.has("Challenger Line") && !courtUsage.has("King Court")) {
                console.warn(`Validation failed: ${teamName} plays all games on one court.`);
                return false;
            }
        }
            
        if (teamSchedule.length >= 4) {
             let consecutiveGames = 1;
             for (let i = 0; i < teamSchedule.length - 1; i++) {
                const time1 = timeStringToMinutes(teamSchedule[i].time);
                const time2 = timeStringToMinutes(teamSchedule[i+1].time);

                if (time2 - time1 < 1800000 * 1.5) { // less than 45 mins apart
                    consecutiveGames++;
                } else {
                    consecutiveGames = 1; // Reset if there's a break
                }
                if (consecutiveGames >= 4) {
                    console.warn(`Validation failed: ${teamName} has 4 or more games in a row.`);
                    return false;
                }
             }
        }
    }
    
    console.log("--- Schedule is valid! ---");
    return true;
};


export function ScheduleGenerator() {
  const { teams, schedule, setSchedule, gameFormat, gameVariant, players, activeRule, pointsToWin, gamesPerTeam, setGamesPerTeam } = usePlayerContext();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [startTime, setStartTime] = React.useState('18:45');

  const timeOptions = useMemo(() => {
    const options = [];
    const startHour = 14; // 2 PM
    const endHour = 22; // 10 PM
    for (let h = startHour; h <= endHour; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hourString = String(h).padStart(2, '0');
            const minuteString = String(m).padStart(2, '0');
            const timeValue = `${hourString}:${minuteString}`;
            const displayTime = format(parse(timeValue, 'HH:mm', new Date()), 'h:mm a');
            options.push({ value: timeValue, label: displayTime });
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
    
    if (gameFormat === 'pool-play-bracket' || gameFormat === 'round-robin' || gameFormat === 'level-up') {
        let retries = 0;
        const MAX_RETRIES = 50;
        while(retries < MAX_RETRIES) {
            newSchedule = generateRoundRobinSchedule(teams.map(t => t.name), gamesPerTeam, startTime);
            if (isScheduleValid(newSchedule, teams, gamesPerTeam)) {
                break;
            }
            retries++;
            console.log(`Invalid schedule generated, retrying... (${retries}/${MAX_RETRIES})`);
        }
        if (retries === MAX_RETRIES) {
            toast({
                title: 'Scheduling Failed',
                description: `Could not generate a fair schedule after ${MAX_RETRIES} attempts. Please try again or adjust settings.`,
                variant: 'destructive',
            });
            return;
        }

        if (gameFormat === 'round-robin') formatDescription = "Round Robin";
        else if (gameFormat === 'level-up') formatDescription = "Level Up";
        else {
             formatDescription = "Pool Play / Bracket";
             // Also add empty playoff matches to db.json
             const playoffMatches = [
                { id: 'playoff-semi-1', teamA: 'TBD', teamB: 'TBD', court: 'Playoff Semi 1', time: 'Playoffs', resultA: null, resultB: null },
                { id: 'playoff-semi-2', teamA: 'TBD', teamB: 'TBD', court: 'Playoff Semi 2', time: 'Playoffs', resultA: null, resultB: null },
                { id: 'playoff-final', teamA: 'TBD', teamB: 'TBD', court: 'Championship', time: 'Playoffs', resultA: null, resultB: null },
             ];
             newSchedule.push(...playoffMatches);
        }
    } else if (gameFormat === 'king-of-the-court') {
        newSchedule = generateKOTCSchedule(teams.map(t => t.name));
        switch(gameVariant) {
            case 'standard': formatDescription = "King of the Court"; break;
            case 'monarch-of-the-court': formatDescription = "Monarch of the Court"; break;
            case 'king-s-ransom': formatDescription = "King's Ransom"; break;
            case 'power-up-round': formatDescription = "Power-Up Round"; break;
        }
    } else if (gameFormat === 'blind-draw') {
        toast({ title: 'Blind Draw schedule not implemented yet.' });
        formatDescription = 'Blind Draw';
    } else {
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
    const scoreValue = value === '' ? null : parseInt(value, 10);
  
    setSchedule(currentSchedule => {
      const matchIndex = currentSchedule.findIndex(m => m.id === matchId);
  
      if (matchIndex > -1) {
        // The match exists in the schedule, update it.
        return currentSchedule.map((m, index) =>
          index === matchIndex
            ? { ...m, [team === 'A' ? 'resultA' : 'resultB']: scoreValue }
            : m
        );
      } else {
        // This handles creating a new playoff match in the state if it doesn't exist yet
        let matchData = playoffBracket?.semiFinals.find(m => m.id === matchId) || playoffBracket?.championship;
        if (matchData) {
             const newMatch = {
                ...matchData,
                resultA: team === 'A' ? scoreValue : matchData.resultA,
                resultB: team === 'B' ? scoreValue : matchData.resultB,
            };
             return [...currentSchedule, newMatch];
        }
      }
      return currentSchedule;
    });
  };

    const handleScoreBlur = async (matchId: string) => {
        const match = schedule.find(m => m.id === matchId);
        if (match && match.resultA !== null && match.resultB !== null) {
            console.log(`Auto-saving scores for match ${matchId}`);
            const finalFormat = gameFormat === 'king-of-the-court' && gameVariant !== 'standard' ? gameVariant : gameFormat;
            const result = await publishData(teams, finalFormat, [match], activeRule, pointsToWin);

            if (!result.success) {
                toast({
                    title: 'Auto-save Failed',
                    description: `Could not save the scores for ${match.teamA} vs ${match.teamB}.`,
                    variant: 'destructive',
                });
            } else {
                 toast({
                    title: 'Scores Saved!',
                    description: `Scores for ${match.teamA} vs ${match.teamB} have been saved.`,
                });
            }
        }
    };
  
  const handleSaveAllResults = async () => {
    setIsPublishing(true);
    const finalFormat = gameFormat === 'king-of-the-court' && gameVariant !== 'standard' ? gameVariant : gameFormat;
    const result = await publishData(teams, finalFormat, schedule, activeRule, pointsToWin);
    setIsPublishing(false);

    if (result.success) {
      toast({
        title: "Results Published!",
        description: "All match results have been updated on the public dashboard."
      });
    } else {
        toast({
            title: 'Error Saving Results',
            description: result.error,
            variant: 'destructive',
        });
    }
  };
  
  const handleClearSchedule = async () => {
    setSchedule([]);
    const finalFormat = gameFormat === 'king-of-the-court' && gameVariant !== 'standard' ? gameVariant : gameFormat;
    await publishData(teams, finalFormat, [], activeRule, pointsToWin);
    toast({
      title: 'Schedule Cleared',
      description: 'The match schedule has been cleared on the server.',
    });
  };
  
  const isKOTC = gameFormat === 'king-of-the-court';

  const groupedSchedule = useMemo(() => {
    if (isKOTC) return null;
    
    const sortedSchedule = [...schedule].filter(m => !m.id.startsWith('playoff-')).sort((a,b) => {
        const timeA = parse(a.time, 'h:mm a', new Date()).getTime();
        const timeB = parse(b.time, 'h:mm a', new Date()).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.court.localeCompare(b.court);
    });

    return sortedSchedule.reduce((acc, match) => {
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
  
  const { standings } = useMemo(() => {
    const stats: { [teamName: string]: { wins: number, losses: number, pointsFor: number, pointsAgainst: number, pointDifferential: number, level: number } } = {};

    teams.forEach(team => {
      stats[team.name] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointDifferential: 0, level: team.level || 1 };
    });

    schedule.forEach(match => {
      const { teamA, teamB, resultA, resultB } = match;
      if (resultA !== null && resultB !== null) {
        if (stats[teamA]) {
          stats[teamA].pointsFor += resultA;
          stats[teamA].pointsAgainst += resultB;
        }
        if (stats[teamB]) {
          stats[teamB].pointsFor += resultB;
          stats[teamB].pointsAgainst += resultA;
        }

        if (resultA > resultB) {
          if (stats[teamA]) stats[teamA].wins++;
          if (stats[teamB]) stats[teamB].losses++;
        } else if (resultB > resultA) {
          if (stats[teamB]) stats[teamB].wins++;
          if (stats[teamA]) stats[teamA].losses++;
        }
      }
    });
    
    for (const teamName in stats) {
        stats[teamName].pointDifferential = stats[teamName].pointsFor - stats[teamName].pointsAgainst;
    }

    const standings = teams
        .map(team => ({ teamName: team.name, ...stats[team.name], teamData: team }))
        .sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.pointDifferential - a.pointDifferential;
        });

    return { standings };
  }, [teams, schedule]);


  const { playoffBracket, areAllGamesPlayed } = useMemo(() => {
        if (gameFormat !== 'pool-play-bracket' || standings.length < 4 || schedule.length === 0) {
            return { playoffBracket: null, areAllGamesPlayed: false };
        }
        
        const poolPlayGames = schedule.filter(m => !m.id.startsWith('playoff-'));
        const allPlayed = poolPlayGames.every(match => match.resultA !== null && match.resultB !== null);

        if (!allPlayed) {
            return { playoffBracket: null, areAllGamesPlayed: false };
        }

        const top4 = standings.slice(0, 4);
        if (top4.length < 4) {
            return { playoffBracket: null, areAllGamesPlayed: allPlayed };
        }
        
        const existingSemiFinal1 = schedule.find(m => m.id === 'playoff-semi-1');
        const semiFinal1: Match = {
            id: 'playoff-semi-1',
            teamA: existingSemiFinal1?.teamA && existingSemiFinal1.teamA !== 'TBD' ? existingSemiFinal1.teamA : top4[0].teamName,
            teamB: existingSemiFinal1?.teamB && existingSemiFinal1.teamB !== 'TBD' ? existingSemiFinal1.teamB : top4[3].teamName,
            court: 'Playoff Semi 1',
            time: 'Playoffs',
            resultA: existingSemiFinal1?.resultA ?? null,
            resultB: existingSemiFinal1?.resultB ?? null,
        };

        const existingSemiFinal2 = schedule.find(m => m.id === 'playoff-semi-2');
        const semiFinal2: Match = {
            id: 'playoff-semi-2',
            teamA: existingSemiFinal2?.teamA && existingSemiFinal2.teamA !== 'TBD' ? existingSemiFinal2.teamA : top4[1].teamName,
            teamB: existingSemiFinal2?.teamB && existingSemiFinal2.teamB !== 'TBD' ? existingSemiFinal2.teamB : top4[2].teamName,
            court: 'Playoff Semi 2',
            time: 'Playoffs',
            resultA: existingSemiFinal2?.resultA ?? null,
            resultB: existingSemiFinal2?.resultB ?? null,
        };

        let championshipMatch: Match | null = null;
        const semi1Played = semiFinal1.resultA !== null && semiFinal1.resultB !== null;
        const semi2Played = semiFinal2.resultA !== null && semiFinal2.resultB !== null;

        if (semi1Played && semi2Played) {
            const winner1 = semiFinal1.resultA! > semiFinal1.resultB! ? semiFinal1.teamA : semiFinal1.teamB;
            const winner2 = semiFinal2.resultA! > semiFinal2.resultB! ? semiFinal2.teamA : semiFinal2.teamB;
            
            const existingFinal = schedule.find(m => m.id === 'playoff-final');
            championshipMatch = {
                id: 'playoff-final',
                teamA: winner1,
                teamB: winner2,
                court: 'Championship',
                time: 'Playoffs',
                resultA: existingFinal?.resultA ?? null,
                resultB: existingFinal?.resultB ?? null,
            };
        }

        return { 
            playoffBracket: {
                semiFinals: [semiFinal1, semiFinal2],
                championship: championshipMatch,
            },
            areAllGamesPlayed: allPlayed 
        };
    }, [gameFormat, standings, schedule]);


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
                        {timeOptions.map(time => (
                           <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                        ))}
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

      {schedule.length > 0 && !playoffBracket && (
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Match Schedule & Results</CardTitle>
                    <CardDescription>Enter results as games are completed. Scores auto-save when you click away.</CardDescription>
                </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={handleSaveAllResults} variant="secondary" className="w-full sm:w-auto" disabled={isPublishing}>
                        <Save className="mr-2 h-4 w-4" />
                        {isPublishing ? 'Saving...' : 'Save All Results'}
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
                                            onBlur={() => handleScoreBlur(match.id)}
                                            aria-label={`${match.teamA} score`}
                                          />
                                          <span>-</span>
                                          <input
                                            type="number"
                                            className="h-8 w-12 p-1 text-center border rounded-md"
                                            value={match.resultB ?? ''}
                                            onChange={(e) => handleResultChange(match.id, 'B', e.target.value)}
                                            onBlur={() => handleScoreBlur(match.id)}
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

      {playoffBracket && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Trophy className="h-6 w-6 text-primary" />Playoff Bracket</CardTitle>
                <CardDescription>Pool play is complete. Enter scores for the playoff games below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {playoffBracket.semiFinals.map((match) => (
                    <div key={match.id}>
                        <h4 className="font-bold mb-2">{match.court}</h4>
                        <div className="text-base rounded-lg border bg-background overflow-hidden">
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full p-2">
                              <div className="font-medium text-left">
                                  {match.teamA} <Badge variant="outline">#{standings.findIndex(s => s.teamName === match.teamA) + 1}</Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                 <input
                                    type="number"
                                    className="h-8 w-12 p-1 text-center border rounded-md"
                                    value={match.resultA ?? ''}
                                    onChange={(e) => handleResultChange(match.id, 'A', e.target.value)}
                                    onBlur={() => handleScoreBlur(match.id)}
                                    aria-label={`${match.teamA} score`}
                                  />
                                  <span>-</span>
                                  <input
                                    type="number"
                                    className="h-8 w-12 p-1 text-center border rounded-md"
                                    value={match.resultB ?? ''}
                                    onChange={(e) => handleResultChange(match.id, 'B', e.target.value)}
                                    onBlur={() => handleScoreBlur(match.id)}
                                    aria-label={`${match.teamB} score`}
                                  />
                              </div>
                              <div className="font-medium text-right">
                                  <Badge variant="outline">#{standings.findIndex(s => s.teamName === match.teamB) + 1}</Badge> {match.teamB}
                              </div>
                          </div>
                        </div>
                    </div>
                ))}
                
                {playoffBracket.championship && (
                    <div>
                        <h4 className="font-bold mb-2">{playoffBracket.championship.court}</h4>
                         <div className="text-base rounded-lg border-2 border-primary bg-primary/10 overflow-hidden">
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full p-2">
                              <div className="font-medium text-left">
                                  {playoffBracket.championship.teamA}
                              </div>
                              <div className="flex items-center gap-1">
                                 <input
                                    type="number"
                                    className="h-8 w-12 p-1 text-center border rounded-md"
                                    value={playoffBracket.championship.resultA ?? ''}
                                    onChange={(e) => handleResultChange(playoffBracket.championship!.id, 'A', e.target.value)}
                                    onBlur={() => handleScoreBlur(playoffBracket.championship!.id)}
                                    aria-label={`${playoffBracket.championship.teamA} score`}
                                  />
                                  <span>-</span>
                                  <input
                                    type="number"
                                    className="h-8 w-12 p-1 text-center border rounded-md"
                                    value={playoffBracket.championship.resultB ?? ''}
                                    onChange={(e) => handleResultChange(playoffBracket.championship!.id, 'B', e.target.value)}
                                    onBlur={() => handleScoreBlur(playoffBracket.championship!.id)}
                                    aria-label={`${playoffBracket.championship.teamB} score`}
                                  />
                              </div>
                              <div className="font-medium text-right">
                                  {playoffBracket.championship.teamB}
                              </div>
                          </div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="border-t pt-4">
                 <Button onClick={handleSaveAllResults} disabled={isPublishing}>
                    <Save className="mr-2 h-4 w-4" />
                    {isPublishing ? 'Publishing...' : 'Publish Playoff Results'}
                </Button>
            </CardFooter>
         </Card>
      )}

      {schedule.length > 0 && !isKOTC && (
        <GameMatrix teams={teams} schedule={schedule} />
      )}
    </div>
  );
}


