
'use client';

import { usePlayerContext } from '@/contexts/player-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
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
import { 
    UserPlus, Edit, Trash2, ArrowUpDown, MoreVertical, RotateCcw,
    FileDown, FileUp, UserX 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState, useRef } from 'react';
import type { Player, Team } from '@/types';
import { EditPlayerDialog } from '@/components/edit-player-dialog';
import { AddPlayerDialog } from '@/components/add-player-dialog';
import { useToast } from '@/hooks/use-toast';
import { publishData } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type SortKey = 'name' | 'team' | 'gender' | 'skill' | 'presence';

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

const getPresenceProps = (presence: Player['presence']) => {
    switch (presence) {
        case 'Present':
            return {
                style: { backgroundColor: '#D4EDDA', color: '#155724', borderColor: '#C3E6CB' },
                text: 'Present',
            };
        case 'Absent':
            return {
                style: { backgroundColor: '#F8D7DA', color: '#721C24', borderColor: '#F5C6CB' },
                text: 'Absent',
            };
        case 'Pending':
        default:
            return {
                style: { backgroundColor: '#E2E8F0', color: '#475569', borderColor: '#CBD5E1' },
                text: 'Pending',
            };
    }
};


export default function PlayerManagementPage() {
  const { players, teams, setTeams, togglePlayerPresence, isLoading, deletePlayer, gameFormat, schedule, activeRule, pointsToWin, resetAllPlayerPresence, deleteAllPlayers, importPlayers } = usePlayerContext();
  const { toast } = useToast();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);


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
        case 'presence':
            valA = a.presence;
            valB = b.presence;
            break;
        default:
          valA = a[sortKey as 'name' | 'gender'];
          valB = b[sortKey as 'name' | 'gender'];
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
    await deletePlayer(playerId);
  };

  const handleResetPresence = async () => {
    await resetAllPlayerPresence();
  };
  
    const handleDeleteAll = async () => {
        await deleteAllPlayers();
    };

    const handleExportCSV = () => {
        const headers = 'Name,Gender,Skill';
        const rows = players.map(p => `${p.name},${p.gender},${p.skill}`);
        const csvContent = [headers, ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'players.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
            const text = e.target?.result;
            if (typeof text !== 'string') return;

            const rows = text.split('\n').slice(1); // Skip header
            const newPlayers: Omit<Player, 'id' | 'presence'>[] = [];

            for (const row of rows) {
                if (!row.trim()) continue;
                const [name, gender, skillStr] = row.split(',').map(s => s.trim());
                const skill = parseInt(skillStr, 10);
                if (name && (gender === 'Guy' || gender === 'Gal') && !isNaN(skill)) {
                    newPlayers.push({ name, gender, skill });
                } else {
                     toast({
                        title: 'Import Warning',
                        description: `Skipped invalid row: "${row}"`,
                        variant: 'destructive',
                    });
                }
            }
            
            if (newPlayers.length > 0) {
                await importPlayers(newPlayers);
            }
            // Reset file input
            if(importInputRef.current) {
                importInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Player Management</h1>
          <p className="text-muted-foreground">
            Manage your league's players here. Click a player to toggle their presence.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
            <Button onClick={() => setIsAddPlayerOpen(true)} className="flex-grow sm:flex-grow-0">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Player
            </Button>
            <Button onClick={handleResetPresence} variant="outline" className="flex-grow sm:flex-grow-0">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Presence
            </Button>
            <input type="file" ref={importInputRef} onChange={handleFileImport} accept=".csv" style={{ display: 'none' }} />
            <Button onClick={handleImportClick} variant="outline" className="flex-grow sm:flex-grow-0">
                <FileUp className="mr-2 h-4 w-4" />
                Import CSV
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="flex-grow sm:flex-grow-0">
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-grow sm:flex-grow-0">
                        <UserX className="mr-2 h-4 w-4" />
                        Delete All
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all players from the roster and remove them from any teams they are on.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll}>Yes, delete all players</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        
        {/* Mobile View: Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
          {sortedPlayers.map((player) => {
            const teamName = playerTeamMap.get(player.id) || 'Unassigned';
            const teamColor = teamName === 'Unassigned' ? '#EAEAEA' : teamColorMap.get(teamName);
            const presenceProps = getPresenceProps(player.presence);
            return (
              <Card key={player.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between p-4">
                  <CardTitle className="text-lg cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>{player.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => setEditingPlayer(player)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => handleDelete(player.id, e as any)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center justify-between" onClick={() => togglePlayerPresence(player.id)}>
                      <span className="text-muted-foreground">Presence</span>
                      <Badge style={presenceProps.style} className="border">
                        {presenceProps.text}
                      </Badge>
                  </div>
                  <div className="flex items-center justify-between">
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
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                    <Badge
                      style={{ backgroundColor: player.gender === 'Guy' ? '#A2D2FF' : '#FFC4D6', color: '#333' }}
                      className="border-gray-300 border"
                    >
                      {player.gender}
                    </Badge>
                    <Badge
                      style={{ backgroundColor: getSkillColor(player.skill), color: '#333' }}
                      className="border-gray-300 border"
                    >
                      Skill: {player.skill}
                    </Badge>
                </CardFooter>
              </Card>
            );
          })}
        </div>


        {/* Desktop View: Table */}
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
                    <Button variant="ghost" onClick={() => handleSort('presence')}>
                      Presence
                      <span className="ml-2">{getSortIcon('presence')}</span>
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
                  const presenceProps = getPresenceProps(player.presence);

                  return (
                      <TableRow 
                          key={player.id} 
                      >
                        <TableCell className="font-medium cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>{player.name}</TableCell>
                        <TableCell className="cursor-pointer" onClick={() => togglePlayerPresence(player.id)}>
                          <Badge style={presenceProps.style} className="border">
                            {presenceProps.text}
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
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => handleDelete(player.id, e as any)}>
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
