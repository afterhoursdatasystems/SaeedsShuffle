
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { Team, GameFormat, GameVariant, Match, PowerUp, Player, PlayerPresence, Handicap } from '@/types';

type PublishedData = {
    teams: Team[];
    format: GameFormat | GameVariant;
    activeRule: PowerUp | null;
    pointsToWin: number;
    levelUpHandicaps?: Handicap[];
};

// Use separate JSON files for different data types.
const dbPath = path.join(process.cwd(), 'db.json');
const playersDbPath = path.join(process.cwd(), 'players.json');
const scheduleDbPath = path.join(process.cwd(), 'schedule.json');


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
            return [];
        }
        console.error('Error reading from Players DB:', error);
        throw error;
    }
}

async function writePlayersDb(players: Player[]): Promise<void> {
    try {
        const playersToWrite = players.map(({ present, ...rest }: any) => rest);
        await fs.writeFile(playersDbPath, JSON.stringify(playersToWrite, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing to Players DB:', error);
        throw error;
    }
}


async function readScheduleDb(): Promise<Match[]> {
    try {
        const data = await fs.readFile(scheduleDbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('Error reading from Schedule DB:', error);
        throw error;
    }
}

async function writeScheduleDb(schedule: Match[]): Promise<void> {
    try {
        await fs.writeFile(scheduleDbPath, JSON.stringify(schedule, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing to Schedule DB:', error);
        throw error;
    }
}


async function readDb(): Promise<Omit<PublishedData, 'schedule'>> {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        const parsedData = JSON.parse(data);
        if (!('pointsToWin' in parsedData)) {
            parsedData.pointsToWin = 15;
        }
        // Remove schedule from main db if it exists (for migration)
        if ('schedule' in parsedData) {
            delete parsedData.schedule;
        }
         // Remove players from main db if it exists (for migration)
        if ('players' in parsedData) {
            delete parsedData.players;
        }
        return parsedData;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return { teams: [], format: 'king-of-the-court', activeRule: null, pointsToWin: 15, levelUpHandicaps: [] };
        }
        console.error('Error reading from DB:', error);
        throw error;
    }
}

async function writeDb(data: Omit<PublishedData, 'schedule'>): Promise<void> {
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
            id: new Date().toISOString() + Math.random(),
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
            id: new Date().toISOString() + Math.random(),
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
        await writePlayersDb([]);
        
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
        
        const currentData = await readDb();
        
        const dataToPublish: Omit<PublishedData, 'schedule'> = {
            ...currentData,
            teams,
            format,
            activeRule,
            pointsToWin,
            levelUpHandicaps: levelUpHandicaps || currentData.levelUpHandicaps,
        };

        await writeDb(dataToPublish);
        
        // When publishing, we need to merge the new schedule data with the existing one
        const existingSchedule = await readScheduleDb();
        const scheduleMap = new Map(existingSchedule.map(m => [m.id, m]));
        
        schedule.forEach(match => {
            scheduleMap.set(match.id, match);
        });

        const newSchedule = Array.from(scheduleMap.values());
        
        // If the schedule payload is an empty array, it means we are clearing it.
        if (schedule.length === 0) {
            await writeScheduleDb([]);
        } else {
            await writeScheduleDb(newSchedule);
        }

        return { success: true, message: 'Teams, format, and schedule published successfully!' };
    } catch (error) {
        console.error('Publish Data Error:', error);
        return { success: false, error: 'Failed to publish data.' };
    }
}

export async function getPublishedData(): Promise<{ success: boolean; data?: PublishedData & {schedule: Match[]}; error?: string }> {
    try {
        const settingsData = await readDb();
        const scheduleData = await readScheduleDb();
        const playersData = await readPlayersDb();

        // This function combines all data for the public view.
        // It's important to merge player data correctly into teams if needed,
        // but for now, we'll return players as a separate root property.
        const combinedData = {
            ...settingsData,
            schedule: scheduleData,
            players: playersData
        };

        return { success: true, data: combinedData as any }; // Cast as any to add players
    } catch (error) {
        console.error('Get Published Data Error:', error);
        return { success: false, error: 'Failed to retrieve data.' };
    }
}
