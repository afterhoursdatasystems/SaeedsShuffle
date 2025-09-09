
'use client';

import { usePlayerContext } from '@/contexts/player-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CheckinPage() {
  const { players, togglePlayerPresence, isLoading: playersLoading } = usePlayerContext();

  if (playersLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
  const presentCount = players.filter(p => p.present).length;

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
                <p className="text-muted-foreground">{presentCount} of {players.length} players present</p>
            </div>
             <div style={{width: '160px'}}></div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
        {sortedPlayers.map((player) => (
            <Card
            key={player.id}
            onClick={() => togglePlayerPresence(player.id)}
            className={cn(
                'cursor-pointer select-none transition-all duration-200 ease-in-out flex flex-col min-w-[150px]',
                player.present
                ? 'border-green-500 bg-green-50/50 border-2 shadow-lg'
                : 'border-red-500 bg-red-50/20 text-muted-foreground'
            )}
            >
            <CardContent className="flex flex-col items-center justify-center text-center p-4 gap-2 flex-grow">
                {player.present ? (
                    <CheckCircle className="h-10 w-10 text-green-500 flex-shrink-0" />
                ) : (
                    <XCircle className="h-10 w-10 text-red-500 flex-shrink-0" />
                )}
                <p className="text-base font-bold leading-tight break-words">
                    {player.name}
                </p>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}
