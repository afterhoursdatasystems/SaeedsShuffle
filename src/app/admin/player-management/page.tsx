

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserPlus, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState } from 'react';
import type { Player, Team } from '@/types';
import { EditPlayerDialog } from '@/components/edit-player-dialog';
import { AddPlayerDialog } from '@/components/add-player-dialog';

type SortKey = 'name' | 'team' | 'gender' | 'skill' | 'present';

const teamColors = [
  '#F3A6A6', '#A6C1F3', '#A6F3A6', '#F3ECA6', '#DDA0DD', '#B0E0E6', 
  '#FFDAB9', '#E6E6FA', '#F08080', '#98FB98', '#ADD8E6', '#FFA07A', 
  '#B2FFFF', '#FFB6C1', '#C1FFC1', '#FFFFB2', '#E0B2FF'
];

const getSkillColor = (skill: number) => {
  const percentage = (skill - 1) / 9; // Normalize skill from 1-10 to 0-1
  // Green (120) -> Yellow (60) -> Red (0)
  const hue = 120 - (percentage * 120);
  return `hsl(${hue}, 80%, 75%)`;
};


export default function PlayerManagementPage() {
  const { players, teams, setTeams, togglePlayerPresence, isLoading, deletePlayer } = usePlayerContext();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);

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
  
  const handleTeamChange = (playerToMove: Player, newTeamName: string | null) => {
    const oldTeamName = playerTeamMap.get(playerToMove.id);

    if (oldTeamName === newTeamName) return;

    let newTeamsState: Team[] = JSON.parse(JSON.stringify(teams));

    // Remove player from old team
    if (oldTeamName) {
      const oldTeamIndex = newTeamsState.findIndex(t => t.name === oldTeamName);
      if (oldTeamIndex > -1) {
        newTeamsState[oldTeamIndex].players = newTeamsState[oldTeamIndex].players.filter(p => p.id !== playerToMove.id);
      }
    }

    // Add player to new team
    if (newTeamName) {
      const newTeamIndex = newTeamsState.findIndex(t => t.name === newTeamName);
      if (newTeamIndex > -1) {
        newTeamsState[newTeamIndex].players.push(playerToMove);
      }
    }
    
    setTeams(newTeamsState);
  };


  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let valA: string | number | boolean;
      let valB: string | number | boolean;

      switch(sortKey) {
        case 'team':
          valA = playerTeamMap.get(a.id) || 'Unassigned';
          valB = playerTeamMap.get(b.id) || 'Unassigned';
          break;
        case 'skill':
          valA = a.skill;
          valB = b.skill;
          break;
        case 'present':
            valA = a.present;
            valB = b.present;
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

  const handleDelete = async (playerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this player?')) {
        await deletePlayer(playerId);
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Player Management</h1>
            <p className="text-muted-foreground">
              Manage your league's players here. Click a player to toggle their presence.
            </p>
          </div>
          <Button onClick={() => setIsAddPlayerOpen(true)}>
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
                    <Button variant="ghost" onClick={() => handleSort('present')}>
                      Presence
                      <span className="ml-2">{getSortIcon('present')}</span>
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
                      <TableRow 
                          key={player.id} 
                      >
                        <TableCell className="font-medium cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>{player.name}</TableCell>
                        <TableCell className="cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>
                          <Badge
                            style={{
                              backgroundColor: player.present ? '#D4EDDA' : '#F8D7DA',
                              color: player.present ? '#155724' : '#721C24',
                              borderColor: player.present ? '#C3E6CB' : '#F5C6CB'
                            }}
                            className="border"
                          >
                            {player.present ? 'Present' : 'Away'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="p-1 h-auto">
                                <Badge style={{ backgroundColor: teamColor, color: '#333' }} className='border-gray-300 border hover:opacity-80 cursor-pointer'>
                                  {teamName}
                                </Badge>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => handleTeamChange(player, null)}>
                                Unassigned
                              </DropdownMenuItem>
                              {teams.map(team => (
                                <DropdownMenuItem key={team.name} onSelect={() => handleTeamChange(player, team.name)}>
                                  {team.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>
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
                        <TableCell className="cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>
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
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingPlayer(player); }}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Player</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => handleDelete(player.id, e)}>
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

       {editingPlayer && (
        <EditPlayerDialog
          player={editingPlayer}
          isOpen={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
        />
      )}
      <AddPlayerDialog 
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
      />
    </>
  );
}
