
'use client';

import { usePlayerContext } from '@/contexts/player-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { UserPlus, Edit, Trash2, ArrowUpDown, RefreshCw, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState } from 'react';
import type { Player, Team } from '@/types';
import { EditPlayerDialog } from '@/components/edit-player-dialog';
import { AddPlayerDialog } from '@/components/add-player-dialog';
import { useToast } from '@/hooks/use-toast';
import { publishData } from '@/app/actions';
import { PlayerCSVImportExport } from '@/components/player-csv-import-export';


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
  const { players, teams, setTeams, togglePlayerPresence, isLoading, deletePlayer, gameFormat, schedule, activeRule, pointsToWin, resetAllPlayerPresence } = usePlayerContext();
  const { toast } = useToast();
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
  
  const handleTeamChange = async (playerToMove: Player, newTeamName: string | null) => {
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
      } else if(newTeamName === 'Unassigned') {
        // This case handles moving to unassigned, which is removing from any team.
        // The removal logic above already handles this.
      }
    }
    
    // Optimistically update the UI
    setTeams(newTeamsState);

    // Persist the change to the server
    const result = await publishData(newTeamsState, gameFormat, schedule, activeRule, pointsToWin);
    
    if (result.success) {
      toast({
        title: "Player Moved",
        description: `${playerToMove.name} moved to ${newTeamName || 'Unassigned'}.`,
      });
    } else {
      toast({
        title: 'Error Saving Change',
        description: result.error || 'Could not save the new team assignment.',
        variant: 'destructive',
      });
      // If saving fails, we might want to revert the state,
      // but for now we'll leave the optimistic update.
      // A more robust solution could re-fetch data.
    }
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
          valA = a[sortKey as keyof Omit<Player, 'id' | 'skill' | 'present'>];
          valB = b[sortKey as keyof Omit<Player, 'id' | 'skill' | 'present'>];
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

  const handleDelete = (playerId: string) => {
    deletePlayer(playerId);
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
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Player Management</h1>
            <p className="text-muted-foreground">
              Manage your league's players here. Click a player to toggle their presence.
            </p>
          </div>
          <div className='flex gap-2 flex-wrap'>
            <PlayerCSVImportExport />
            <Button onClick={() => resetAllPlayerPresence()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset All to Away
            </Button>
            <Button onClick={() => setIsAddPlayerOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="grid gap-4 md:hidden">
          {sortedPlayers.map(player => {
            const teamName = playerTeamMap.get(player.id) || 'Unassigned';
            const teamColor = teamName === 'Unassigned' ? '#EAEAEA' : teamColorMap.get(teamName);

            return (
              <Card key={player.id} className="w-full">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>{player.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => setEditingPlayer(player)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDelete(player.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>
                    <span className="text-muted-foreground">Presence</span>
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
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Team</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-1 h-auto -mr-2">
                          <Badge style={{ backgroundColor: teamColor, color: '#333' }} className='border-gray-300 border hover:opacity-80 cursor-pointer'>
                            {teamName}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleTeamChange(player, 'Unassigned')}>
                          Unassigned
                        </DropdownMenuItem>
                        {teams.map(team => (
                          <DropdownMenuItem key={team.name} onSelect={() => handleTeamChange(player, team.name)}>
                            {team.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>
                    <span className="text-muted-foreground">Gender</span>
                    <Badge
                      style={{
                        backgroundColor: player.gender === 'Guy' ? '#A2D2FF' : '#FFC4D6',
                        color: '#333',
                      }}
                      className="border-gray-300 border"
                    >
                      {player.gender}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>
                    <span className="text-muted-foreground">Skill</span>
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
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Desktop View - Table */}
        <Card className="hidden md:block">
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
                              <DropdownMenuItem onSelect={() => handleTeamChange(player, 'Unassigned')}>
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
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(player.id)}>
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

    