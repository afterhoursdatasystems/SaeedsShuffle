

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

type PlayerWithAdjustedSkill = Player & { adjustedSkill: number };

const getTeamAnalysis = (team: Team) => {
    const totalRawSkill = team.players.reduce((sum, p) => sum + p.skill, 0);
    const totalAdjustedSkill = team.players.reduce((sum, p: any) => sum + (p.adjustedSkill || p.skill), 0);

    const avgSkill = team.players.length > 0 ? (totalRawSkill / team.players.length).toFixed(1) : '0';
    const avgAdjustedSkill = team.players.length > 0 ? (totalAdjustedSkill / team.players.length).toFixed(1) : '0';
    const guyCount = team.players.filter(p => p.gender === 'Guy').length;
    const galCount = team.players.filter(p => p.gender === 'Gal').length;
    return { avgSkill, guyCount, galCount, avgAdjustedSkill };
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
  } = usePlayerContext();
  const { toast } = useToast();
  const [teamSize, setTeamSize] = useState<number>(4);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const presentPlayers = useMemo(() => players.filter((p) => p.present), [players]);
  const possibleTeamsCount = presentPlayers.length >= teamSize ? Math.floor(presentPlayers.length / teamSize) : 0;
  
  const createBalancedTeams = (allPlayers: Player[], formatSize: number): Team[] => {
    console.clear();
    console.log('--- Starting New Draft Simulation ---');
    console.log(`Total Players: ${allPlayers.length}, Team Size: ${formatSize}v${formatSize}`);

    // 1. Player Valuation
    const valuedPlayers: PlayerWithAdjustedSkill[] = allPlayers.map(p => ({
        ...p,
        adjustedSkill: p.gender === 'Gal' ? p.skill * 0.85 : p.skill,
    }));

    // 2. Create and Shuffle Skill Buckets
    const buckets: Record<string, PlayerWithAdjustedSkill[]> = {
      'tier1': [], // 9-10
      'tier2': [], // 7-8
      'tier3': [], // 4-6
      'tier4': [], // 1-3
    };

    valuedPlayers.forEach(p => {
      if (p.skill >= 9) buckets.tier1.push(p);
      else if (p.skill >= 7) buckets.tier2.push(p);
      else if (p.skill >= 4) buckets.tier3.push(p);
      else buckets.tier4.push(p);
    });

    // Shuffle within each bucket
    Object.keys(buckets).forEach(tier => {
      buckets[tier] = shuffleArray(buckets[tier]);
    });
    
    // Combine buckets into a single draft pool, ordered by tier
    let draftPool = [...buckets.tier1, ...buckets.tier2, ...buckets.tier3, ...buckets.tier4];
    console.log('Shuffled Draft Pool (Top 5):', draftPool.slice(0,5).map(p => `${p.name} (L': ${p.adjustedSkill.toFixed(1)})`));
    
    // 3. Determine Team Structure
    const numTeams = Math.floor(allPlayers.length / formatSize);
    const baseTeamSize = Math.floor(allPlayers.length / numTeams);
    const teamsWithExtra = allPlayers.length % numTeams;
    
    console.log(`Calculated Teams: ${numTeams}, Base size: ${baseTeamSize}, Teams with extra: ${teamsWithExtra}`);


    const shuffledNames = shuffleArray(teamNames);
    const newTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
      name: shuffledNames[i % shuffledNames.length],
      players: [],
    }));

    // 4. Execute Gender-Aware Snake Draft
    let teamIndex = 0;
    let direction = 1;

    const totalGuys = draftPool.filter(p => p.gender === 'Guy').length;
    const totalGals = draftPool.filter(p => p.gender === 'Gal').length;

    while(draftPool.length > 0) {
        const team = newTeams[teamIndex];
        const targetSize = teamIndex < teamsWithExtra ? baseTeamSize + 1 : baseTeamSize;

        if (team.players.length < targetSize) {
          const guysOnTeam = team.players.filter(p => p.gender === 'Guy').length;
          const galsOnTeam = team.players.filter(p => p.gender === 'Gal').length;
          
          const idealGuysPerTeam = Math.round((totalGuys / allPlayers.length) * targetSize);
          const idealGalsPerTeam = targetSize - idealGuysPerTeam;

          let playerToDraft: PlayerWithAdjustedSkill | undefined;
          let candidateIndex = -1;

          // Prioritize needed gender
          if (galsOnTeam < idealGalsPerTeam && draftPool.some(p => p.gender === 'Gal')) {
            candidateIndex = draftPool.findIndex(p => p.gender === 'Gal');
          } else if (guysOnTeam < idealGuysPerTeam && draftPool.some(p => p.gender === 'Guy')) {
            candidateIndex = draftPool.findIndex(p => p.gender === 'Guy');
          }
          
          // If no specific gender is needed or available, or if the pool is small, take the best player
          if(candidateIndex === -1) {
            const top5 = draftPool.slice(0, 5);
            const randomIndex = Math.floor(Math.random() * Math.min(top5.length, 3));
            const randomPlayer = top5[randomIndex];
            candidateIndex = draftPool.findIndex(p => p.id === randomPlayer.id);
          }
          
          [playerToDraft] = draftPool.splice(candidateIndex, 1);

          if (playerToDraft) {
              console.log(`Drafting ${playerToDraft.name} (L': ${playerToDraft.adjustedSkill.toFixed(1)}) to Team ${newTeams[teamIndex].name}`);
              team.players.push(playerToDraft);
          }
        }

        teamIndex += direction;
        if (teamIndex < 0 || teamIndex >= numTeams) {
            direction *= -1;
            teamIndex += direction;
            console.log(`--- Snake Turn --- New Direction: ${direction === 1 ? 'Forward' : 'Reverse'}`);
        }
    }
    
    console.log('--- Final Team Rosters ---');
    newTeams.forEach(team => {
        const { avgSkill, guyCount, galCount, avgAdjustedSkill } = getTeamAnalysis(team);
        console.log(`Team: ${team.name} (${team.players.length} players) | Avg Skill: ${avgSkill} | Avg Adj. Skill: ${avgAdjustedSkill} | Gender: ${guyCount}G / ${galCount}L`);
        console.table(team.players.map(({name, gender, skill}) => ({name, gender, skill})));
    });
    
    return newTeams;
};


  const handleGenerateTeams = () => {
    if (presentPlayers.length < teamSize * 2 && presentPlayers.length > 0) {
      toast({
        title: 'Not enough players',
        description: `You need at least ${teamSize * 2} present players to generate at least two teams.`,
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
    const result = await publishData(teams, gameFormat, schedule, activeRule);
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
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const sourceTeamName = source.droppableId;
    const destTeamName = destination.droppableId;
    const sourcePlayerId = result.draggableId;

    if (sourceTeamName === destTeamName) {
        // Re-order within same team
        const team = teams.find(t => t.name === sourceTeamName);
        if (team) {
            const newPlayers = Array.from(team.players);
            const [reorderedItem] = newPlayers.splice(source.index, 1);
            newPlayers.splice(destination.index, 0, reorderedItem);
            
            const newTeams = teams.map(t => t.name === sourceTeamName ? {...t, players: newPlayers} : t);
            setTeams(newTeams);
        }
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
        
        destTeam.players.splice(destination.index, 0, movedPlayer);
        
        toast({
            title: "Player Moved",
            description: `${movedPlayer.name} has been moved to ${destTeam.name}.`
        })

        return newTeams;
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
                            <p className="text-sm font-medium text-muted-foreground">Present Players</p>
                            <p className="text-2xl font-bold">{presentPlayers.length}</p>
                        </div>
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
              <Droppable droppableId={team.name} key={team.name} isCombineEnabled={false} isDropDisabled={false}>
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
                             <div className="flex items-center gap-2">Gender: <span className="font-bold text-foreground">{guyCount}G / {galCount}L</span></div>
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

