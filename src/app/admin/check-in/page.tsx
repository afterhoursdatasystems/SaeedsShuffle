
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
    <div className="min-h-screen bg-muted/40">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-background px-4 sm:px-6 md:px-8">
            <Button asChild variant="outline">
               <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <div className='text-center'>
                <h1 className="text-3xl font-bold">Player Check-in</h1>
                <p className="text-muted-foreground">{presentCount} of {players.length} players present</p>
            </div>
            <div className="w-32"></div>
        </header>

        <main className="p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
            {sortedPlayers.map((player) => (
                <Card
                key={player.id}
                onClick={() => togglePlayerPresence(player.id)}
                className={cn(
                    'cursor-pointer select-none transition-all duration-200 ease-in-out',
                    player.present
                    ? 'border-green-500 bg-green-50 border-2 shadow-lg'
                    : 'border-red-500 bg-red-50/50 text-muted-foreground'
                )}
                >
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    {player.present ? (
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    ) : (
                        <XCircle className="h-12 w-12 text-red-500 mb-4" />
                    )}
                    <p className="text-lg font-bold leading-tight">{player.name}</p>
                    <p className={cn(
                        'text-xs font-semibold uppercase tracking-wider mt-2',
                         player.present ? 'text-green-600' : 'text-red-600'
                    )}>
                        {player.present ? 'Present' : 'Absent'}
                    </p>
                </CardContent>
                </Card>
            ))}
            </div>
        </main>
    </div>
  );
}
