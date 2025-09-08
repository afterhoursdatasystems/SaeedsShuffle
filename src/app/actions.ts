'use server';

import { simulateLeagueStandings, type SimulateLeagueStandingsInput } from '@/ai/flows/simulate-league-standings';
import type { Team } from '@/types';

// Using a simple in-memory store for this prototype.
// In a real application, you would use a database.
let publishedTeams: Team[] = [];

export async function getSimulatedStandings(input: SimulateLeagueStandingsInput) {
    try {
        const result = await simulateLeagueStandings(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('AI Simulation Error:', error);
        return { success: false, error: 'Failed to simulate standings due to an internal error.' };
    }
}

export async function publishTeams(teams: Team[]) {
    try {
        publishedTeams = teams;
        return { success: true, message: 'Teams published successfully!' };
    } catch (error) {
        console.error('Publish Teams Error:', error);
        return { success: false, error: 'Failed to publish teams.' };
    }
}

export async function getPublishedTeams() {
    try {
        return { success: true, data: publishedTeams };
    } catch (error) {
        console.error('Get Published Teams Error:', error);
        return { success: false, error: 'Failed to retrieve teams.' };
    }
}
