
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { Team, GameFormat, GameVariant, Match, PowerUp, Player, PlayerPresence, Handicap } from '@/types';

type PublishedData = {
    teams: Team[];
    format: GameFormat | GameVariant;
    schedule: Match[];
    activeRule: PowerUp | null;
    pointsToWin: number;
    players?: Player[]; // Players can now be part of the main DB
    levelUpHandicaps?: Handicap[];
};

// Use a JSON file as a simple database for this prototype.
const dbPath = path.join(process.cwd(), 'db.json');
const playersDbPath = path.join(process.cwd(), 'players.json');


async function readPlayersDb(): Promise<Player[]> {
    try {
        const data = await fs.readFile(playersDbPath, 'utf-8');
        const players = JSON.parse(data);

        // Data migration: handle old format
        return players.map((player: any) => {
            if (typeof player.present === 'boolean') {
                return {
                    ...player,
                    presence: player.present ? 'Present' : 'Pending',
                    present: undefined, // remove old key
                };
            }
            return player;
        });

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // If the file doesn't exist, return an empty array
            return [];
        }
        console.error('Error reading from Players DB:', error);
        throw error;
    }
}

async function writePlayersDb(players: Player[]): Promise<void> {
    try {
        // Before writing, ensure old 'present' key is removed
        const playersToWrite = players.map(({ present, ...rest }: any) => rest);
        await fs.writeFile(playersDbPath, JSON.stringify(playersToWrite, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing to Players DB:', error);
        throw error;
    }
}


async function readDb(): Promise<PublishedData> {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        const parsedData = JSON.parse(data);
        // Provide default for pointsToWin if not present
        if (!('pointsToWin' in parsedData)) {
            parsedData.pointsToWin = 15;
        }
        return parsedData;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // If the file doesn't exist, return a default structure
            return { teams: [], format: 'king-of-the-court', schedule: [], activeRule: null, pointsToWin: 15, levelUpHandicaps: [] };
        }
        console.error('Error reading from DB:', error);
        throw error;
    }
}

async function writeDb(data: PublishedData): Promise<void> {
    try {
        await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing to DB:', error);
        throw error;
    }
}


export async function getPlayers(): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const players = await readPlayersDb();
        return { success: true, data: players };
    } catch (error) {
        console.error('Get Players Error:', error);
        return { success: false, error: 'Failed to retrieve players.' };
    }
}

export async function addPlayer(player: Omit<Player, 'id' | 'presence'>): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const players = await readPlayersDb();
        const newPlayer: Player = {
            ...player,
            id: new Date().toISOString(), // Simple unique ID
            presence: 'Present',
        };
        const updatedPlayers = [...players, newPlayer];
        await writePlayersDb(updatedPlayers);
        return { success: true, data: updatedPlayers };
    } catch (error) {
        console.error('Add Player Error:', error);
        return { success: false, error: 'Failed to add player.' };
    }
}

export async function importPlayers(newPlayers: Omit<Player, 'id' | 'presence'>[]): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const existingPlayers = await readPlayersDb();
        const playersToAdd: Player[] = newPlayers.map(p => ({
            ...p,
            id: new Date().toISOString() + Math.random(), // Simple unique ID
            presence: 'Pending',
        }));
        const updatedPlayers = [...existingPlayers, ...playersToAdd];
        await writePlayersDb(updatedPlayers);
        return { success: true, data: updatedPlayers };
    } catch (error) {
        console.error('Import Players Error:', error);
        return { success: false, error: 'Failed to import players.' };
    }
}

export async function updatePlayer(updatedPlayer: Player): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const players = await readPlayersDb();
        const updatedPlayers = players.map(p => 
            p.id === updatedPlayer.id ? updatedPlayer : p
        );
        await writePlayersDb(updatedPlayers);
        return { success: true, data: updatedPlayers };
    } catch (error) {
        console.error('Update Player Error:', error);
        return { success: false, error: 'Failed to update player.' };
    }
}

export async function deletePlayer(playerId: string): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        let players = await readPlayersDb();
        players = players.filter(p => p.id !== playerId);
        await writePlayersDb(players);
        
        // Also remove player from any teams they were on in db.json
        const dbData = await readDb();
        const updatedTeams = dbData.teams.map(team => ({
            ...team,
            players: team.players.filter(p => p.id !== playerId)
        }));
        await writeDb({ ...dbData, teams: updatedTeams });


        return { success: true, data: players };
    } catch (error) {
        console.error('Delete Player Error:', error);
        return { success: false, error: 'Failed to delete player.' };
    }
}

export async function deleteAllPlayers(): Promise<{ success: boolean; error?: string }> {
    try {
        // Clear players.json
        await writePlayersDb([]);
        
        // Clear players from teams in db.json
        const dbData = await readDb();
        const updatedTeams = dbData.teams.map(team => ({ ...team, players: [] }));
        await writeDb({ ...dbData, teams: updatedTeams });

        return { success: true };
    } catch (error) {
        console.error('Delete All Players Error:', error);
        return { success: false, error: 'Failed to delete all players.' };
    }
}

export async function updatePlayerPresence(playerId: string, presence: PlayerPresence): Promise<{ success: boolean; error?: string }> {
    try {
        const players = await readPlayersDb();
        const updatedPlayers = players.map(p => 
            p.id === playerId ? { ...p, presence } : p
        );
        await writePlayersDb(updatedPlayers);
        return { success: true };
    } catch (error) {
        console.error('Update Player Presence Error:', error);
        return { success: false, error: 'Failed to update player presence.' };
    }
}

export async function resetAllPlayerPresence(): Promise<{ success: boolean; error?: string }> {
    try {
        const players = await readPlayersDb();
        const updatedPlayers = players.map(p => ({ ...p, presence: 'Pending' as PlayerPresence }));
        await writePlayersDb(updatedPlayers);
        return { success: true };
    } catch (error) {
        console.error('Reset All Player Presence Error:', error);
        return { success: false, error: 'Failed to reset all players to pending.' };
    }
}

export async function publishData(teams: Team[], format: GameFormat | GameVariant, schedule: Match[], activeRule: PowerUp | null, pointsToWin: number, levelUpHandicaps?: Handicap[]) {
    try {
        console.log('Publishing data:', { teams, format, schedule, activeRule, pointsToWin, levelUpHandicaps });
        // Read the existing data first to avoid overwriting unrelated fields
        const currentData = await readDb();
        
        const dataToPublish: PublishedData = {
            ...currentData, // Preserve existing data
            teams,
            format,
            schedule,
            activeRule,
            pointsToWin,
            levelUpHandicaps: levelUpHandicaps || currentData.levelUpHandicaps,
        };

        await writeDb(dataToPublish);
        return { success: true, message: 'Teams, format, and schedule published successfully!' };
    } catch (error) {
        console.error('Publish Data Error:', error);
        return { success: false, error: 'Failed to publish data.' };
    }
}

export async function getPublishedData() {
    try {
        const data = await readDb();
        return { success: true, data };
    } catch (error) {
        console.error('Get Published Data Error:', error);
        return { success: false, error: 'Failed to retrieve data.' };
    }
}
