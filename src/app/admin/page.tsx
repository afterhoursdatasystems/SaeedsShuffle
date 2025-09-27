
'use client';

import PlayerManagement from '@/components/player-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Calendar, Crown, BookOpen, Shuffle, Settings, UserPlus, Trophy, Zap, Send, TrendingUp, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { usePlayerContext } from '@/contexts/player-context';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameFormat, GameVariant } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRef } from 'react';
import { exportAllData, importAllData } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';


export default function AdminPage() {
    const { 
      gameFormat, setGameFormat, 
      gameVariant, handleSetGameVariant, 
      teams, schedule, 
      pointsToWin, setPointsToWin,
      gamesPerTeam, setGamesPerTeam,
      gameDuration, setGameDuration,
      publishSettings,
      loadAllData,
    } = usePlayerContext();
    const { toast } = useToast();
    const importInputRef = useRef<HTMLInputElement>(null);

    const isKOTC = gameFormat === 'king-of-the-court';
    
    const handleExport = async () => {
        const result = await exportAllData();
        if (result.success && result.data) {
            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'tournament-backup.json');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({
                title: 'Export Successful',
                description: 'All tournament data has been downloaded.',
            });
        } else {
             toast({
                title: 'Export Failed',
                description: result.error || 'Could not export data.',
                variant: 'destructive',
            });
        }
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('Invalid file content.');
                const data = JSON.parse(text);

                const result = await importAllData(data);
                if (result.success) {
                    await loadAllData(); // This will re-fetch everything and update the context
                    toast({
                        title: 'Import Successful',
                        description: 'All tournament data has been restored.',
                    });
                } else {
                    throw new Error(result.error || 'Failed to import data.');
                }

            } catch (error: any) {
                toast({
                    title: 'Import Failed',
                    description: error.message || 'The backup file is corrupted or invalid.',
                    variant: 'destructive',
                });
            } finally {
                 if(importInputRef.current) {
                    importInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };


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
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between rounded-lg border p-4">
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow'>
                            <div className='space-y-2'>
                                <Label>Game Format</Label>
                                <Select value={gameFormat} onValueChange={(val: GameFormat) => setGameFormat(val)}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a format" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="king-of-the-court"><Crown className="inline-block h-4 w-4 mr-2" /> King of the Court</SelectItem>
                                    <SelectItem value="round-robin"><BookOpen className="inline-block h-4 w-4 mr-2" /> Round Robin</SelectItem>
                                    <SelectItem value="pool-play-bracket"><Trophy className="inline-block h-4 w-4 mr-2" /> Pool Play / Bracket</SelectItem>
                                    <SelectItem value="level-up"><TrendingUp className="inline-block h-4 w-4 mr-2" /> Level Up</SelectItem>
                                    <SelectItem value="blind-draw"><Shuffle className="inline-block h-4 w-4 mr-2" /> Blind Draw</SelectItem>
                                  </SelectContent>
                                </Select>
                            </div>
                            { isKOTC && (
                                <div className='space-y-2'>
                                    <Label>Game Variant</Label>
                                    <Select value={gameVariant} onValueChange={(val: GameVariant) => handleSetGameVariant(val)}>
                                      <SelectTrigger className="w-full">
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
                             <div className="space-y-2">
                                <Label htmlFor="game-duration">Game Duration</Label>
                                <Select value={String(gameDuration)} onValueChange={(val) => setGameDuration(Number(val))}>
                                    <SelectTrigger id="game-duration">
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[15, 20, 25, 30, 35, 40, 45].map(duration => (
                                           <SelectItem key={duration} value={String(duration)}>{duration} min</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="games-per-team">Games Per Team</Label>
                                <Select value={String(gamesPerTeam)} onValueChange={(val) => setGamesPerTeam(Number(val))}>
                                    <SelectTrigger id="games-per-team">
                                        <SelectValue placeholder="Select games per team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                            <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button onClick={publishSettings} className="mt-4 sm:mt-0">
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
                       <Link href="/admin/rule-generator">
                           <Zap className="mr-2 h-5 w-5" /> Rule Generator
                       </Link>
                   </Button>
                </CardContent>
            </Card>

            {/* Backup & Restore */}
            <Card className="shadow-lg">
                <CardHeader>
                     <CardTitle className="flex items-center gap-3">
                        <Download className="h-6 w-6" />
                        Backup & Restore
                    </CardTitle>
                    <CardDescription>Export all tournament data to a file or import it to restore a previous state.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="file" ref={importInputRef} onChange={handleFileImport} accept=".json" style={{ display: 'none' }} />
                   <Button onClick={handleExport} size="lg" variant="outline">
                       <Download className="mr-2 h-5 w-5" /> Export Data
                   </Button>
                   <Button onClick={handleImportClick} size="lg" variant="outline">
                       <Upload className="mr-2 h-5 w-5" /> Import Data
                   </Button>
                </CardContent>
            </Card>

        </div>
    </main>
    </>
  )
}

    