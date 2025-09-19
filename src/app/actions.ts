
'use server';

import { db } from '@/lib/firebase';
import { simulateLeagueStandings, type SimulateLeagueStandingsInput } from '@/ai/flows/simulate-league-standings';
import type { Team, GameFormat, GameVariant, Match, PowerUp, Player } from '@/types';
import Papa from 'papaparse';

type PublishedData = {
    teams: Team[];
    format: GameFormat | GameVariant;
    schedule: Match[];
    activeRule: PowerUp | null;
    pointsToWin: number;
};


// --- Player Data Seeding ---
const seedPlayersData: Omit<Player, 'id' | 'present'>[] = [
    { name: "Matt", gender: "Guy", skill: 10 },
    { name: "Saeed", gender: "Guy", skill: 9 },
    { name: "Caitlin", gender: "Gal", skill: 9 },
    { name: "Lauren", gender: "Gal", skill: 8 },
    { name: "Tj", gender: "Guy", skill: 8 },
    { name: "Charlie", gender: "Guy", skill: 8 },
    { name: "Christina", gender: "Gal", skill: 7 },
    { name: "Katie", gender: "Gal", skill: 7 },
    { name: "Andrew", gender: "Guy", skill: 7 },
    { name: "David", gender: "Guy", skill: 6 },
    { name: "Maddie", gender: "Gal", skill: 6 },
    { name: "Megan", gender: "Gal", skill: 6 },
    { name: "Emma", gender: "Gal", skill: 5 },
    { name: "Will", gender: "Guy", skill: 5 },
    { name: "Ashley", gender: "Gal", skill: 5 },
    { name: "Josh", gender: "Guy", skill: 5 },
    { name: "Jason", gender: "Guy", skill: 4 },
    { name: "Alex", gender: "Guy", skill: 4 },
    { name: "Grace", gender: "Gal", skill: 4 },
    { name: "Courtney", gender: "Gal", skill: 4 },
    { name: "Brandon", gender: "Guy", skill: 3 },
    { name: "Olivia", gender: "Gal", skill: 3 },
    { name: "Nick", gender: "Guy", skill: 3 },
    { name: "Hannah", gender: "Gal", skill: 3 },
    { name: "Justin", gender: "Guy", skill: 2 },
    { name: "Rachel", gender: "Gal", skill: 2 },
    { name: "Kevin", gender: "Guy", skill: 2 },
    { name: "Sarah", gender: "Gal", skill: 1 }
];

async function seedDatabase() {
    console.log('Seeding database with initial players...');
    const updates: { [key: string]: Omit<Player, 'id'> } = {};
    seedPlayersData.forEach(player => {
        const newPlayerRef = db.ref('players').push();
        const newPlayerId = newPlayerRef.key;
        if (newPlayerId) {
            updates[`/players/${newPlayerId}`] = { ...player, present: false };
        }
    });
    await db.ref().update(updates);
    console.log('Database seeded successfully.');
}


// --- Player Data Actions ---

export async function getPlayers(): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const snapshot = await db.ref('players').once('value');
        const playersObject = snapshot.val();
        if (playersObject) {
            const playersArray = Object.keys(playersObject).map(key => ({
                id: key,
                ...playersObject[key],
                present: playersObject[key].present ?? false 
            }));
            return { success: true, data: playersArray };
        } else {
             // If no players, seed the database
            await seedDatabase();
            const seededSnapshot = await db.ref('players').once('value');
            const seededPlayersObject = seededSnapshot.val();
            const seededPlayersArray = Object.keys(seededPlayersObject).map(key => ({
                id: key,
                ...seededPlayersObject[key],
                present: seededPlayersObject[key].present ?? false
            }));
            return { success: true, data: seededPlayersArray };
        }
    } catch (error) {
        console.error('Get Players Error:', error);
        return { success: false, error: 'Failed to retrieve players from the database.' };
    }
}

export async function addPlayer(player: Omit<Player, 'id' | 'present'>): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const newPlayerRef = db.ref('players').push();
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
    try {
        const publishedDataResult = await getPublishedData();
        if (!publishedDataResult.success || !publishedDataResult.data) {
            return { success: false, error: 'Could not retrieve team data to update.' };
        }
        
        const { teams, format, schedule, activeRule, pointsToWin } = publishedDataResult.data;

        await db.ref(`players/${playerId}`).remove();
        
        let updatedTeams = teams || [];
        if (updatedTeams.length > 0) {
            updatedTeams = updatedTeams.map(team => ({
                ...team,
                players: team.players.filter(p => p.id !== playerId)
            })).filter(team => team.players.length > 0);

            await publishData(updatedTeams, format, schedule, activeRule, pointsToWin);
        }

        const allPlayers = await getPlayers();
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

export async function resetAllPlayerPresence(): Promise<{ success: boolean; error?: string }> {
    try {
        const playersSnapshot = await db.ref('players').once('value');
        const players = playersSnapshot.val();

        if (!players) {
            return { success: true }; // No players to update
        }

        const updates: { [key: string]: boolean } = {};
        Object.keys(players).forEach(playerId => {
            updates[`/players/${playerId}/present`] = false;
        });

        await db.ref().update(updates);

        return { success: true };
    } catch (error) {
        console.error('Reset All Player Presence Error:', error);
        return { success: false, error: 'Failed to reset player presence in the database.' };
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


// --- CSV Actions ---
export async function exportPlayersToCSV(): Promise<{ success: boolean; csv?: string; error?: string }> {
    try {
        const playersResult = await getPlayers();
        if (!playersResult.success || !playersResult.data) {
            return { success: false, error: 'Could not fetch players for export.' };
        }
        
        const dataForCSV = playersResult.data.map(({ name, gender, skill }) => ({ name, gender, skill }));

        const csv = Papa.unparse(dataForCSV);
        return { success: true, csv };

    } catch (error) {
        console.error('Export Players Error:', error);
        return { success: false, error: 'Failed to export players.' };
    }
}

export async function importPlayersFromCSV(csvData: string): Promise<{ success: boolean; data?: Player[]; error?: string; importCount?: number }> {
    try {
        const parseResult = Papa.parse<Omit<Player, 'id' | 'present'>>(csvData, {
            header: true,
            skipEmptyLines: true,
            transform: (value, header) => {
                if (header === 'skill') {
                    return parseInt(value, 10);
                }
                return value;
            },
        });

        if (parseResult.errors.length > 0) {
            console.error('CSV Parsing Errors:', parseResult.errors);
            return { success: false, error: `CSV parsing error on row ${parseResult.errors[0].row}: ${parseResult.errors[0].message}`};
        }

        const newPlayers = parseResult.data;
        
        if (newPlayers.length === 0) {
            return { success: false, error: "No players found in the CSV file." };
        }

        const updates: { [key: string]: Omit<Player, 'id'> } = {};
        newPlayers.forEach(player => {
            // Basic validation
            if (player.name && (player.gender === 'Guy' || player.gender === 'Gal') && player.skill >= 1 && player.skill <= 10) {
                const newPlayerRef = db.ref('players').push();
                const newPlayerId = newPlayerRef.key;
                if (newPlayerId) {
                    updates[`/players/${newPlayerId}`] = { ...player, present: false };
                }
            } else {
                console.warn('Skipping invalid player row:', player);
            }
        });
        
        await db.ref().update(updates);
        
        const allPlayers = await getPlayers();

        return { success: true, data: allPlayers.data, importCount: Object.keys(updates).length };
    } catch (error) {
        console.error('Import Players Error:', error);
        return { success: false, error: 'Failed to import players.' };
    }
}
