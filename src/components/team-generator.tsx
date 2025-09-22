

'use client';

import type { Player, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, Shuffle, Info, Trash2, Users, MoreVertical, PlusCircle, MinusCircle, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import React, { useEffect, useMemo, useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { publishData } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePlayerContext } from '@/contexts/player-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';


const teamNames = [
  'Birkdale Bombers', 'Cool Fish Commandos', 'Jetton Juggernauts',
  'Peninsula Powerhouse', 'Soda Shop Slammers',
  'Langtree Lightning', 'Bailey Bruisers', 'Antiquity Attackers',
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

const getTeamAnalysis = (team: Team) => {
    const totalRawSkill = team.players.reduce((sum, p) => sum + p.skill, 0);
    
    const avgSkill = team.players.length > 0 ? (totalRawSkill / team.players.length).toFixed(1) : '0';
    const guyCount = team.players.filter(p => p.gender === 'Guy').length;
    const galCount = team.players.filter(p => p.gender === 'Gal').length;
    const guyPercentage = team.players.length > 0 ? Math.round((guyCount / team.players.length) * 100) : 0;
    return { avgSkill, guyCount, galCount, guyPercentage };
};


export function TeamGenerator() {
  const { 
    players, 
    teams, 
    setTeams, 
    schedule,
    setSchedule,
    gameFormat,
    gameVariant,
    activeRule,
    pointsToWin,
    updateTeam,
  } = usePlayerContext();
  const { toast } = useToast();
  const [teamSize, setTeamSize] = useState<number>(4);
  const [isPublishing, setIsPublishing] = useState(false);

  const presentPlayers = useMemo(() => players.filter((p) => p.present), [players]);
  const possibleTeamsCount = presentPlayers.length > 0 ? Math.floor(presentPlayers.length / teamSize) : 0;
  
  const { presentPlayersCount, totalPlayersCount, presentGuys, presentGals, overallGuyPercentage, unassignedPlayers } = useMemo(() => {
    const presentPlayers = players.filter(p => p.present);
    const assignedPlayerIds = new Set(teams.flatMap(t => t.players.map(p => p.id)));
    const unassignedPlayers = presentPlayers.filter(p => !assignedPlayerIds.has(p.id));
    const presentPlayersCount = presentPlayers.length;
    const totalPlayersCount = players.length;
    const presentGuys = presentPlayers.filter(p => p.gender === 'Guy').length;
    const presentGals = presentPlayers.filter(p => p.gender === 'Gal').length;
    const overallGuyPercentage = presentPlayers.length > 0 ? Math.round((presentGuys / presentPlayers.length) * 100) : 0;
    return { presentPlayersCount, totalPlayersCount, presentGuys, presentGals, overallGuyPercentage, unassignedPlayers };
  }, [players, teams]);

 const createBalancedTeams = (allPlayers: Player[], baseTeamSize: number): Team[] => {
    const numTeams = Math.floor(allPlayers.length / baseTeamSize);
    if (numTeams === 0) {
        return [];
    }
    
    const shuffledTeamNames = shuffleArray(teamNames);

    const buckets: {
        guys: Record<string, Player[]>,
        gals: Record<string, Player[]>
    } = {
        guys: { '9-10': [], '7-8': [], '5-6': [], '4-5': [], '1-3': [] },
        gals: { '9-10': [], '7-8': [], '5-6': [], '4-5': [], '1-3': [] },
    };

    for (const player of allPlayers) {
        const genderKey = player.gender === 'Guy' ? 'guys' : 'gals';
        let bucketKey: string;
        if (player.skill >= 9) bucketKey = '9-10';
        else if (player.skill >= 7) bucketKey = '7-8';
        else if (player.skill >= 5) bucketKey = '5-6';
        else if (player.skill >= 4) bucketKey = '4-5';
        else bucketKey = '1-3';
        buckets[genderKey][bucketKey].push(player);
    }
    
    for (const gender of ['guys', 'gals'] as const) {
        for (const skillRange of Object.keys(buckets[gender])) {
            buckets[gender][skillRange] = shuffleArray(buckets[gender][skillRange]);
        }
    }

    const draftPlayer = (gender: 'guys' | 'gals'): Player | undefined => {
        const order = ['9-10', '7-8', '5-6', '4-5', '1-3'];
        for (const bucketKey of order) {
            if (buckets[gender][bucketKey].length > 0) {
                return buckets[gender][bucketKey].shift();
            }
        }
        return undefined;
    };
    
    const newTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
        id: crypto.randomUUID(),
        name: shuffledTeamNames[i % shuffledTeamNames.length],
        players: [],
        level: 1, // Start all teams at level 1
    }));

    const totalPlayers = allPlayers.length;
    const leagueGuyRatio = allPlayers.filter(p => p.gender === 'Guy').length / totalPlayers;

    for (let i = 0; i < totalPlayers; i++) {
        const teamIndex = i % numTeams;
        const snakeIndex = (Math.floor(i / numTeams) % 2 === 0) ? teamIndex : numTeams - 1 - teamIndex;
        const team = newTeams[snakeIndex];

        const teamGuyCount = team.players.filter(p => p.gender === 'Guy').length;
        const teamPlayerCount = team.players.length;
        const teamGuyRatio = teamPlayerCount > 0 ? teamGuyCount / teamPlayerCount : 0;
        
        let playerToDraft: Player | undefined;

        // Determine which gender to draft
        if (teamGuyRatio < leagueGuyRatio) {
            playerToDraft = draftPlayer('guys') || draftPlayer('gals');
        } else {
            playerToDraft = draftPlayer('gals') || draftPlayer('guys');
        }
        
        if (playerToDraft) {
            team.players.push(playerToDraft);
        }
    }

    return newTeams;
};

  const handleGenerateTeams = () => {
    if (presentPlayers.length < teamSize) {
      toast({
        title: 'Not enough players',
        description: `You need at least ${teamSize} present players to generate teams.`,
        variant: 'destructive',
      });
      return;
    }
    
    setTeams([]);
    setSchedule([]);
    
    const newTeams = createBalancedTeams(presentPlayers, teamSize);
    setTeams(newTeams);

    toast({
      title: 'Teams Generated!',
      description: `${newTeams.length} teams have been created and all players are assigned.`,
    });
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
    const finalFormat = gameFormat === 'king-of-the-court' && gameVariant !== 'standard' ? gameVariant : gameFormat;
    const result = await publishData(teams, finalFormat, schedule, activeRule, pointsToWin);
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
  
    const handleClearTeams = () => {
    setTeams([]);
    setSchedule([]); // Also clear schedule when teams are cleared
    toast({
      title: 'Teams & Schedule Cleared',
      description: 'All teams have been cleared and the schedule has been reset.',
    });
  };

  const handlePlayerMove = async (playerToMove: Player, currentTeamName: string | null, newTeamName: string | null) => {
    if (currentTeamName === newTeamName) return;

    let newTeamsState: Team[] = JSON.parse(JSON.stringify(teams));

    // Remove player from old team
    if (currentTeamName) {
      const oldTeamIndex = newTeamsState.findIndex(t => t.name === currentTeamName);
      if (oldTeamIndex > -1) {
        newTeamsState[oldTeamIndex].players = newTeamsState[oldTeamIndex].players.filter(p => p.id !== playerToMove.id);
      }
    }

    // Add player to new team
    if (newTeamName) {
      const newTeamIndex = newTeamsState.findIndex(t => t.name === newTeamName);
      if (newTeamIndex > -1) {
        newTeamsState[newTeamIndex].players.push(playerToMove);
      }
    }
    
    // Optimistically update the UI
    setTeams(newTeamsState);

    // Persist the change to the server
    const finalFormat = gameFormat === 'king-of-the-court' && gameVariant !== 'standard' ? gameVariant : gameFormat;
    const result = await publishData(newTeamsState, finalFormat, schedule, activeRule, pointsToWin);

    if (result.success) {
        toast({
            title: "Player Moved",
            description: `${playerToMove.name} moved to ${newTeamName || 'Unassigned'}.`,
        });
    } else {
        toast({
            title: 'Error Saving Change',
            description: result.error || 'Could not save the new team assignment.',
            variant: 'destructive',
        });
        // Consider reverting state here if persistence fails
    }
  };

  const handleLevelChange = (teamId: string, delta: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const newLevel = Math.max(1, (team.level || 1) + delta);
    updateTeam({ ...team, level: newLevel });
  }
  
  const isBlindDraw = gameFormat === 'blind-draw';
  const isLevelUp = gameFormat === 'level-up';

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Team Generation Settings</CardTitle>
          <CardDescription>Configure the settings to generate balanced teams for the night.</CardDescription>
        </CardHeader>
        <CardContent>
            {isBlindDraw ? (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Blind Draw Format</AlertTitle>
                    <AlertDescription>
                        Team generation is disabled for the "Blind Draw" format. Teams will be randomly created for each round on the Schedule page.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between rounded-lg border p-4">
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
                        <Separator orientation='vertical' className='hidden md:block h-12' />
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                            <p className="text-2xl font-bold">{presentPlayersCount} / {totalPlayersCount} Present</p>
                        </div>
                        <Separator orientation='vertical' className='hidden md:block h-12' />
                         <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">Gender Breakdown</p>
                            <p className="text-2xl font-bold">
                                <span className="text-blue-500">{presentGuys}G</span>
                                <span className="mx-1 text-muted-foreground">/</span>
                                <span className="text-pink-500">{presentGals}L</span>
                                <span className="ml-2 text-base font-normal">({overallGuyPercentage}% guys)</span>
                            </p>
                        </div>
                        <Separator orientation='vertical' className='hidden lg:block h-12' />
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">Possible Teams</p>
                            <p className="text-2xl font-bold">{possibleTeamsCount}</p>
                        </div>
                    </div>
                </div>
            )}
        </CardContent>
        {!isBlindDraw && (
            <CardFooter className="border-t px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button onClick={handleGenerateTeams} className="w-full sm:w-auto">
                        <Shuffle className="mr-2 h-4 w-4" />
                        Generate New Teams
                    </Button>
                    <Button onClick={handleClearTeams} variant="outline" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Teams
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>
      
      {teams.length > 0 && !isBlindDraw && (
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                            <CardTitle>Tonight's Teams</CardTitle>
                            <CardDescription>Use the dropdown on each player to move them to a different team.</CardDescription>
                            </div>
                            <Button onClick={handlePublish} disabled={isPublishing} className="w-full sm:w-auto">
                                <Send className="mr-2 h-4 w-4" />
                                {isPublishing ? 'Publishing...' : 'Publish to Dashboard'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {teams.map((team) => {
                        const { avgSkill, guyCount, galCount, guyPercentage } = getTeamAnalysis(team);
                        return (
                            <Card key={team.id} className="flex flex-col">
                                <CardHeader className="p-4">
                                <CardTitle className="text-lg flex justify-between items-center">
                                    {team.name}
                                    {isLevelUp && (
                                        <Badge variant="secondary" className="text-base">
                                            <Star className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400" />
                                            Level {team.level || 1}
                                        </Badge>
                                    )}
                                </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow p-4 pt-0">
                                <div className="space-y-3 min-h-[100px]">
                                    {[...team.players]
                                    .sort((a, b) => b.skill - a.skill)
                                    .map((player) => (
                                        <div key={player.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                            <Avatar className="h-8 w-8 border-2 border-white">
                                                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                                    {player.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium flex-grow">{player.name}</span>
                                            <Badge variant="outline">{player.skill}</Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className='h-8 w-8'>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => handlePlayerMove(player, team.name, null)}>
                                                        Move to Unassigned
                                                    </DropdownMenuItem>
                                                    {teams.filter(t => t.name !== team.name).map(otherTeam => (
                                                        <DropdownMenuItem key={otherTeam.name} onSelect={() => handlePlayerMove(player, team.name, otherTeam.name)}>
                                                            Move to {otherTeam.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </div>
                                </CardContent>
                                <CardFooter className="flex-col items-start gap-2 border-t bg-muted/50 p-4 text-sm text-muted-foreground">
                                    <div className="flex w-full justify-between">
                                    <div className='flex items-center gap-2'>Avg Skill: <span className="font-bold text-foreground">{avgSkill}</span></div>
                                    <div className="flex items-center gap-2">Guy %: <span className="font-bold text-foreground">{guyPercentage}%</span></div>
                                    </div>
                                    <div className="flex w-full justify-between items-center">
                                        <div className='flex items-center gap-2'>Gender: 
                                            <span className="font-bold text-blue-500">{guyCount}G</span>
                                            <span className="text-muted-foreground">/</span>
                                            <span className="font-bold text-pink-500">{galCount}L</span>
                                        </div>
                                        {isLevelUp && (
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleLevelChange(team.id, -1)}>
                                                    <MinusCircle className="w-5 h-5 text-destructive" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleLevelChange(team.id, 1)}>
                                                    <PlusCircle className="w-5 h-5 text-green-500" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        )})}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card className="flex flex-col h-full">
                    <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" />Unassigned Players</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-4 pt-0">
                        <div className="space-y-3 min-h-[100px]">
                            {unassignedPlayers.length > 0 ? (
                                unassignedPlayers.map((player) => (
                                    <div key={player.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                        <Avatar className="h-8 w-8 border-2 border-white">
                                            <AvatarFallback className="bg-amber-200 text-amber-800 font-bold">
                                                {player.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium flex-grow">{player.name}</span>
                                        <Badge variant="outline">{player.skill}</Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className='h-8 w-8'>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {teams.map(team => (
                                                    <DropdownMenuItem key={team.id} onSelect={() => handlePlayerMove(player, null, team.name)}>
                                                        Move to {team.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground pt-10">
                                    <p>All present players are on a team.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
