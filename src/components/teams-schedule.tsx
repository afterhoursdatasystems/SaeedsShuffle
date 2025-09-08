'use client';

import type { Player, Team, Match } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Swords, Save, Users, BarChart2, TrendingUp, CalendarDays, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import React, { useMemo, useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { publishTeams } from '@/app/actions';

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

  const presentPlayers = useMemo(() => players.filter((p) => p.present), [players]);
  const possibleTeamsCount = Math.floor(presentPlayers.length / teamSize);

  const createBalancedTeams = (players: Player[], numTeams: number): Team[] => {
    const shuffledPlayers = shuffleArray(players);
    const shuffledNames = shuffleArray(teamNames);
    
    type TeamInternal = { name: string; players: Player[]; totalSkill: number; adjustedSkill: number; maleCount: number; femaleCount: number };

    const newTeams: TeamInternal[] = Array.from({ length: numTeams }, (_, i) => ({
      name: shuffledNames[i % shuffledNames.length],
      players: [],
      totalSkill: 0,
      adjustedSkill: 0,
      maleCount: 0,
      femaleCount: 0,
    }));

    const playersWithAdjusted = shuffledPlayers.map(player => ({
      ...player,
      adjustedSkill: player.gender === 'Guy' ? player.skill : player.skill - 1.2
    }));

    const males = playersWithAdjusted.filter(p => p.gender === 'Guy').sort((a,b) => b.adjustedSkill - a.adjustedSkill);
    const females = playersWithAdjusted.filter(p => p.gender === 'Gal').sort((a,b) => b.adjustedSkill - a.adjustedSkill);

    const totalPlayersToDraft = males.length + females.length;
    const baseSize = Math.floor(totalPlayersToDraft / numTeams);
    const teamsWithExtra = totalPlayersToDraft % numTeams;
    
    let maleIndex = 0;
    let femaleIndex = 0;
    const maxRounds = baseSize + (teamsWithExtra > 0 ? 1 : 0);

    for (let round = 0; round < maxRounds; round++) {
      const isReverse = round % 2 === 1;
      const order = Array.from({ length: numTeams }, (_, i) => isReverse ? numTeams - 1 - i : i);
      
      for (const teamIndex of order) {
        const team = newTeams[teamIndex];
        const targetSize = teamIndex < teamsWithExtra ? baseSize + 1 : baseSize;
        
        if (team.players.length >= targetSize) continue;

        let candidates = [];
        if (maleIndex < males.length) candidates.push(males[maleIndex]);
        if (femaleIndex < females.length) candidates.push(females[femaleIndex]);

        if (candidates.length === 0) break;

        const lowSkillCount = team.players.filter(p => p.skill <= 3).length;
        let preferredCandidates = candidates;
        if (lowSkillCount >= 1) {
            const nonLowSkill = candidates.filter(p => p.skill > 3);
            if (nonLowSkill.length > 0) {
                preferredCandidates = nonLowSkill;
            }
        }
        
        let playerToDraft;
        const genderDiff = team.maleCount - team.femaleCount;
        
        const wantsFemale = genderDiff >= 1;
        const wantsMale = genderDiff <= -1;

        const femaleCandidate = preferredCandidates.find(p => p.gender === 'Gal');
        const maleCandidate = preferredCandidates.find(p => p.gender === 'Guy');
        
        if (wantsFemale && femaleCandidate) {
            playerToDraft = femaleCandidate;
        } else if (wantsMale && maleCandidate) {
            playerToDraft = maleCandidate;
        } else {
            preferredCandidates.sort((a,b) => b.adjustedSkill - a.adjustedSkill);
            playerToDraft = preferredCandidates[0];
        }
        
        if (!playerToDraft) continue;

        if (playerToDraft.gender === 'Guy') {
            maleIndex++;
            team.maleCount++;
        } else {
            femaleIndex++;
            team.femaleCount++;
        }
        
        team.players.push(playerToDraft);
        team.totalSkill += playerToDraft.skill;
        team.adjustedSkill += playerToDraft.adjustedSkill;
      }
    }
     return newTeams.map(({name, players}) => ({ name, players }));
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
    const newSchedule: Match[] = [];
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
    
    toast({
      title: 'Schedule Generated!',
      description: `${newSchedule.length} matches have been created.`,
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

  const handlePublishTeams = async () => {
    if (teams.length === 0) {
      toast({
        title: 'No Teams Generated',
        description: 'Please generate teams before publishing.',
        variant: 'destructive',
      });
      return;
    }
    setIsPublishing(true);
    const result = await publishTeams(teams);
    setIsPublishing(false);

    if (result.success) {
      toast({
        title: 'Teams Published!',
        description: (
          <span>
            Players can now view their teams at{' '}
            <a href="/" target="_blank" className="underline font-bold">
              the public dashboard
            </a>.
          </span>
        ),
      });
    } else {
      toast({
        title: 'Error Publishing Teams',
        description: result.error,
        variant: 'destructive',
      });
    }
  };
  
  const getTeamAnalysis = (team: Team) => {
    const totalSkill = team.players.reduce((sum, p) => sum + p.skill, 0);
    const avgSkill = team.players.length > 0 ? (totalSkill / team.players.length).toFixed(1) : '0';
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
                <Button onClick={handlePublishTeams} disabled={isPublishing || teams.length === 0}>
                    <Send className="mr-2 h-4 w-4" />
                    {isPublishing ? 'Publishing...' : 'Publish Teams'}
                </Button>
            </div>
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
