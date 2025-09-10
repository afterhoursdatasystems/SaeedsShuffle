'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { simulateLeagueStandings, type SimulateLeagueStandingsInput } from '@/ai/flows/simulate-league-standings';
import type { Team, GameFormat, GameVariant, Match, PowerUp, Player } from '@/types';

type PublishedData = {
    teams: Team[];
    format: GameFormat | GameVariant;
    schedule: Match[];
    activeRule: PowerUp | null;
    pointsToWin: number;
    players?: Player[]; // Players can now be part of the main DB
};

// Use a JSON file as a simple database for this prototype.
const dbPath = path.join(process.cwd(), 'db.json');
const playersDbPath = path.join(process.cwd(), 'players.json');


async function readPlayersDb(): Promise<Player[]> {
    try {
        const data = await fs.readFile(playersDbPath, 'utf-8');
        return JSON.parse(data);
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
        await fs.writeFile(playersDbPath, JSON.stringify(players, null, 2), 'utf-8');
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
            return { teams: [], format: 'king-of-the-court', schedule: [], activeRule: null, pointsToWin: 15 };
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

export async function addPlayer(player: Omit<Player, 'id' | 'present'>): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const players = await readPlayersDb();
        const newPlayer: Player = {
            ...player,
            id: new Date().toISOString(), // Simple unique ID
            present: true,
        };
        const updatedPlayers = [...players, newPlayer];
        await writePlayersDb(updatedPlayers);
        return { success: true, data: updatedPlayers };
    } catch (error) {
        console.error('Add Player Error:', error);
        return { success: false, error: 'Failed to add player.' };
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
        const players = await readPlayersDb();
        const updatedPlayers = players.filter(p => p.id !== playerId);
        await writePlayersDb(updatedPlayers);
        return { success: true, data: updatedPlayers };
    } catch (error) {
        console.error('Delete Player Error:', error);
        return { success: false, error: 'Failed to delete player.' };
    }
}

export async function updatePlayerPresence(playerId: string, present: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const players = await readPlayersDb();
        const updatedPlayers = players.map(p => 
            p.id === playerId ? { ...p, present } : p
        );
        await writePlayersDb(updatedPlayers);
        return { success: true };
    } catch (error) {
        console.error('Update Player Presence Error:', error);
        return { success: false, error: 'Failed to update player presence.' };
    }
}

export async function getSimulatedStandings(input: SimulateLeagueStandingsInput) {
    try {
        const result = await simulateLeagueStandings(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('AI Simulation Error:', error);
        return { success: false, error: 'Failed to simulate standings due to an internal error.' };
    }
}

export async function publishData(teams: Team[], format: GameFormat | GameVariant, schedule: Match[], activeRule: PowerUp | null, pointsToWin: number) {
    try {
        console.log('Publishing data:', { teams, format, schedule, activeRule, pointsToWin });
        const dataToPublish: PublishedData = { teams, format, schedule, activeRule, pointsToWin };
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
