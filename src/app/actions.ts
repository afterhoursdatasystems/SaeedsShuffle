
'use server';

import { simulateLeagueStandings, type SimulateLeagueStandingsInput } from '@/ai/flows/simulate-league-standings';
import type { Team, GameFormat, Match, GameVariant, PowerUp } from '@/types';

// Using a simple in-memory store for this prototype.
// In a real application, you would use a database.
let publishedData: { teams: Team[], format: GameFormat | GameVariant, schedule: Match[], activeRule: PowerUp | null } = {
    teams: [],
    format: 'king-of-the-court',
    schedule: [],
    activeRule: null,
};

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
        publishedData = { teams, format, schedule, activeRule };
        return { success: true, message: 'Teams, format, and schedule published successfully!' };
    } catch (error) {
        console.error('Publish Data Error:', error);
        return { success: false, error: 'Failed to publish data.' };
    }
}

export async function getPublishedData() {
    try {
        return { success: true, data: publishedData };
    } catch (error) {
        console.error('Get Published Data Error:', error);
        return { success: false, error: 'Failed to retrieve data.' };
    }
}
