
'use client';

import type { Player, Team, Match, GameFormat, GameVariant, PowerUp } from '@/types';
import React, { createContext, useContext, useState, type ReactNode } from 'react';

// Using a simple in-memory store for the prototype.
// In a real application, you might use a database or a server-side store.
const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'Cole Deaver', gender: 'Guy', skill: 6, present: true },
  { id: '2', name: 'Melissa Roy', gender: 'Gal', skill: 6, present: true },
  { id: '3', name: 'Kristin Drinka', gender: 'Gal', skill: 7, present: true },
  { id: '4', name: 'Kyle Novak', gender: 'Guy', skill: 9, present: true },
  { id: '5', name: 'Nicole Malone', gender: 'Gal', skill: 5, present: true },
  { id: '6', name: 'Heidi Kempert', gender: 'Gal', skill: 4, present: true },
  { id: '7', name: 'Brian Kempert', gender: 'Guy', skill: 8, present: true },
  { id: '8', name: 'Abby Gilpin', gender: 'Gal', skill: 6, present: true },
  { id: '9', name: 'Miranda Griego', gender: 'Gal', skill: 3, present: true },
  { id: '10', name: 'Jonathan Bradley', gender: 'Guy', skill: 5, present: true },
  { id: '11', name: 'Aditya Singh', gender: 'Guy', skill: 7, present: true },
  { id: '12', name: 'Giovanni Salvatore', gender: 'Guy', skill: 7, present: true },
  { id: '13', name: 'Emily Victoria', gender: 'Gal', skill: 6, present: true },
  { id: '14', name: 'Eric Ahrens', gender: 'Guy', skill: 7, present: true },
  { id: '15', name: 'Stephen Jaqua', gender: 'Guy', skill: 4, present: true },
  { id: '16', name: 'Lindsey Victoria', gender: 'Gal', skill: 7, present: true },
  { id: '17', name: 'Shaylyn Murphy', gender: 'Gal', skill: 8, present: true },
  { id: '18', name: 'William Van Meter', gender: 'Guy', skill: 3, present: true },
  { id: '19', name: 'Colleen Palman', gender: 'Gal', skill: 2, present: true },
  { id: '20', name: 'Rachel Nystrom', gender: 'Gal', skill: 8, present: true },
  { id: '21', name: 'Pat Sobotka', gender: 'Guy', skill: 6, present: true },
  { id: '22', name: 'Jasona Jones', gender: 'Gal', skill: 1, present: true },
  { id: '23', name: 'Joy Swasy', gender: 'Gal', skill: 6, present: true },
  { id: '24', name: 'Jesica Bullrich', gender: 'Gal', skill: 2, present: true },
  { id: '25', name: 'Lauren Hopkins', gender: 'Gal', skill: 6, present: true },
  { id: '26', name: 'Matt Taylor', gender: 'Guy', skill: 7, present: true },
  { id: '27', name: 'Alaina McCoy', gender: 'Gal', skill: 4, present: true },
  { id: '28', name: 'Alexandra Broskey', gender: 'Gal', skill: 6, present: true },
];

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
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Match[]>([]);
  const [gameFormat, setGameFormat] = useState<GameFormat>('king-of-the-court');
  const [gameVariant, setGameVariant] = useState<GameVariant>('standard');
  const [activeRule, setActiveRule] = useState<PowerUp | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Can be used for async operations later

  const togglePlayerPresence = (playerId: string) => {
    setPlayers(currentPlayers =>
      currentPlayers.map(p =>
        p.id === playerId ? { ...p, present: !p.present } : p
      )
    );
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
