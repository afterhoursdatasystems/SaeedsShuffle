
'use client';

import type { Player, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, Users, Send, Shuffle, Info } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import React, { useMemo, useState } from 'react';
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


export function TeamGenerator() {
  const { 
    players, 
    teams, 
    setTeams, 
    schedule,
    setSchedule,
    gameFormat, 
  } = usePlayerContext();
  const { toast } = useToast();
  const [teamSize, setTeamSize] = useState<number>(4);
  const [isPublishing, setIsPublishing] = useState(false);

  const presentPlayers = useMemo(() => players.filter((p) => p.present), [players]);
  const possibleTeamsCount = Math.floor(presentPlayers.length / teamSize);
  
  const createBalancedTeams = (allPlayers: Player[], numTeams: number): Team[] => {
    const shuffledNames = shuffleArray(teamNames);
    const newTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
      name: shuffledNames[i % shuffledNames.length],
      players: [],
    }));

    const playersWithAdjustedSkill = allPlayers.map(p => ({
        ...p,
        adjustedSkill: p.gender === 'Gal' ? p.skill - 1 : p.skill,
    }));

    const buckets: { [key: string]: Player[] } = {
      '8-10': playersWithAdjustedSkill.filter(p => p.adjustedSkill >= 8 && p.adjustedSkill <= 10),
      '6-7': playersWithAdjustedSkill.filter(p => p.adjustedSkill >= 6 && p.adjustedSkill <= 7),
      '4-5': playersWithAdjustedSkill.filter(p => p.adjustedSkill >= 4 && p.adjustedSkill <= 5),
      '1-3': playersWithAdjustedSkill.filter(p => p.adjustedSkill <= 3),
    };

    for (const key in buckets) {
      buckets[key] = shuffleArray(buckets[key]);
    }
    
    const playersToDraft = [
      ...buckets['8-10'],
      ...buckets['6-7'],
      ...buckets['4-5'],
      ...buckets['1-3'],
    ];

    let teamIndex = 0;
    let direction = 1; 
    
    playersToDraft.forEach(player => {
        const originalPlayer = allPlayers.find(p => p.id === player.id)!;
        newTeams[teamIndex].players.push(originalPlayer);
        
        teamIndex += direction;
        if (teamIndex >= numTeams || teamIndex < 0) {
            direction *= -1;
            teamIndex += direction;
        }
    });

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
    const result = await publishData(teams, gameFormat, schedule);
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

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const sourceTeamName = source.droppableId;
    const destTeamName = destination.droppableId;
    const sourcePlayerId = result.draggableId;

    if (sourceTeamName === destTeamName) {
        return; 
    }

    setTeams(currentTeams => {
        const newTeams = JSON.parse(JSON.stringify(currentTeams));

        const sourceTeam = newTeams.find((t: Team) => t.name === sourceTeamName);
        const destTeam = newTeams.find((t: Team) => t.name === destTeamName);

        if (!sourceTeam || !destTeam) return currentTeams;
        
        const sourcePlayerIndex = sourceTeam.players.findIndex((p: Player) => p.id === sourcePlayerId);
        if (sourcePlayerIndex === -1) return currentTeams;

        const [movedPlayer] = sourceTeam.players.splice(sourcePlayerIndex, 1);
        const destPlayerId = result.destination?.draggableId;
        const destPlayerIndex = destTeam.players.findIndex((p: Player) => p.id === destPlayerId);

        if(destPlayerIndex > -1) {
             const [swappedPlayer] = destTeam.players.splice(destPlayerIndex, 1);
             sourceTeam.players.splice(sourcePlayerIndex, 0, swappedPlayer);
             destTeam.players.splice(destination.index, 0, movedPlayer);
             toast({
                title: "Players Swapped",
                description: `${movedPlayer.name} and ${swappedPlayer.name} have been swapped.`
            })
        } else {
            destTeam.players.splice(destination.index, 0, movedPlayer);
            toast({
                title: "Player Moved",
                description: `${movedPlayer.name} has been moved to ${destTeam.name}.`
            })
        }

        return newTeams;
    });
  };
  
  const isBlindDraw = gameFormat === 'blind-draw';

  return (
    <DragDropContext onDragEnd={onDragEnd}>
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Team Generation Settings</CardTitle>
          <CardDescription>Configure the settings to generate balanced teams for the night.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {isBlindDraw ? (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Blind Draw Format</AlertTitle>
                    <AlertDescription>
                        Team generation is disabled for the "Blind Draw" format. Teams will be randomly created for each round on the Schedule page.
                    </AlertDescription>
                </Alert>
            ) : (
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
                          <Shuffle className="mr-2 h-4 w-4" />
                          Generate Teams
                      </Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
      
      {teams.length > 0 && !isBlindDraw && (
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Tonight's Teams</CardTitle>
                  <CardDescription>Drag and drop players between teams to swap or move them.</CardDescription>
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
              <Droppable droppableId={team.name} key={team.name} isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                {(provided) => (
                  <Card 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-col"
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-4 pt-0">
                      <div className="space-y-3">
                        {[...team.players]
                          .sort((a, b) => a.name.localeCompare(b.name))
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
                        </div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Gender: <span className="font-bold text-foreground">{guyCount} Guys, {galCount} Gals</span></div>
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
