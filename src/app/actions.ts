
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
            // Convert the object of players into an array and add the id
            const playersArray = Object.keys(playersObject).map(key => ({
                id: key,
                ...playersObject[key],
                present: playersObject[key].present ?? false // ensure presence has a default
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
        // Create the player object to be saved, ensuring `present` defaults to true
        const newPlayerData = {
            ...player,
            present: true,
        };
        await newPlayerRef.set(newPlayerData);
        
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
    console.log(`[SERVER ACTION] deletePlayer called for playerId: ${playerId}`);
    try {
        // First, get the current published data to get the teams
        const publishedDataResult = await getPublishedData();
        if (!publishedDataResult.success || !publishedDataResult.data) {
            console.error('[SERVER ACTION] Failed to get published data before deleting player.');
            return { success: false, error: 'Could not retrieve team data to update.' };
        }
        
        const { teams, format, schedule, activeRule, pointsToWin } = publishedDataResult.data;

        // Now, remove the player from the /players node
        await db.ref(`players/${playerId}`).remove();
        console.log(`[SERVER ACTION] Player ${playerId} removed from /players node.`);
        
        let updatedTeams = teams || [];
        if (updatedTeams.length > 0) {
            // Filter the deleted player out of all teams
            updatedTeams = updatedTeams.map(team => ({
                ...team,
                players: team.players.filter(p => p.id !== playerId)
            })).filter(team => team.players.length > 0); // Optional: remove empty teams

            // Publish the updated data back to the database
            await publishData(updatedTeams, format, schedule, activeRule, pointsToWin);
            console.log('[SERVER ACTION] Published data updated after player deletion.');
        }

        // Finally, get the fresh list of all players
        const allPlayers = await getPlayers();
        console.log('[SERVER ACTION] deletePlayer finished successfully.');
        return { success: true, data: allPlayers.data };

    } catch (error) {
        console.error('[SERVER ACTION] Delete Player Error:', error);
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
        
        // Provide defaults for a completely empty database
        const saneData: PublishedData = {
            teams: data?.teams || [],
            format: data?.format || 'king-of-the-court',
            schedule: data?.schedule || [],
            activeRule: data?.activeRule || null,
            pointsToWin: data?.pointsToWin || 15,
        };
        return { success: true, data: saneData };
       
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
