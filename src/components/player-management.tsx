
'use client';

import { useMemo, useState } from 'react';
import type { Player, Team } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash, Pencil, MoreVertical, ChevronsUpDown, ArrowDown, ArrowUp, Users, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { usePlayerContext } from '@/contexts/player-context';
import Link from 'next/link';

const playerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  skill: z.number().min(1).max(10),
  gender: z.enum(['Guy', 'Gal']),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface PlayerManagementProps {
  teams: Team[];
}

type SortKey = keyof Player | 'present' | 'team';
type SortDirection = 'asc' | 'desc';

// Function to generate a consistent pastel color from a string
const stringToPastelColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 85%)`;
};

export default function PlayerManagement({ teams }: PlayerManagementProps) {
  const { players, setPlayers, togglePlayerPresence } = usePlayerContext();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'name', direction: 'asc' });

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: '',
      skill: 5,
      gender: 'Gal',
    },
  });
  
  const playerTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach(team => {
      team.players.forEach(player => {
        map.set(player.id, team.name);
      });
    });
    return map;
  }, [teams]);

  const onSubmit = (data: PlayerFormValues) => {
    if (editingPlayer) {
      setPlayers(players.map(p => p.id === editingPlayer.id ? {...editingPlayer, ...data} : p));
      toast({ title: "Player updated", description: `${data.name} has been updated.` });
    } else {
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        ...data,
        present: true,
      };
      setPlayers([...players, newPlayer]);
      toast({ title: "Player added", description: `${data.name} has been added to the league.` });
    }
    form.reset();
    setEditingPlayer(null);
    setOpen(false);
  };
  
  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    form.reset({ name: player.name, skill: player.skill, gender: player.gender });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
    toast({ title: "Player removed", variant: "destructive", description: "The player has been removed." });
  };
  
  const { presentPlayers, presentPlayersCount, presentGuys, presentGals, averageSkill } = useMemo(() => {
    const presentPlayers = players.filter(p => p.present);
    const presentPlayersCount = presentPlayers.length;
    const presentGuys = presentPlayers.filter(p => p.gender === 'Guy').length;
    const presentGals = presentPlayers.filter(p => p.gender === 'Gal').length;
    const totalSkill = presentPlayers.reduce((sum, p) => sum + p.skill, 0);
    const averageSkill = presentPlayersCount > 0 ? (totalSkill / presentPlayersCount).toFixed(1) : '0';
    return { presentPlayers, presentPlayersCount, presentGuys, presentGals, averageSkill };
  }, [players]);
  
  const sortedPlayers = useMemo(() => {
    let sortablePlayers = [...players];
    if (sortConfig !== null) {
      sortablePlayers.sort((a, b) => {
        let aValue, bValue;
        
        if(sortConfig.key === 'team') {
          aValue = playerTeamMap.get(a.id) || 'zzz'; // Unassigned players sort last
          bValue = playerTeamMap.get(b.id) || 'zzz';
        } else {
          aValue = a[sortConfig.key as keyof Player];
          bValue = b[sortConfig.key as keyof Player];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortablePlayers;
  }, [players, sortConfig, playerTeamMap]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const getSkillBadgeClass = (skill: number) => {
    const colors = [
      'bg-slate-300 text-slate-800',   // 1 (Beginner)
      'bg-cyan-300 text-cyan-800',     // 2
      'bg-sky-400 text-sky-900',       // 3
      'bg-green-400 text-green-900',   // 4 (Intermediate)
      'bg-lime-400 text-lime-900',     // 5
      'bg-yellow-400 text-yellow-900', // 6
      'bg-amber-500 text-white',       // 7
      'bg-orange-500 text-white',      // 8 (Advanced)
      'bg-red-500 text-white',         // 9
      'bg-rose-600 text-white',        // 10
    ];
    return colors[skill - 1] || colors[0];
  };

  return (
    <div className="space-y-6">
       <Card>
          <CardHeader>
            <CardTitle>Nightly Check-in</CardTitle>
            <CardDescription>A quick look at tonight's player stats.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
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
                Go to Check-in Page
              </Link>
            </Button>
          </CardContent>
        </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Player Roster</CardTitle>
              <CardDescription>
                Full list of all players in the league.
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                form.reset();
                setEditingPlayer(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingPlayer ? 'Edit Player' : 'Add New Player'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Player Name</FormLabel>
                        <FormControl><Input placeholder="Saeed" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="skill" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Level: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            defaultValue={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="Guy" /></FormControl>
                              <FormLabel className="font-normal">Guy</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="Gal" /></FormControl>
                              <FormLabel className="font-normal">Gal</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                      <Button type="submit">{editingPlayer ? 'Save Changes' : 'Add Player'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('present')} className="px-0">
                      Present
                      {getSortIcon('present')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')} className="px-0">
                      Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('skill')} className="px-0">
                      Skill Level
                      {getSortIcon('skill')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('gender')} className="px-0">
                      Gender
                      {getSortIcon('gender')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('team')} className="px-0">
                      Team
                      {getSortIcon('team')}
                    </Button>
                  </TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map((player) => {
                    const teamName = playerTeamMap.get(player.id);
                    return (
                  <TableRow key={player.id}>
                    <TableCell>
                      <Switch
                        checked={player.present}
                        onCheckedChange={() => togglePlayerPresence(player.id)}
                        aria-label={`${player.name} presence`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                       <Badge
                        className={cn(
                          'border-none',
                          getSkillBadgeClass(player.skill)
                        )}
                      >
                        {player.skill}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                       <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          player.gender === 'Guy' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        )}
                      >
                        {player.gender}
                      </span>
                    </TableCell>
                     <TableCell className="hidden sm:table-cell">
                      {teamName ? (
                        <Badge 
                          style={{ backgroundColor: stringToPastelColor(teamName), color: 'hsl(0, 0%, 20%)' }}
                          className="whitespace-nowrap border-none"
                        >
                          {teamName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                     <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(player)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(player.id)} className="text-destructive">
                               <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
