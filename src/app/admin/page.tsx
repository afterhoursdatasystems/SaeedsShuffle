
'use client';

import PlayerManagement from '@/components/player-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Calendar, Crown, BookOpen, Shuffle, Settings, UserPlus, Trophy, Zap, Send } from 'lucide-react';
import Link from 'next/link';
import { usePlayerContext } from '@/contexts/player-context';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameFormat, GameVariant } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminPage() {
    const { 
      gameFormat, setGameFormat, 
      gameVariant, handleSetGameVariant, 
      teams, schedule, 
      pointsToWin, setPointsToWin,
      publishSettings 
    } = usePlayerContext();

    const isKOTC = gameFormat === 'king-of-the-court';

  return (
    <>
    <main className="flex flex-1 flex-col p-4 sm:p-6 md:p-8">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8">
            {/* Step 1: Player Management */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</span>
                        Player Check-in & Stats
                    </CardTitle>
                    <CardDescription>Review who is present for tonight's games and manage the full player roster.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PlayerManagement />
                </CardContent>
            </Card>

             {/* Step 2: Configure Tournament */}
            <Card className="shadow-lg">
                <CardHeader>
                     <CardTitle className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</span>
                        Configure Tournament
                    </CardTitle>
                    <CardDescription>Select the game format and any specific variants for tonight's event.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6 rounded-lg border p-4">
                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                            <div className='space-y-2'>
                                <Label>Game Format</Label>
                                <Select value={gameFormat} onValueChange={(val: GameFormat) => setGameFormat(val)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a format" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="king-of-the-court"><Crown className="inline-block h-4 w-4 mr-2" /> King of the Court</SelectItem>
                                    <SelectItem value="round-robin"><BookOpen className="inline-block h-4 w-4 mr-2" /> Round Robin</SelectItem>
                                    <SelectItem value="pool-play-bracket"><Trophy className="inline-block h-4 w-4 mr-2" /> Pool Play / Bracket</SelectItem>
                                    <SelectItem value="blind-draw"><Shuffle className="inline-block h-4 w-4 mr-2" /> Blind Draw</SelectItem>
                                  </SelectContent>
                                </Select>
                            </div>
                            { isKOTC && (
                                <div className='space-y-2'>
                                    <Label>Game Variant</Label>
                                    <Select value={gameVariant} onValueChange={(val: GameVariant) => handleSetGameVariant(val)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a variant" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="standard">Standard KOTC</SelectItem>
                                        <SelectItem value="monarch-of-the-court">Monarch of the Court</SelectItem>
                                        <SelectItem value="king-s-ransom">King's Ransom</SelectItem>
                                        <SelectItem value="power-up-round">Power-up Round</SelectItem>
                                      </SelectContent>
                                    </Select>
                                </div>
                            )}
                             <div className='space-y-2'>
                                <Label htmlFor="points-to-win">Points to Win</Label>
                                <Input 
                                    id="points-to-win"
                                    type="number" 
                                    value={pointsToWin}
                                    onChange={(e) => setPointsToWin(Number(e.target.value))}
                                    className="w-full"
                                    min="1"
                                />
                            </div>
                        </div>
                         <Button onClick={publishSettings} className="mt-4 w-full sm:w-auto">
                            <Send className="mr-2 h-4 w-4" />
                            Publish Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Step 3: Teams & Schedule */}
             <Card className="shadow-lg">
                <CardHeader>
                     <CardTitle className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</span>
                        Manage Teams & Schedule
                    </CardTitle>
                    <CardDescription>Generate teams based on who is present, then create the schedule.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Button asChild size="lg" variant={teams.length === 0 ? 'default' : 'secondary'}>
                        <Link href="/admin/teams">
                            <UserPlus className="mr-2 h-5 w-5" /> Generate Teams
                        </Link>
                   </Button>
                   <Button asChild size="lg" variant={schedule.length === 0 ? 'default' : 'secondary'} disabled={teams.length === 0 && gameFormat !== 'blind-draw'}>
                       <Link href="/admin/schedule">
                           <Calendar className="mr-2 h-5 w-5" /> Generate Schedule
                       </Link>
                   </Button>
                </CardContent>
            </Card>
            
             {/* Other Tools */}
             <Card className="shadow-lg">
                <CardHeader>
                     <CardTitle className="flex items-center gap-3">
                        <Settings className="h-6 w-6" />
                        Other Tools
                    </CardTitle>
                    <CardDescription>Additional utilities for managing the tournament.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Button asChild size="lg" variant="outline">
                       <Link href="/admin/simulation">
                           <Bot className="mr-2 h-5 w-5" /> Simulate Standings
                       </Link>
                   </Button>
                   <Button asChild size="lg" variant="outline">
                       <Link href="/admin/rule-generator">
                           <Zap className="mr-2 h-5 w-5" /> Rule Generator
                       </Link>
                   </Button>
                </CardContent>
            </Card>

        </div>
    </main>
    </>
  )
}
