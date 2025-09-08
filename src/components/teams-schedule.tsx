
'use client';

import type { Player, Team, Match, GameFormat } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Swords, Save, Users, BarChart2, TrendingUp, CalendarDays, Send, Crown, Trophy, BookOpen, Gem } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import React, { useMemo, useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { publishData } from '@/app/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
  const [isPublishing, setIsPublishing] = useState(false);
  const [gameFormat, setGameFormat] = useState<GameFormat>('round-robin');

  const presentPlayers = useMemo(() => players.filter((p) => p.present), [players]);
  const possibleTeamsCount = Math.floor(presentPlayers.length / teamSize);

  const createBalancedTeams = (players: Player[], numTeams: number): Team[] => {
    // Start with a shuffled list of players to ensure randomness from the start
    let availablePlayers = shuffleArray(players);
    const shuffledNames = shuffleArray(teamNames);

    const newTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
        name: shuffledNames[i % shuffledNames.length],
        players: [],
    }));

    // Sort players by skill to ensure top players are distributed
    availablePlayers.sort((a, b) => b.skill - a.skill);

    // Distribute the highest-skilled players first, one to each team
    for (let i = 0; i < numTeams; i++) {
        if (availablePlayers.length > 0) {
            newTeams[i].players.push(availablePlayers.shift()!);
        }
    }
    
    // Shuffle remaining players to add more randomness before distributing the rest
    availablePlayers = shuffleArray(availablePlayers);

    // Distribute the rest of the players, trying to balance team size
    let teamIndex = 0;
    while (availablePlayers.length > 0) {
        newTeams[teamIndex % numTeams].players.push(availablePlayers.shift()!);
        teamIndex++;
    }

    // A final balancing pass: Look for highly imbalanced teams and swap players
    // This is a simple heuristic: if a team's average skill is way off the global average, try a swap.
    const globalAvgSkill = players.reduce((sum, p) => sum + p.skill, 0) / players.length;

    for (let i = 0; i < 5; i++) { // Run the balancing pass a few times
        const teamAvgSkills = newTeams.map(t => t.players.reduce((sum, p) => sum + p.skill, 0) / t.players.length);
        
        const strongestTeamIndex = teamAvgSkills.indexOf(Math.max(...teamAvgSkills));
        const weakestTeamIndex = teamAvgSkills.indexOf(Math.min(...teamAvgSkills));
        
        const strongestTeam = newTeams[strongestTeamIndex];
        const weakestTeam = newTeams[weakestTeamIndex];

        // If the skill gap is significant, attempt a swap
        if (teamAvgSkills[strongestTeamIndex] > globalAvgSkill + 1 && teamAvgSkills[weakestTeamIndex] < globalAvgSkill - 1) {
            // Find a higher-skilled player on the strong team and a lower-skilled player on the weak team
            const highPlayerIndex = strongestTeam.players.findIndex(p => p.skill > teamAvgSkills[strongestTeamIndex]);
            const lowPlayerIndex = weakestTeam.players.findIndex(p => p.skill < teamAvgSkills[weakestTeamIndex]);

            if (highPlayerIndex !== -1 && lowPlayerIndex !== -1) {
                 const highPlayer = strongestTeam.players[highPlayerIndex];
                 const lowPlayer = weakestTeam.players[lowPlayerIndex];
                
                // Calculate new average skills if swapped
                const newStrongAvg = (teamAvgSkills[strongestTeamIndex] * strongestTeam.players.length - highPlayer.skill + lowPlayer.skill) / strongestTeam.players.length;
                const newWeakAvg = (teamAvgSkills[weakestTeamIndex] * weakestTeam.players.length - lowPlayer.skill + highPlayer.skill) / weakestTeam.players.length;

                // Check if the swap would make the average skills closer to each other
                if (Math.abs(newStrongAvg - newWeakAvg) < Math.abs(teamAvgSkills[strongestTeamIndex] - teamAvgSkills[weakestTeamIndex])) {
                    [strongestTeam.players[highPlayerIndex], weakestTeam.players[lowPlayerIndex]] = [weakestTeam.players[lowPlayerIndex], strongestTeam.players[highPlayerIndex]];
                }
            }
        }
    }

    return newTeams;
  }

  const handleGenerateTeams = () => {
    if (presentPlayers.length < teamSize) {
      toast({
        title: 'Not enough players',
        description: `You need at least ${teamSize} present players to generate teams.`,
        variant: 'destructive',
      });
      return;
    }

    const numTeams = Math.floor(presentPlayers.length / teamSize);
    if (numTeams < 2) {
       toast({
        title: 'Not enough players',
        description: `Not enough players to form at least 2 teams of size ${teamSize}.`,
        variant: 'destructive',
      });
      return;
    }
    
    setTeams([]);
    setSchedule([]);
    
    const newTeams = createBalancedTeams(presentPlayers, numTeams);
    setTeams(newTeams);

    toast({
      title: 'Teams Generated!',
      description: `${newTeams.length} teams have been created.`,
    });
  };

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

  const generateKOTCSchedule = (teamNames: string[]): Match[] => {
    if (teamNames.length < 2) return [];

    let waitingTeams = [...teamNames];
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
    
    // The rest of the teams are in the challenger line
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
    if (teams.length < 2) {
      toast({
        title: 'Not enough teams',
        description: 'Please generate teams before creating a schedule.',
        variant: 'destructive',
      });
      return;
    }

    const teamNamesForSchedule = teams.map(t => t.name);
    let newSchedule: Match[] = [];

    switch(gameFormat) {
        case 'pool-play-bracket':
        case 'round-robin':
            newSchedule = generateRoundRobinSchedule(teamNamesForSchedule);
            break;
        case 'king-of-the-court':
        case 'monarch-of-the-court':
            newSchedule = generateKOTCSchedule(teamNamesForSchedule);
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
      description: `${newSchedule.length} matches have been created for the ${gameFormat} format.`,
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
  };

  const handlePublish = async () => {
    if (teams.length === 0) {
      toast({
        title: 'No Teams Generated',
        description: 'Please generate teams before publishing.',
        variant: 'destructive',
      });
      return;
    }
    setIsPublishing(true);
    const result = await publishData(teams, gameFormat);
    setIsPublishing(false);

    if (result.success) {
      toast({
        title: 'Data Published!',
        description: (
          <span>
            Players can now view teams and format at{' '}
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
  
  const getTeamAnalysis = (team: Team) => {
    const avgSkill = team.players.length > 0 ? (team.players.reduce((sum, p) => sum + p.skill, 0) / team.players.length).toFixed(1) : '0';
    const guyCount = team.players.filter(p => p.gender === 'Guy').length;
    const galCount = team.players.filter(p => p.gender === 'Gal').length;
    return { avgSkill, guyCount, galCount };
  }
  
  const isKOTC = gameFormat === 'king-of-the-court' || gameFormat === 'monarch-of-the-court';

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
                    <Label>Game Format</Label>
                    <Select value={gameFormat} onValueChange={(val: GameFormat) => setGameFormat(val)}>
                      <SelectTrigger className="w-full sm:w-[240px]">
                        <SelectValue placeholder="Select a format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round-robin"><BookOpen className="inline-block h-4 w-4 mr-2" /> Round Robin</SelectItem>
                        <SelectItem value="pool-play-bracket"><Trophy className="inline-block h-4 w-4 mr-2" /> Pool Play / Bracket</SelectItem>
                        <SelectItem value="king-of-the-court"><Crown className="inline-block h-4 w-4 mr-2" /> King of the Court</SelectItem>
                        <SelectItem value="monarch-of-the-court"><Gem className="inline-block h-4 w-4 mr-2" /> Monarch of the Court</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
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
                <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                  <Button onClick={handleGenerateTeams}>
                      <Swords className="mr-2 h-4 w-4" />
                      Generate Teams
                  </Button>
                  <Button onClick={handleGenerateSchedule} variant="outline" disabled={teams.length === 0}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Generate Schedule
                  </Button>
                </div>
            </div>
        </CardContent>
      </Card>
      
      {teams.length > 0 && (
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Tonight's Teams</CardTitle>
                  <CardDescription>Analysis of the generated teams.</CardDescription>
                </div>
                <Button onClick={handlePublish} disabled={isPublishing || teams.length === 0}>
                    <Send className="mr-2 h-4 w-4" />
                    {isPublishing ? 'Publishing...' : 'Publish to Dashboard'}
                </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => {
              const { avgSkill, guyCount, galCount } = getTeamAnalysis(team);
              return (
              <Card key={team.name} className="flex flex-col">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow p-4 pt-0">
                  <div className="space-y-3">
                    {[...team.players]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(player => (
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
