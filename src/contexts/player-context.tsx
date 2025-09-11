

'use client';

import type { Player, Team, Match, GameFormat, GameVariant, PowerUp } from '@/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import { getPlayers, updatePlayerPresence, getPublishedData, updatePlayer, addPlayer, deletePlayer, publishData } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const allPowerUps: PowerUp[] = [
  { name: 'Point Boost', description: 'Start the next game with a 2-point lead.' },
  { name: 'Serve Advantage', description: 'Get one "do-over" on a missed serve during the next match.' },
  { name: 'The Equalizer', description: "The opponent's highest-skilled player must serve underhand for the entire game." },
  { name: 'Secret Weapon', description: 'Choose one player on your team; their points are worth double for the first 5 points of the game.' },
  { name: 'Triple Threat', description: "For the next three serves, your team's serves cannot be returned over the net on the first touch." },
  { name: 'Gender Bender', description: 'The next point must be scored by a player of the opposite gender of the person who just scored.' },
  { name: 'One-Handed Wonder', description: 'One player on the opposing team must play with one hand behind their back for the next rally.' },
  { name: 'Rally Stopper', description: 'Your team can choose to end a rally and replay the point, once per game.' },
  { name: 'Ace In The Hole', description: 'If your team serves an ace, you get 3 points instead of 1.' },
  { name: 'The Wall', description: "For the next rally, your team's blocks are worth 2 points." },
  { name: 'Butterfingers', description: 'The opposing team is not allowed to set the ball for the next two rallies (must bump-set).' },
  { name: 'Vampire', description: 'Steal one point from the opposing team and add it to your score.' },
  { name: 'Frozen', description: 'Pick a player on the other team. They cannot jump for the next rally.' },
  { name: 'Mimic', description: 'For the next rally, the opposing team must mimic your team\'s formation.' },
  { name: 'Double Trouble', description: 'For the next rally, your team is allowed to have two contacts in a row by the same player.' },
  { name: 'Low Ceiling', description: 'For the next rally, the opposing team is not allowed to send the ball over the net above the height of the antennae.' },
  { name: 'Friendly Fire', description: 'Your team can get a point if the opposing team has a miscommunication and two players run into each other.' },
  { name: 'Serve Swap', description: 'You may force any player on the opposing team to serve for the next point.' },
];

const cosmicScrambleRules: PowerUp[] = [
    { name: 'Birthday Swap', description: 'The two players (one from each team) whose birthday is closest to today must swap teams.' },
    { name: 'Alphabetical Swap', description: 'The player whose first name comes last alphabetically on the losing team swaps with the player whose first name comes last alphabetically on the other team.' },
    { name: 'Brightest Shirt Swap', description: 'Of all the players on both teams, the two wearing the brightest color shirts must swap.' },
    { name: 'Sibling Swap', description: 'The player with the most siblings on the losing team swaps places with the player with the most siblings on the other team.' },
    { name: 'Traveler Swap', description: 'The two players (one from each team) who traveled the farthest to get to the tournament must swap teams.' },
    { name: 'Longest Last Name Swap', description: 'The player with the most letters in their last name on the losing team swaps with the player with the most letters in their last name on the other team.' },
    { name: 'Newest Shoes Swap', description: 'The two players (one from each team) with the newest-looking shoes must swap.' },
    { name: 'Concert Goer Swap', description: 'The player who most recently went to a concert on the losing team swaps with the player who most recently went to a concert on the other team.' },
    { name: 'Longest Hair Swap', description: 'The two players (one from each team) with the longest hair must swap.' },
    { name: 'Most Vowels Swap', description: 'The player with the most vowels in their first name on the losing team swaps with the player with the most vowels in their first name on the other team.' },
    { name: 'Car Brand Swap', description: 'The two players (one from each team) who own the same brand of car must swap.' },
    { name: 'Early Bird Swap', description: 'The player who woke up the earliest this morning on the losing team swaps places with the player who woke up the earliest on the other team.' },
    { name: 'Tallest Swap', description: 'The two players (one from each team) who are the tallest must swap.' },
    { name: 'Restaurant Swap', description: 'The player who last ate at a restaurant on the losing team swaps with the player who last ate at a restaurant on the other team.' },
    { name: 'Pet Swap', description: 'The two players (one from each team) with the most unique or unusual pet must swap.' },
    { name: 'Volleyball Veteran Swap', description: 'The player who has been playing volleyball for the longest number of years on the losing team swaps with their counterpart on the other team.' },
    { name: 'Blue Clothing Swap', description: 'The two players (one from each team) with the most blue on their clothing must swap.' },
    { name: 'Language Swap', description: 'The player who can speak another language on the losing team swaps with the player who can speak another language on the other team (if one exists on both teams).' },
    { name: 'Birth Month Swap', description: 'The two players (one from each team) who share the same birth month must swap (if applicable).' },
    { name: 'Movie Goer Swap', description: 'The player who last watched a movie in a theater on the losing team swaps places with the player who last did the same on the other team.' },
];


interface PlayerContextType {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  togglePlayerPresence: (playerId: string) => void;
  updatePlayer: (player: Player) => Promise<boolean>;
  addPlayer: (player: Omit<Player, 'id' | 'present'>) => Promise<boolean>;
  deletePlayer: (playerId: string) => Promise<boolean>;
  isLoading: boolean;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  schedule: Match[];
  setSchedule: React.Dispatch<React.SetStateAction<Match[]>>;
  gameFormat: GameFormat;
  setGameFormat: React.Dispatch<React.SetStateAction<GameFormat>>;
  gameVariant: GameVariant;
  setGameVariant: React.Dispatch<React.SetStateAction<GameVariant>>;
  handleSetGameVariant: (variant: GameVariant) => void;
  activeRule: PowerUp | null;
  setActiveRule: React.Dispatch<React.SetStateAction<PowerUp | null>>;
  pointsToWin: number;
  setPointsToWin: React.Dispatch<React.SetStateAction<number>>;
  publishSettings: () => void;
  allPowerUps: PowerUp[];
  cosmicScrambleRules: PowerUp[];
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Match[]>([]);
  const [gameFormat, setGameFormat] = useState<GameFormat>('king-of-the-court');
  const [gameVariant, setGameVariant] = useState<GameVariant>('standard');
  const [activeRule, setActiveRule] = useState<PowerUp | null>(null);
  const [pointsToWin, setPointsToWin] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [playerResult, publishedDataResult] = await Promise.all([
                getPlayers(),
                getPublishedData()
            ]);

            if (playerResult.success && playerResult.data) {
                setPlayers(playerResult.data);
            } else {
                 toast({
                    title: "Error fetching players",
                    description: playerResult.error || "Could not load player data.",
                    variant: 'destructive',
                });
            }

            if (publishedDataResult.success && publishedDataResult.data) {
                const { teams, format, schedule, activeRule, pointsToWin } = publishedDataResult.data;
                setTeams(teams || []);
                setSchedule(schedule || []);
                setActiveRule(activeRule || null);
                setPointsToWin(pointsToWin || 15);
                
                // Handle complex format state
                if (format === 'monarch-of-the-court' || format === 'king-s-ransom' || format === 'power-up-round' || format === 'standard') {
                    setGameFormat('king-of-the-court');
                    setGameVariant(format);
                } else if (format) {
                    setGameFormat(format as GameFormat);
                    setGameVariant('standard');
                }

            } else {
                 toast({
                    title: "Error fetching settings",
                    description: publishedDataResult.error || "Could not load tournament settings.",
                    variant: 'destructive',
                });
            }

        } catch (error) {
             toast({
                title: "Failed to load initial data",
                description: "There was an error loading data from the server.",
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [toast]);


  const togglePlayerPresence = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const newPresence = !player.present;

    // Optimistically update the UI
    setPlayers(currentPlayers =>
      currentPlayers.map(p =>
        p.id === playerId ? { ...p, present: newPresence } : p
      )
    );
    
    // Then, make the server call
    const result = await updatePlayerPresence(playerId, newPresence);
    
    if (!result.success) {
      // If the server call fails, revert the change and show an error
      toast({
        title: "Update Failed",
        description: "Could not save presence change. Please try again.",
        variant: "destructive"
      });
      setPlayers(currentPlayers =>
        currentPlayers.map(p =>
          p.id === playerId ? { ...p, present: !newPresence } : p
        )
      );
    }
  };

  const handleUpdatePlayer = async (playerToUpdate: Player) => {
    const originalPlayers = players;
    // Optimistically update the UI
    setPlayers(currentPlayers =>
      currentPlayers.map(p =>
        p.id === playerToUpdate.id ? playerToUpdate : p
      )
    );

    const result = await updatePlayer(playerToUpdate);

    if (result.success) {
      toast({
        title: "Player Updated",
        description: `${playerToUpdate.name}'s information has been saved.`
      });
      return true;
    } else {
      // Revert on failure
      setPlayers(originalPlayers);
      toast({
        title: "Update Failed",
        description: result.error || "Could not save player changes.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleAddPlayer = async (playerToAdd: Omit<Player, 'id' | 'present'>) => {
    const tempId = `temp-${Date.now()}`;
    const newPlayer: Player = { ...playerToAdd, id: tempId, present: true };

    setPlayers(current => [...current, newPlayer]);
    
    const result = await addPlayer(playerToAdd);

    if (result.success && result.data) {
        setPlayers(result.data);
        toast({
            title: "Player Added",
            description: `${playerToAdd.name} has been added to the roster.`
        });
        return true;
    } else {
        setPlayers(current => current.filter(p => p.id !== tempId));
        toast({
            title: "Failed to Add Player",
            description: result.error || "Could not save the new player.",
            variant: "destructive"
        });
        return false;
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    const originalPlayers = players;
    setPlayers(current => current.filter(p => p.id !== playerId));

    const result = await deletePlayer(playerId);

    if (result.success) {
        toast({
            title: "Player Deleted",
            description: "The player has been removed from the roster."
        });
        return true;
    } else {
        setPlayers(originalPlayers);
        toast({
            title: "Failed to Delete Player",
            description: result.error || "Could not delete the player.",
            variant: "destructive"
        });
        return false;
    }
  };

  const publishSettings = useCallback(async () => {
    let finalFormat: GameFormat | GameVariant = gameFormat;
    if (gameFormat === 'king-of-the-court' && gameVariant !== 'standard') {
        finalFormat = gameVariant;
    }

    const result = await publishData(teams, finalFormat, schedule, activeRule, pointsToWin);
    
    if (result.success) {
      toast({
        title: 'Settings Published!',
        description: 'The public dashboard has been updated with the latest settings.',
      });
    } else {
      toast({
        title: 'Publishing Error',
        description: result.error || 'Could not publish the new settings.',
        variant: 'destructive',
      });
    }
  }, [gameFormat, gameVariant, teams, schedule, activeRule, pointsToWin, toast]);

  const handleSetGameVariant = (variant: GameVariant) => {
    setGameVariant(variant);
    let ruleSet: PowerUp[] | null = null;
    let toastTitle = '';

    if (variant === 'power-up-round') {
      ruleSet = allPowerUps;
      toastTitle = 'New Power-Up Generated!';
    } else if (variant === 'king-s-ransom') {
      ruleSet = cosmicScrambleRules;
      toastTitle = 'New Cosmic Scramble Rule!';
    }

    if (ruleSet) {
      // Use a timeout to ensure this runs on the client and avoids hydration issues
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * (ruleSet as PowerUp[]).length);
        const newRule = (ruleSet as PowerUp[])[randomIndex];
        setActiveRule(newRule);
        toast({
          title: toastTitle,
          description: `"${newRule.name}" is now the active rule.`,
        });
      }, 50);
    } else {
        // If the variant doesn't use rules, clear the active rule
        setActiveRule(null);
    }
  };


  const value = {
    players,
    setPlayers,
    togglePlayerPresence,
    updatePlayer: handleUpdatePlayer,
    addPlayer: handleAddPlayer,
    deletePlayer: handleDeletePlayer,
    isLoading,
    teams,
    setTeams,
    schedule,
    setSchedule,
    gameFormat,
    setGameFormat,
    gameVariant,
    setGameVariant,
    handleSetGameVariant,
    activeRule,
    setActiveRule,
    pointsToWin,
    setPointsToWin,
    publishSettings,
    allPowerUps,
    cosmicScrambleRules,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
}
