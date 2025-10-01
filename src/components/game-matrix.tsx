

'use client';

import { useMemo } from 'react';
import type { Team, Match } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface GameMatrixProps {
  teams: Team[];
  schedule: Match[];
}

const pastelColors = [
  '#fde2e4', '#dfe7fd', '#defdeb', '#fdf7de', '#e9d5e3', '#d4eaf5',
  '#ffe5d9', '#f0e6f2', '#fad4d4', '#d4f0d4', '#d1e6ef', '#ffdbc5',
  '#d9ffff', '#ffd9e2', '#e2ffd9', '#ffffd9', '#e9d9ff'
];

// Function to get a good contrast color (black or white)
const getContrastColor = (hexcolor: string) => {
    if (hexcolor.startsWith('#')) {
        hexcolor = hexcolor.slice(1);
    }
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
}

export function GameMatrix({ teams, schedule }: GameMatrixProps) {
    const { games, teamGameCounts } = useMemo(() => {
    const games = [...new Map(schedule.map(match => [`${match.time}-${match.court}`, match])).values()]
      .sort((a, b) => {
        const timeA = new Date(`1970/01/01 ${a.time.replace(/([AP]M)/, ' $1')}`);
        const timeB = new Date(`1970/01/01 ${b.time.replace(/([AP]M)/, ' $1')}`);
        if (timeA.getTime() < timeB.getTime()) return -1;
        if (timeA.getTime() > timeB.getTime()) return 1;
        if (a.court < b.court) return -1;
        if (a.court > b.court) return 1;
        return 0;
      });

    const teamGameCounts: { [teamName: string]: number } = {};
    teams.forEach(team => {
      teamGameCounts[team.name] = schedule.filter(m => m.teamA === team.name || m.teamB === team.name).length;
    });

    return { games, teamGameCounts };
  }, [schedule, teams]);

  const opponentColorMap = useMemo(() => {
      const map = new Map<string, {backgroundColor: string, color: string}>();
      teams.forEach((team, index) => {
          const bgColor = pastelColors[index % pastelColors.length];
          const textColor = getContrastColor(bgColor);
          map.set(team.name, {backgroundColor: bgColor, color: textColor});
      });
      return map;
  }, [teams]);


  return (
    <Card>
        <CardHeader>
            <CardTitle>Game Matrix - Pool Play</CardTitle>
            <CardDescription>
                This matrix shows all scheduled games. Each row is a game, and the colored badges indicate the opponent for each team in that game.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table className="min-w-full border-t">
                <TableHeader>
                <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 w-[150px] border-r">Game</TableHead>
                    {teams.map((team) => (
                        <TableHead key={team.id} className="text-center">
                            {team.name}
                        </TableHead>
                    ))}
                </TableRow>
                </TableHeader>
                <TableBody>
                {games.map(game => (
                    <TableRow key={game.id}>
                        <TableCell className="font-medium sticky left-0 bg-background z-10 border-r w-[150px]">
                            <div>{game.time}</div>
                            <div>{game.court}</div>
                        </TableCell>
                         {teams.map(team => {
                            let opponent: string | null = null;
                            if (game.teamA === team.name) {
                                opponent = game.teamB;
                            } else if (game.teamB === team.name) {
                                opponent = game.teamA;
                            }
                            const style = opponent ? opponentColorMap.get(opponent) : {};
                            return (
                                <TableCell key={`${game.id}-${team.id}`} className="text-center p-1">
                                    {opponent ? (
                                        <Badge style={style} className="w-full text-center justify-center block whitespace-normal h-10 rounded-md">
                                            {opponent}
                                        </Badge>
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                    <TableCell className="sticky left-0 bg-muted/50 z-10 border-r w-[150px]">Total Games</TableCell>
                    {teams.map(team => (
                        <TableCell key={`total-${team.id}`} className="text-center text-lg">
                            {teamGameCounts[team.name] || 0}
                        </TableCell>
                    ))}
                </TableRow>
                </TableBody>
            </Table>
            </div>
        </CardContent>
    </Card>
  );
}
