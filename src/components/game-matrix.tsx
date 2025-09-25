

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
  '#F3A6A6', '#A6C1F3', '#A6F3A6', '#F3ECA6', '#DDA0DD', '#B0E0E6', 
  '#FFDAB9', '#E6E6FA', '#F08080', '#98FB98', '#ADD8E6', '#FFA07A', 
  '#B2FFFF', '#FFB6C1', '#C1FFC1', '#FFFFB2', '#E0B2FF'
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
  const { games, teamGameMap, teamGameCounts } = useMemo(() => {
    // Unique games identified by time and court, then sorted.
    const games = [...new Map(schedule.map(match => [`${match.time}-${match.court}`, match])).values()]
      .sort((a, b) => {
        // Sort by time, then by court
        const timeA = new Date(`1970/01/01 ${a.time.replace(/([AP]M)/, ' $1')}`);
        const timeB = new Date(`1970/01/01 ${b.time.replace(/([AP]M)/, ' $1')}`);
        if (timeA.getTime() < timeB.getTime()) return -1;
        if (timeA.getTime() > timeB.getTime()) return 1;
        if (a.court < b.court) return -1;
        if (a.court > b.court) return 1;
        return 0;
      });

    // Map each team to their games
    const teamGameMap = new Map<string, { [gameId: string]: string }>();
    const teamGameCounts: { [teamName: string]: number } = {};

    teams.forEach(team => {
      const gamesForTeam: { [gameId: string]: string } = {};
      let gameCount = 0;
      games.forEach(game => {
        if (game.teamA === team.name) {
          gamesForTeam[game.id] = game.teamB;
          gameCount++;
        } else if (game.teamB === team.name) {
          gamesForTeam[game.id] = game.teamA;
          gameCount++;
        }
      });
      teamGameMap.set(team.name, gamesForTeam);
      teamGameCounts[team.name] = gameCount;
    });

    return { games, teamGameMap, teamGameCounts };
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
                Team names show which teams pairs played for each game. Empty cells mean the pair doesn't play that game.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table className="min-w-full border-t">
                <TableHeader>
                <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 w-[200px] border-r">Pair Name</TableHead>
                    {games.map((game, index) => (
                    <TableHead key={game.id} className="text-center">
                        <div>Game {index + 1}</div>
                        <div>{game.time}</div>
                        <div>{game.court}</div>
                    </TableHead>
                    ))}
                    <TableHead className="text-center sticky right-0 bg-background z-10 border-l">Total</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {teams.map(team => (
                    <TableRow key={team.id}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10 border-r w-[200px]">{team.name}</TableCell>
                    {games.map(game => {
                        const opponent = teamGameMap.get(team.name)?.[game.id];
                        const style = opponent ? opponentColorMap.get(opponent) : {};
                        return (
                        <TableCell key={game.id} className="text-center p-1">
                            {opponent ? (
                            <Badge style={style} className="w-full text-center justify-center block whitespace-normal h-10">
                                {opponent}
                            </Badge>
                            ) : (
                            '-'
                            )}
                        </TableCell>
                        );
                    })}
                    <TableCell className="font-bold text-center sticky right-0 bg-background z-10 border-l">{teamGameCounts[team.name] || 0}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
        </CardContent>
    </Card>
  );
}
