'use client';

import { useState } from 'react';
import type { Player } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash, Pencil, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const playerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  skill: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  gender: z.enum(['Male', 'Female', 'Other']),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface PlayerManagementProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

export default function PlayerManagement({ players, setPlayers }: PlayerManagementProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: '',
      skill: 'Intermediate',
      gender: 'Other',
    },
  });

  const handleTogglePresent = (id: string) => {
    setPlayers(
      players.map((p) => (p.id === id ? { ...p, present: !p.present } : p))
    );
  };

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
  
  const presentPlayersCount = players.filter(p => p.present).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Player Management</CardTitle>
            <CardDescription>
              {presentPlayersCount} of {players.length} players checked in.
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player Name</FormLabel>
                      <FormControl><Input placeholder="Saeed" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="skill" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select skill level" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Male" /></FormControl>
                            <FormLabel className="font-normal">Male</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Female" /></FormControl>
                            <FormLabel className="font-normal">Female</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Other" /></FormControl>
                            <FormLabel className="font-normal">Other</FormLabel>
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
                <TableHead>Present</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Skill Level</TableHead>
                <TableHead className="hidden sm:table-cell">Gender</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <Switch
                      checked={player.present}
                      onCheckedChange={() => handleTogglePresent(player.id)}
                      aria-label={`${player.name} presence`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={
                      player.skill === 'Advanced' ? 'destructive' :
                      player.skill === 'Intermediate' ? 'secondary' : 'default'
                    } className={
                      player.skill === 'Beginner' ? 'bg-blue-500 text-white' : ''
                    }>
                      {player.skill}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{player.gender}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
