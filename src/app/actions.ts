
'use server';

import { db } from '@/lib/firebase';
import { simulateLeagueStandings, type SimulateLeagueStandingsInput } from '@/ai/flows/simulate-league-standings';
import type { Team, GameFormat, GameVariant, Match, PowerUp, Player } from '@/types';

type PublishedData = {
    teams: Team[];
    format: GameFormat | GameVariant;
    schedule: Match[];
    activeRule: PowerUp | null;
    pointsToWin: number;
};

// --- Player Data Actions ---

export async function getPlayers(): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const snapshot = await db.ref('players').once('value');
        const playersObject = snapshot.val();
        if (playersObject) {
            // Convert the object of players into an array
            const playersArray = Object.keys(playersObject).map(key => ({
                id: key,
                ...playersObject[key]
            }));
            return { success: true, data: playersArray };
        }
        return { success: true, data: [] }; // Return empty array if no players exist
    } catch (error) {
        console.error('Get Players Error:', error);
        return { success: false, error: 'Failed to retrieve players from the database.' };
    }
}

export async function addPlayer(player: Omit<Player, 'id' | 'present'>): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const newPlayerRef = db.ref('players').push();
        const newPlayer = {
            ...player,
            id: newPlayerRef.key,
            present: true,
        };
        await newPlayerRef.set(player); // Don't store id and present in the object itself
        
        const allPlayers = await getPlayers();
        return { success: true, data: allPlayers.data };

    } catch (error) {
        console.error('Add Player Error:', error);
        return { success: false, error: 'Failed to add player to the database.' };
    }
}

export async function updatePlayer(updatedPlayer: Player): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const { id, ...playerData } = updatedPlayer;
        await db.ref(`players/${id}`).update(playerData);
        
        const allPlayers = await getPlayers();
        return { success: true, data: allPlayers.data };
    } catch (error) {
        console.error('Update Player Error:', error);
        return { success: false, error: 'Failed to update player in the database.' };
    }
}

export async function deletePlayer(playerId: string): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        await db.ref(`players/${playerId}`).remove();
        
        // Also remove player from any teams they were on
        const publishedData = await getPublishedData();
        if (publishedData.success && publishedData.data) {
            const updatedTeams = publishedData.data.teams.map(team => ({
                ...team,
                players: team.players.filter(p => p.id !== playerId)
            }));
            await publishData(updatedTeams, publishedData.data.format, publishedData.data.schedule, publishedData.data.activeRule, publishedData.data.pointsToWin);
        }

        const allPlayers = await getPlayers();
        return { success: true, data: allPlayers.data };
    } catch (error) {
        console.error('Delete Player Error:', error);
        return { success: false, error: 'Failed to delete player from the database.' };
    }
}

export async function updatePlayerPresence(playerId: string, present: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        await db.ref(`players/${playerId}/present`).set(present);
        return { success: true };
    } catch (error) {
        console.error('Update Player Presence Error:', error);
        return { success: false, error: 'Failed to update player presence in the database.' };
    }
}


// --- Published Tournament Data Actions ---

export async function publishData(teams: Team[], format: GameFormat | GameVariant, schedule: Match[], activeRule: PowerUp | null, pointsToWin: number) {
    try {
        const dataToPublish: PublishedData = {
            teams: teams || [],
            format: format || 'king-of-the-court',
            schedule: schedule || [],
            activeRule: activeRule || null,
            pointsToWin: pointsToWin || 15,
        };
        await db.ref('publishedData').set(dataToPublish);
        return { success: true, message: 'Teams, format, and schedule published successfully!' };
    } catch (error) {
        console.error('Publish Data Error:', error);
        return { success: false, error: 'Failed to publish data to the database.' };
    }
}

export async function getPublishedData(): Promise<{ success: boolean; data?: PublishedData; error?: string }> {
    try {
        const snapshot = await db.ref('publishedData').once('value');
        const data = snapshot.val();
        if (data) {
             // Provide defaults for fields that might be missing from the DB
            const saneData: PublishedData = {
                teams: data.teams || [],
                format: data.format || 'king-of-the-court',
                schedule: data.schedule || [],
                activeRule: data.activeRule || null,
                pointsToWin: data.pointsToWin || 15,
            };
            return { success: true, data: saneData };
        }
        // If no data, return a default structure
        return { 
            success: true, 
            data: { 
                teams: [], 
                format: 'king-of-the-court', 
                schedule: [], 
                activeRule: null, 
                pointsToWin: 15 
            } 
        };
    } catch (error) {
        console.error('Get Published Data Error:', error);
        return { success: false, error: 'Failed to retrieve data from the database.' };
    }
}

// --- AI Flow Actions ---

export async function getSimulatedStandings(input: SimulateLeagueStandingsInput) {
    try {
        const result = await simulateLeagueStandings(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('AI Simulation Error:', error);
        return { success: false, error: 'Failed to simulate standings due to an internal error.' };
    }
}
