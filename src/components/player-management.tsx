
'use client';

import { useMemo } from 'react';
import type { Player, Team } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

import { UserCheck } from 'lucide-react';
import { Separator } from './ui/separator';
import { usePlayerContext } from '@/contexts/player-context';
import Link from 'next/link';


export default function PlayerManagement() {
  const { players } = usePlayerContext();

  const { presentPlayersCount, presentGuys, presentGals, averageSkill } = useMemo(() => {
    const presentPlayers = players.filter(p => p.presence === 'Present');
    const presentPlayersCount = presentPlayers.length;
    const presentGuys = presentPlayers.filter(p => p.gender === 'Guy').length;
    const presentGals = presentPlayers.filter(p => p.gender === 'Gal').length;
    const totalSkill = presentPlayers.reduce((sum, p) => sum + p.skill, 0);
    const averageSkill = presentPlayersCount > 0 ? (totalSkill / presentPlayersCount).toFixed(1) : '0';
    return { presentPlayers, presentPlayersCount, presentGuys, presentGals, averageSkill };
  }, [players]);

  return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around rounded-lg border p-4 flex-grow">
                <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Present Players</p>
                    <p className="text-3xl font-bold">{presentPlayersCount}</p>
                </div>
                <Separator orientation='vertical' className='hidden sm:block h-12' />
                <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Gender Breakdown</p>
                    <p className="text-3xl font-bold">
                        <span className="text-blue-500">{presentGuys}</span>
                        <span className="mx-2 text-muted-foreground">/</span>
                        <span className="text-pink-500">{presentGals}</span>
                    </p>
                </div>
                <Separator orientation='vertical' className='hidden sm:block h-12' />
                <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Average Skill</p>
                    <p className="text-3xl font-bold">{averageSkill}</p>
                </div>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/admin/check-in">
                    <UserCheck className="mr-2 h-5 w-5" />
                    Go to Full Check-in Page
                </Link>
            </Button>
        </div>
    </div>
  );
}
