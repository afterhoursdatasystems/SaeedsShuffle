
'use client';

import { useMemo } from 'react';
import { usePlayerContext } from '@/contexts/player-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CheckinPage() {
  const { players, togglePlayerPresence, isLoading: playersLoading } = usePlayerContext();

  const { presentPlayers, presentCount, presentGuys, presentGals } = useMemo(() => {
    const presentPlayers = players.filter(p => p.presence === 'Present');
    const presentCount = presentPlayers.length;
    const presentGuys = presentPlayers.filter(p => p.gender === 'Guy').length;
    const presentGals = presentPlayers.filter(p => p.gender === 'Gal').length;
    return { presentPlayers, presentCount, presentGuys, presentGals };
  }, [players]);


  if (playersLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
             <Button asChild variant="outline">
                <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <div className='text-center'>
                <h1 className="text-3xl font-bold">Player Check-in</h1>
                <p className="text-muted-foreground">{presentCount} of {players.length} players present ({presentGuys} Guys / {presentGals} Gals)</p>
            </div>
             <div style={{width: '160px'}}></div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
        {sortedPlayers.map((player) => {
            const isPresent = player.presence === 'Present';
            const isAbsent = player.presence === 'Absent';
            const isPending = player.presence === 'Pending';
            
            return (
            <Card
                key={player.id}
                onClick={() => togglePlayerPresence(player.id)}
                className={cn(
                    'cursor-pointer select-none transition-all duration-200 ease-in-out flex flex-col',
                    isPresent && 'border-green-500 bg-green-50/50 border-2 shadow-lg',
                    isAbsent && 'border-red-500 bg-red-50/20 text-muted-foreground',
                    isPending && 'border-slate-400 bg-slate-50/20'
                )}
            >
                <CardContent className="flex flex-col items-center justify-center text-center p-4 gap-3 flex-grow">
                    {isPresent && <CheckCircle className="h-10 w-10 text-green-500 flex-shrink-0" />}
                    {isAbsent && <XCircle className="h-10 w-10 text-red-500 flex-shrink-0" />}
                    {isPending && <HelpCircle className="h-10 w-10 text-slate-500 flex-shrink-0" />}
                    <p className="text-base font-bold leading-tight">
                        {player.name}
                    </p>
                </CardContent>
            </Card>
        )})}
        </div>
    </div>
  );
}
