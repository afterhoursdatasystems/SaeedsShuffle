

'use client';

import type { Player, Team, Match, GameFormat, GameVariant, PowerUp, PlayerPresence, Handicap } from '@/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import { getPlayers, updatePlayerPresence, getPublishedData, updatePlayer, addPlayer, deletePlayer, publishData, resetAllPlayerPresence as resetAllPlayerPresenceAction, deleteAllPlayers as deleteAllPlayersAction, importPlayers as importPlayersAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import AllHandicaps from '@/lib/handicaps.json';
import allPowerUps from '@/lib/power-ups.json';
import cosmicScrambleRules from '@/lib/cosmic-scramble-rules.json';


const defaultLevelUpHandicaps = AllHandicaps.map(levelData => {
    return {
        level: levelData.level,
        description: levelData.handicaps[0] // Select the first rule as the default
    };
});


interface PlayerContextType {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  togglePlayerPresence: (playerId: string) => Promise<void>;
  resetAllPlayerPresence: () => Promise<void>;
  updatePlayer: (player: Player) => Promise<boolean>;
  addPlayer: (player: Omit<Player, 'id' | 'presence'>) => Promise<boolean>;
  deletePlayer: (playerId: string) => Promise<boolean>;
  deleteAllPlayers: () => Promise<boolean>;
  importPlayers: (players: Omit<Player, 'id' | 'presence'>[]) => Promise<boolean>;
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
  gamesPerTeam: number;
  setGamesPerTeam: React.Dispatch<React.SetStateAction<number>>;
  gameDuration: number;
  setGameDuration: React.Dispatch<React.SetStateAction<number>>;
  publishSettings: () => void;
  allPowerUps: PowerUp[];
  cosmicScrambleRules: PowerUp[];
  updateTeam: (team: Team) => void;
  levelUpHandicaps: Handicap[];
  setLevelUpHandicaps: React.Dispatch<React.SetStateAction<Handicap[]>>;
  shuffleLevelUpHandicaps: (levelToShuffle?: number) => Promise<void>;
  resetLevelUpHandicapsToDefault: () => Promise<void>;
  loadAllData: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Match[]>([]);
  const [gameFormat, setGameFormat] = useState<GameFormat>('king-of-the-court');
  const [gameVariant, setGameVariant] = useState<GameVariant>('standard');
  const [activeRule, setActiveRule] = useState<PowerUp | null>(null);
  const [pointsToWin, setPointsToWinInternal] = useState<number>(15);
  const [gamesPerTeam, setGamesPerTeam] = useState<number>(4);
  const [gameDuration, setGameDuration] = useState<number>(30);
  const [levelUpHandicaps, setLevelUpHandicaps] = useState<Handicap[]>(defaultLevelUpHandicaps);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const setPointsToWin = useCallback((points: number) => {
    setPointsToWinInternal(points);
    const durationOptions = [15, 20, 25, 30, 35, 40, 45];
    let newDuration = Math.round(points / 5) * 5;
    // Find the closest available duration
    newDuration = durationOptions.reduce((prev, curr) => 
      Math.abs(curr - newDuration) < Math.abs(prev - newDuration) ? curr : prev
    );
    setGameDuration(newDuration);
  }, []);


  const loadAllData = useCallback(async () => {
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
            const { teams, format, schedule, activeRule, pointsToWin, levelUpHandicaps, players: publishedPlayers } = publishedDataResult.data as any;
            setTeams(teams || []);
            setSchedule(schedule || []);
            setActiveRule(activeRule || null);
            setPointsToWin(pointsToWin || 15);
            setLevelUpHandicaps(levelUpHandicaps && levelUpHandicaps.length > 0 ? levelUpHandicaps : defaultLevelUpHandicaps);
            
             if (publishedPlayers) {
                setPlayers(publishedPlayers);
            }
            
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
  }, [toast, setPointsToWin]);


  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  useEffect(() => {
    if (gameFormat === 'level-up' && teams.length > 0 && schedule.length > 0) {
      const teamWins: { [teamName: string]: number } = {};

      // Initialize wins for all teams
      for (const team of teams) {
        teamWins[team.name] = 0;
      }

      // Calculate wins from schedule
      for (const match of schedule) {
        if (match.resultA !== null && match.resultB !== null) {
          if (match.resultA > match.resultB) {
            if (teamWins.hasOwnProperty(match.teamA)) {
              teamWins[match.teamA]++;
            }
          } else if (match.resultB > match.resultA) {
            if (teamWins.hasOwnProperty(match.teamB)) {
              teamWins[match.teamB]++;
            }
          }
        }
      }

      // Update team levels
      const updatedTeams = teams.map(team => ({
        ...team,
        level: (teamWins[team.name] || 0) + 1,
      }));
      
      // Only update state if there's a change to prevent infinite loops
      if (JSON.stringify(updatedTeams) !== JSON.stringify(teams)) {
        setTeams(updatedTeams);
      }
    }
  }, [schedule, gameFormat, teams]);


  const togglePlayerPresence = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const presenceOrder: PlayerPresence[] = ['Pending', 'Present', 'Absent'];
    const currentIndex = presenceOrder.indexOf(player.presence);
    const nextIndex = (currentIndex + 1) % presenceOrder.length;
    const newPresence = presenceOrder[nextIndex];

    // Optimistically update the UI
    setPlayers(currentPlayers =>
      currentPlayers.map(p =>
        p.id === playerId ? { ...p, presence: newPresence } : p
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
          p.id === playerId ? { ...p, presence: player.presence } : p
        )
      );
    }
  };

  const resetAllPlayerPresence = async () => {
    const originalPlayers = [...players];
    // Optimistically update the UI
    setPlayers(currentPlayers =>
      currentPlayers.map(p => ({ ...p, presence: 'Pending' }))
    );

    const result = await resetAllPlayerPresenceAction();

    if (result.success) {
      toast({
        title: "Presence Reset",
        description: "All players have been set to 'Pending'.",
      });
    } else {
      // Revert on failure
      setPlayers(originalPlayers);
      toast({
        title: "Update Failed",
        description: result.error || "Could not update all players.",
        variant: "destructive"
      });
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

  const handleAddPlayer = async (playerToAdd: Omit<Player, 'id' | 'presence'>) => {
    const tempId = `temp-${Date.now()}`;
    const newPlayer: Player = { ...playerToAdd, id: tempId, presence: 'Present' };

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
  
    const handleImportPlayers = async (playersToImport: Omit<Player, 'id' | 'presence'>[]) => {
    const result = await importPlayersAction(playersToImport);

    if (result.success && result.data) {
      setPlayers(result.data);
      toast({
        title: "Import Successful",
        description: `${playersToImport.length} players have been added to the roster.`
      });
      return true;
    } else {
      toast({
        title: "Import Failed",
        description: result.error || "Could not import players.",
        variant: "destructive"
      });
      return false;
    }
  };


  const handleDeletePlayer = async (playerId: string) => {
    const originalPlayers = players;
    const originalTeams = teams;
    setPlayers(current => current.filter(p => p.id !== playerId));
    setTeams(current => current.map(team => ({
        ...team,
        players: team.players.filter(p => p.id !== playerId)
    })));


    const result = await deletePlayer(playerId);

    if (result.success && result.data) {
        setPlayers(result.data);
        toast({
            title: "Player Deleted",
            description: "The player has been removed from all records."
        });
        return true;
    } else {
        setPlayers(originalPlayers);
        setTeams(originalTeams);
        toast({
            title: "Failed to Delete Player",
            description: result.error || "Could not delete the player.",
            variant: "destructive"
        });
        return false;
    }
  };
  
    const handleDeleteAllPlayers = async () => {
    const result = await deleteAllPlayersAction();

    if (result.success) {
      setPlayers([]);
      setTeams(current => current.map(team => ({ ...team, players: [] })));
      toast({
        title: "All Players Deleted",
        description: "The player roster has been cleared."
      });
      return true;
    } else {
      toast({
        title: "Deletion Failed",
        description: result.error || "Could not delete all players.",
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

    const result = await publishData(teams, finalFormat, schedule, activeRule, pointsToWin, levelUpHandicaps);
    
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
  }, [gameFormat, gameVariant, teams, schedule, activeRule, pointsToWin, levelUpHandicaps, toast]);

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

  const updateTeam = (teamToUpdate: Team) => {
    setTeams(currentTeams => 
        currentTeams.map(t => t.id === teamToUpdate.id ? teamToUpdate : t)
    );
  };
  
    const shuffleLevelUpHandicaps = async (levelToShuffle?: number) => {
    let newHandicaps: Handicap[] = [];

    if (levelToShuffle) {
      newHandicaps = levelUpHandicaps.map(handicap => {
        if (handicap.level === levelToShuffle) {
          const levelData = AllHandicaps.find(h => h.level === levelToShuffle);
          if (levelData) {
            const availableHandicaps = levelData.handicaps.filter(h => h !== handicap.description);
            const randomIndex = Math.floor(Math.random() * availableHandicaps.length);
            return {
              ...handicap,
              description: availableHandicaps.length > 0 ? availableHandicaps[randomIndex] : handicap.description
            };
          }
        }
        return handicap;
      });
    } else {
      newHandicaps = AllHandicaps.map(levelData => {
        const randomIndex = Math.floor(Math.random() * levelData.handicaps.length);
        return {
          level: levelData.level,
          description: levelData.handicaps[randomIndex]
        };
      });
    }

    setLevelUpHandicaps(newHandicaps);
    await publishData(teams, gameFormat, schedule, activeRule, pointsToWin, newHandicaps);
  };


  const resetLevelUpHandicapsToDefault = async () => {
    setLevelUpHandicaps(defaultLevelUpHandicaps);
    await publishData(teams, gameFormat, schedule, activeRule, pointsToWin, defaultLevelUpHandicaps);
  };


  const value = {
    players,
    setPlayers,
    togglePlayerPresence,
    resetAllPlayerPresence,
    updatePlayer: handleUpdatePlayer,
    addPlayer: handleAddPlayer,
    deletePlayer: handleDeletePlayer,
    deleteAllPlayers: handleDeleteAllPlayers,
    importPlayers: handleImportPlayers,
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
    gamesPerTeam,
    setGamesPerTeam,
    gameDuration,
    setGameDuration,
    publishSettings,
    allPowerUps,
    cosmicScrambleRules,
    updateTeam,
    levelUpHandicaps,
    setLevelUpHandicaps,
    shuffleLevelUpHandicaps,
    resetLevelUpHandicapsToDefault,
    loadAllData,
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

