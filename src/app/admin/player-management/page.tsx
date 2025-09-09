
'use client';

import { usePlayerContext } from '@/contexts/player-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserPlus, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState } from 'react';
import type { Player } from '@/types';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'team' | 'gender' | 'skill';

const teamColors = [
  '#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8', '#FFDFD3',
  '#B5EAD7', '#A2D2FF', '#ADC4CE', '#99A8B2', '#BDE0FE', '#CDB4DB'
];

const getSkillColor = (skill: number) => {
  const percentage = (skill - 1) / 9; // Normalize skill from 1-10 to 0-1
  // Green (120) -> Yellow (60) -> Red (0)
  const hue = 120 - (percentage * 120);
  return `hsl(${hue}, 80%, 75%)`;
};


export default function PlayerManagementPage() {
  const { players, teams, isLoading } = usePlayerContext();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const playerTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach(team => {
      team.players.forEach(player => {
        map.set(player.id, team.name);
      });
    });
    return map;
  }, [teams]);
  
  const teamColorMap = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((team, index) => {
      map.set(team.name, teamColors[index % teamColors.length]);
    });
    return map;
  }, [teams]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch(sortKey) {
        case 'team':
          valA = playerTeamMap.get(a.id) || 'Unassigned';
          valB = playerTeamMap.get(b.id) || 'Unassigned';
          break;
        case 'skill':
          valA = a.skill;
          valB = b.skill;
          break;
        default:
          valA = a[sortKey];
          valB = b[sortKey];
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [players, sortKey, sortDirection, playerTeamMap]);
  
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-4 w-4 opacity-30" />;
    }
    return sortDirection === 'asc' ? '▲' : '▼';
  };


  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Player Management</h1>
          <p className="text-muted-foreground">
            Manage your league's players here.
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                   <Button variant="ghost" onClick={() => handleSort('name')}>
                    Name
                    <span className="ml-2">{getSortIcon('name')}</span>
                  </Button>
                </TableHead>
                <TableHead>
                   <Button variant="ghost" onClick={() => handleSort('team')}>
                    Team
                    <span className="ml-2">{getSortIcon('team')}</span>
                  </Button>
                </TableHead>
                <TableHead>
                   <Button variant="ghost" onClick={() => handleSort('gender')}>
                    Gender
                    <span className="ml-2">{getSortIcon('gender')}</span>
                  </Button>
                </TableHead>
                <TableHead>
                   <Button variant="ghost" onClick={() => handleSort('skill')}>
                    Skill
                    <span className="ml-2">{getSortIcon('skill')}</span>
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => {
                const teamName = playerTeamMap.get(player.id) || 'Unassigned';
                const teamColor = teamName === 'Unassigned' ? '#EAEAEA' : teamColorMap.get(teamName);

                return (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                       <TableCell>
                          <Badge style={{ backgroundColor: teamColor, color: '#333' }} className='border-gray-300 border'>
                            {teamName}
                          </Badge>
                       </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: player.gender === 'Guy' ? '#A2D2FF' : '#FFC4D6',
                            color: '#333',
                          }}
                          className="border-gray-300 border"
                        >
                          {player.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: getSkillColor(player.skill),
                            color: '#333',
                            minWidth: '30px',
                            textAlign: 'center',
                            display: 'inline-block'
                          }}
                           className="border-gray-300 border"
                        >
                          {player.skill}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit Player</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Delete Player</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
