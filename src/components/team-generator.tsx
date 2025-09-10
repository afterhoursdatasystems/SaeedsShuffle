

'use client';

import type { Player, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, Shuffle, Info, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import React, { useEffect, useMemo, useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { publishData } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { usePlayerContext } from '@/contexts/player-context';


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
    activeRule,
    pointsToWin
  } = usePlayerContext();
  const { toast } = useToast();
  const [teamSize, setTeamSize] = useState<number>(4);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const presentPlayers = useMemo(() => players.filter((p) => p.present), [players]);
  const possibleTeamsCount = presentPlayers.length > 0 ? Math.floor(presentPlayers.length / teamSize) : 0;
  
  const { presentGuys, presentGals, overallGuyPercentage } = useMemo(() => {
    const presentGuys = presentPlayers.filter(p => p.gender === 'Guy').length;
    const presentGals = presentPlayers.filter(p => p.gender === 'Gal').length;
    const overallGuyPercentage = presentPlayers.length > 0 ? Math.round((presentGuys / presentPlayers.length) * 100) : 0;
    return { presentGuys, presentGals, overallGuyPercentage };
  }, [presentPlayers]);


 const createBalancedTeams = (allPlayers: Player[], baseTeamSize: number): Team[] => {
    if (allPlayers.length < baseTeamSize) return [];

    const numTeams = Math.floor(allPlayers.length / baseTeamSize);

    const getSkillBucket = (skill: number) => {
      if (skill <= 4) return '1-4';
      if (skill <= 6) return '5-6';
      if (skill <= 8) return '7-8';
      return '9-10';
    };

    type SkillBucket = '1-4' | '5-6' | '7-8' | '9-10';
    const guyBuckets: Record<SkillBucket, Player[]> = { '1-4': [], '5-6': [], '7-8': [], '9-10': [] };
    const galBuckets: Record<SkillBucket, Player[]> = { '1-4': [], '5-6': [], '7-8': [], '9-10': [] };

    for (const player of allPlayers) {
      const bucket = getSkillBucket(player.skill);
      if (player.gender === 'Guy') {
        guyBuckets[bucket].push(player);
      } else {
        galBuckets[bucket].push(player);
      }
    }

    // Shuffle within each bucket
    for (const bucket of Object.values(guyBuckets)) shuffleArray(bucket);
    for (const bucket of Object.values(galBuckets)) shuffleArray(bucket);

    const draftPlayer = (gender: 'Guy' | 'Gal'): Player | undefined => {
        const buckets = gender === 'Guy' ? guyBuckets : galBuckets;
        const bucketOrder: SkillBucket[] = ['9-10', '7-8', '5-6', '1-4'];
        for (const bucketName of bucketOrder) {
            if(buckets[bucketName].length > 0) {
                return buckets[bucketName].shift();
            }
        }
        return undefined;
    };
    
    // --- Start of Gender Distribution Logic ---
    const totalGuys = allPlayers.filter(p => p.gender === 'Guy').length;
    const totalGals = allPlayers.filter(p => p.gender === 'Gal').length;

    const guyRatio = totalGuys / allPlayers.length;

    const teamBlueprints = Array.from({ length: numTeams }, () => ({ guys: 0, gals: 0 }));

    for (let i = 0; i < baseTeamSize * numTeams; i++) {
        const teamIndex = i % numTeams;
        const currentTeamSize = teamBlueprints[teamIndex].guys + teamBlueprints[teamIndex].gals;
        const currentGuyRatio = teamBlueprints[teamIndex].guys / (currentTeamSize || 1);

        if (currentGuyRatio < guyRatio) {
            if (totalGuys - teamBlueprints.reduce((acc, t) => acc + t.guys, 0) > 0) {
                 teamBlueprints[teamIndex].guys++;
            } else {
                 teamBlueprints[teamIndex].gals++;
            }
        } else {
             if (totalGals - teamBlueprints.reduce((acc, t) => acc + t.gals, 0) > 0) {
                teamBlueprints[teamIndex].gals++;
            } else {
                teamBlueprints[teamIndex].guys++;
            }
        }
    }
    // --- End of Gender Distribution Logic ---
    
    const shuffledNames = shuffleArray(teamNames);
    const newTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
        name: shuffledNames[i % shuffledNames.length],
        players: [],
    }));
    
    // Draft players based on blueprints
    const snakeDraftOrder = (round: number) => (round % 2 === 0) ? Array.from({ length: numTeams }, (_, i) => i) : Array.from({ length: numTeams }, (_, i) => numTeams - 1 - i);

    for (let i = 0; i < numTeams; i++) {
      const blueprint = teamBlueprints[i];
      for(let j = 0; j < blueprint.guys; j++) {
        const player = draftPlayer('Guy');
        if (player) newTeams[i].players.push(player);
      }
      for(let j = 0; j < blueprint.gals; j++) {
         const player = draftPlayer('Gal');
        if (player) newTeams[i].players.push(player);
      }
    }
    
    // Distribute all remaining players (leftovers from buckets + extras from uneven total)
    const remainingPlayers = [...guyBuckets['9-10'], ...guyBuckets['7-8'], ...guyBuckets['5-6'], ...guyBuckets['1-4'], ...galBuckets['9-10'], ...galBuckets['7-8'], ...galBuckets['5-6'], ...galBuckets['1-4']];

    let teamIndex = 0;
    while(remainingPlayers.length > 0) {
      const player = remainingPlayers.shift();
      if(player) {
         // Sort teams by current size to add players to the smallest teams first
        newTeams.sort((a,b) => a.players.length - b.players.length);
        newTeams[0].players.push(player);
      }
    }
  
    newTeams.forEach(team => team.players.sort((a,b) => b.skill - a.skill));

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
    const result = await publishData(teams, gameFormat, schedule, activeRule, pointsToWin);
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

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    const sourceTeamName = source.droppableId;
    const destTeamName = destination.droppableId;

    if(sourceTeamName === destTeamName && source.index === destination.index) {
        return;
    }

    const newTeams = JSON.parse(JSON.stringify(teams)) as Team[];
    let sourceTeam = newTeams.find((t: Team) => t.name === sourceTeamName);
    let destTeam = newTeams.find((t: Team) => t.name === destTeamName);
    
    if (!sourceTeam) return;

    const playerIndex = sourceTeam.players.findIndex((p: Player) => p.id === draggableId);
    if(playerIndex === -1) return;

    const [movedPlayer] = sourceTeam.players.splice(playerIndex, 1);

    if(sourceTeamName === destTeamName) {
        sourceTeam.players.splice(destination.index, 0, movedPlayer);
    } else {
        if(!destTeam) return;
        destTeam.players.splice(destination.index, 0, movedPlayer);
    }
    
    setTeams(newTeams);

    toast({
        title: "Player Moved",
        description: `${movedPlayer.name} has been moved.`,
    });
  };
  
  const isBlindDraw = gameFormat === 'blind-draw';

  if (!isClient) {
    return null; 
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
                            <p className="text-sm font-medium text-muted-foreground">Gender Breakdown</p>
                            <p className="text-2xl font-bold">
                                <span className="text-blue-500">{presentGuys}G</span>
                                <span className="mx-1 text-muted-foreground">/</span>
                                <span className="text-pink-500">{presentGals}L</span>
                                <span className="ml-2 text-base font-normal">({overallGuyPercentage}% guys)</span>
                            </p>
                        </div>
                        <Separator orientation='vertical' className='hidden sm:block h-12' />
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
                <div className="flex gap-2">
                    <Button onClick={handleGenerateTeams}>
                        <Shuffle className="mr-2 h-4 w-4" />
                        Generate New Teams
                    </Button>
                    <Button onClick={handleClearTeams} variant="outline">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Teams
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>
      
      {teams.length > 0 && !isBlindDraw && (
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Tonight's Teams</CardTitle>
                  <CardDescription>Drag and drop players between teams to swap or move them.</CardDescription>
                </div>
                 <Button onClick={handlePublish} disabled={isPublishing}>
                    <Send className="mr-2 h-4 w-4" />
                    {isPublishing ? 'Publishing...' : 'Publish to Dashboard'}
                </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => {
              const { avgSkill, guyCount, galCount, guyPercentage } = getTeamAnalysis(team);
              return (
              <Droppable droppableId={team.name} key={team.name} isCombineEnabled={false}>
                {(provided, snapshot) => (
                  <Card 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex flex-col",
                      snapshot.isDraggingOver && "bg-primary/10"
                    )}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-4 pt-0">
                      <div className="space-y-3 min-h-[100px]">
                        {[...team.players]
                          .sort((a, b) => b.skill - a.skill)
                          .map((player, index) => (
                            <Draggable key={player.id} draggableId={player.id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-md cursor-grab",
                                            snapshot.isDragging ? 'bg-primary/20 shadow-lg' : 'bg-transparent'
                                        )}
                                    >
                                        <Avatar className="h-8 w-8 border-2 border-white">
                                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                                {player.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{player.name}</span>
                                        <Badge variant="outline" className="ml-auto">{player.skill}</Badge>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 border-t bg-muted/50 p-4 text-sm text-muted-foreground">
                        <div className="flex w-full justify-between">
                           <div className='flex items-center gap-2'>Avg Skill: <span className="font-bold text-foreground">{avgSkill}</span></div>
                           <div className="flex items-center gap-2">Guy %: <span className="font-bold text-foreground">{guyPercentage}%</span></div>
                        </div>
                        <div className="flex w-full justify-between">
                            <div className='flex items-center gap-2'>Gender: 
                                <span className="font-bold text-blue-500">{guyCount}</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="font-bold text-pink-500">{galCount}</span>
                            </div>
                        </div>
                    </CardFooter>
                  </Card>
                )}
              </Droppable>
            )})}
          </CardContent>
        </Card>
      )}
    </div>
    </DragDropContext>
  );
}
