
'use client';

import type { Player, Team, Match, GameFormat, GameVariant, PowerUp } from '@/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { getPlayers, updatePlayerPresence, getPublishedData } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface PlayerContextType {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  togglePlayerPresence: (playerId: string) => void;
  isLoading: boolean;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  schedule: Match[];
  setSchedule: React.Dispatch<React.SetStateAction<Match[]>>;
  gameFormat: GameFormat;
  setGameFormat: React.Dispatch<React.SetStateAction<GameFormat>>;
  gameVariant: GameVariant;
  setGameVariant: React.Dispatch<React.SetStateAction<GameVariant>>;
  activeRule: PowerUp | null;
  setActiveRule: React.Dispatch<React.SetStateAction<PowerUp | null>>;
  pointsToWin: number;
  setPointsToWin: React.Dispatch<React.SetStateAction<number>>;
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
                } else {
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

  const value = {
    players,
    setPlayers,
    togglePlayerPresence,
    isLoading,
    teams,
    setTeams,
    schedule,
    setSchedule,
    gameFormat,
    setGameFormat,
    gameVariant,
    setGameVariant,
    activeRule,
    setActiveRule,
    pointsToWin,
    setPointsToWin,
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
