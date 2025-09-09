
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { simulateLeagueStandings, type SimulateLeagueStandingsInput } from '@/ai/flows/simulate-league-standings';
import type { Team, GameFormat, GameVariant, Match, PowerUp } from '@/types';

type PublishedData = {
    teams: Team[];
    format: GameFormat | GameVariant;
    schedule: Match[];
    activeRule: PowerUp | null;
};

// Use a JSON file as a simple database for this prototype.
const dbPath = path.join(process.cwd(), 'db.json');

async function readDb(): Promise<PublishedData> {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // If the file doesn't exist, return a default structure
            return { teams: [], format: 'king-of-the-court', schedule: [], activeRule: null };
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

export async function getSimulatedStandings(input: SimulateLeagueStandingsInput) {
    try {
        const result = await simulateLeagueStandings(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('AI Simulation Error:', error);
        return { success: false, error: 'Failed to simulate standings due to an internal error.' };
    }
}

export async function publishData(teams: Team[], format: GameFormat | GameVariant, schedule: Match[], activeRule: PowerUp | null) {
    try {
        console.log('Publishing data:', { teams, format, schedule, activeRule });
        const dataToPublish: PublishedData = { teams, format, schedule, activeRule };
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
