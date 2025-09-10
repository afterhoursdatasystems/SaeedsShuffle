

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


const createBalancedTeams = (allPlayers: Player[], formatSize: number): Team[] => {
  console.clear();
  console.log('=== TEAM GENERATION START ===');
  console.log(`Players: ${allPlayers.length} | Format: ${formatSize}v${formatSize}`);
  
  // 1. Calculate adjusted skills
  const adjustedPlayers: PlayerWithAdjustedSkill[] = allPlayers.map(p => ({
    ...p,
    adjustedSkill: p.skill * (p.gender === 'Gal' ? 0.85 : 1)
  }));
  
  // Calculate gender ratio for reference
  const totalGals = adjustedPlayers.filter(p => p.gender === 'Gal').length;
  const targetGalRatio = totalGals / allPlayers.length;
  console.log(`Gender Distribution: ${totalGals} Gals, ${allPlayers.length - totalGals} Guys`);
  console.log(`Target Gal Ratio: ${(targetGalRatio * 100).toFixed(1)}%`);
  
  // 2. Create skill buckets (5 tiers, 2 skill levels each)
  type BucketType = { guys: PlayerWithAdjustedSkill[], gals: PlayerWithAdjustedSkill[] };
  const buckets: { [key: string]: BucketType } = {
    'tier1': { guys: [], gals: [] }, // 9-10
    'tier2': { guys: [], gals: [] }, // 7-8
    'tier3': { guys: [], gals: [] }, // 5-6
    'tier4': { guys: [], gals: [] }, // 3-4
    'tier5': { guys: [], gals: [] }  // 1-2
  };
  
  // 3. Distribute players into buckets by skill AND gender
  adjustedPlayers.forEach(p => {
    const genderGroup = p.gender === 'Gal' ? 'gals' : 'guys';
    if (p.skill >= 9) buckets.tier1[genderGroup].push(p);
    else if (p.skill >= 7) buckets.tier2[genderGroup].push(p);
    else if (p.skill >= 5) buckets.tier3[genderGroup].push(p);
    else if (p.skill >= 3) buckets.tier4[genderGroup].push(p);
    else buckets.tier5[genderGroup].push(p);
  });
  
  // 4. Shuffle within each bucket/gender group for randomness
  Object.values(buckets).forEach(tier => {
    tier.guys = shuffleArray(tier.guys);
    tier.gals = shuffleArray(tier.gals);
  });
  
  // Log bucket distribution
  console.log('\n=== SKILL BUCKETS (after shuffle) ===');
  Object.entries(buckets).forEach(([tier, groups]) => {
    if (groups.guys.length > 0 || groups.gals.length > 0) {
      console.log(`${tier}: ${groups.guys.length} Guys, ${groups.gals.length} Gals`);
    }
  });
  
  // 5. Create draft pool maintaining tier order but alternating gender
  const draftPool: PlayerWithAdjustedSkill[] = [];
  ['tier1', 'tier2', 'tier3', 'tier4', 'tier5'].forEach(tier => {
    const guys = [...buckets[tier].guys];
    const gals = [...buckets[tier].gals];
    
    // Interleave guys and gals within each tier for better distribution
    while (guys.length > 0 || gals.length > 0) {
      if (guys.length > 0) draftPool.push(guys.shift()!);
      if (gals.length > 0) draftPool.push(gals.shift()!);
    }
  });
  
  // 6. Determine team structure
  const numTeams = Math.floor(allPlayers.length / formatSize);
  if (numTeams < 2) {
    console.log('Not enough players for 2 teams');
    return [];
  }
  
  const baseTeamSize = Math.floor(allPlayers.length / numTeams);
  const teamsWithExtra = allPlayers.length % numTeams;
  
  console.log(`\n=== TEAM STRUCTURE ===`);
  console.log(`Teams: ${numTeams} | Base size: ${baseTeamSize} | Teams with extra: ${teamsWithExtra}`);
  
  // Initialize teams with random names
  const shuffledNames = shuffleArray(teamNames);
  const newTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
    name: shuffledNames[i % shuffledNames.length],
    players: [],
  }));
  
  // Track gender counts for each team
  const teamGenderCounts = newTeams.map(() => ({ guys: 0, gals: 0 }));
  
  // 7. Snake draft with gender ratio awareness
  let round = 0;
  let pickNumber = 0;
  
  while (draftPool.length > 0) {
    round++;
    const isForwardRound = round % 2 === 1;
    const teamOrder = isForwardRound 
      ? newTeams.map((_, i) => i) 
      : newTeams.map((_, i) => i).reverse();
    
    for (const teamIndex of teamOrder) {
      if (draftPool.length === 0) break;
      
      const team = newTeams[teamIndex];
      const targetSize = teamIndex < teamsWithExtra ? baseTeamSize + 1 : baseTeamSize;
      
      if (team.players.length >= targetSize) continue;
      
      pickNumber++;
      
      // Determine what this team needs
      const currentGalRatio = team.players.length > 0 
        ? teamGenderCounts[teamIndex].gals / team.players.length 
        : 0;
      const needsGal = currentGalRatio < targetGalRatio;
      
      // Find best available player considering gender need
      let playerIndex = -1;
      
      // First, try to find a player of the needed gender in the top candidates
      const searchDepth = Math.min(5, draftPool.length); // Look at top 5 players
      
      for (let i = 0; i < searchDepth; i++) {
        const candidate = draftPool[i];
        const isGal = candidate.gender === 'Gal';
        
        if (needsGal === isGal) {
          playerIndex = i;
          break;
        }
      }
      
      // If no gender match found in top candidates, take the best available
      if (playerIndex === -1) {
        playerIndex = 0;
      }
      
      // Draft the player
      const [draftedPlayer] = draftPool.splice(playerIndex, 1);
      team.players.push(draftedPlayer);
      
      // Update gender counts
      if (draftedPlayer.gender === 'Gal') {
        teamGenderCounts[teamIndex].gals++;
      } else {
        teamGenderCounts[teamIndex].guys++;
      }
      
      console.log(
        `Pick #${pickNumber}: ${team.name} selects ${draftedPlayer.name} ` +
        `(${draftedPlayer.gender}, Skill: ${draftedPlayer.skill}, Adj: ${draftedPlayer.adjustedSkill.toFixed(1)})`
      );
    }
  }
  
  // 8. Final team analysis
  console.log('\n=== FINAL TEAMS ===');
  newTeams.forEach((team, index) => {
    const { avgSkill, guyCount, galCount, avgAdjustedSkill } = getTeamAnalysis(team);
    console.log(`\n${team.name} (${team.players.length} players)`);
    console.log(`  Avg Raw Skill: ${avgSkill}`);
    console.log(`  Avg Adjusted Skill: ${avgAdjustedSkill}`);
    console.log(`  Gender: ${guyCount} Guys, ${galCount} Gals (${(galCount / team.players.length * 100).toFixed(1)}% Gal)`);
    console.log(`  Roster: ${team.players.map(p => `${p.name}(${p.skill})`).join(', ')}`);
  });
  
  // Calculate and display balance metrics
  const teamAverages = newTeams.map(team => {
    const totalAdjusted = team.players.reduce((sum, p: any) => sum + (p.adjustedSkill || p.skill * (p.gender === 'Gal' ? 0.85 : 1)), 0);
    return totalAdjusted / team.players.length;
  });
  const avgRange = Math.max(...teamAverages) - Math.min(...teamAverages);
  console.log(`\n=== BALANCE METRICS ===`);
  console.log(`Average Adjusted Skill Range: ${avgRange.toFixed(2)} (lower is better)`);
  
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

    