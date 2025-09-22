'use server';

import { supabase } from '@/lib/supabase';
import type { Team, GameFormat, GameVariant, Match, PowerUp, Player } from '@/types';
import Papa from 'papaparse';

// --- Player Data Seeding ---
const seedPlayersData: Omit<Player, 'id' | 'present'>[] = [
    { name: "Cole Deaver", gender: "Guy", skill: 6 },
    { name: "Melissa Roy", gender: "Gal", skill: 6 },
    { name: "Kristin Drinka", gender: "Gal", skill: 7 },
    { name: "Kyle Novak", gender: "Guy", skill: 9 },
    { name: "Nicole Malone", gender: "Gal", skill: 5 },
    { name: "Heidi Kempert", gender: "Gal", skill: 4 },
    { name: "Brian Kempert", gender: "Guy", skill: 8 },
    { name: "Abby Gilpin", gender: "Gal", skill: 6 },
    { name: "Miranda Griego", gender: "Gal", skill: 3 },
    { name: "Jonathan Bradley", gender: "Guy", skill: 5 },
    { name: "Aditya Singh", gender: "Guy", skill: 7 },
    { name: "Giovanni Salvatore", gender: "Guy", skill: 7 },
    { name: "Emily Victoria", gender: "Gal", skill: 6 },
    { name: "Eric Ahrens", gender: "Guy", skill: 7 },
    { name: "Stephen Jaqua", gender: "Guy", skill: 4 },
    { name: "Lindsey Victoria", gender: "Gal", skill: 7 },
    { name: "Shaylyn Murphy", gender: "Gal", skill: 8 },
    { name: "William Van Meter", gender: "Guy", skill: 3 },
    { name: "Colleen Palman", gender: "Gal", skill: 2 },
    { name: "Rachel Nystrom", gender: "Gal", skill: 8 },
    { name: "Pat Sobotka", gender: "Guy", skill: 6 },
    { name: "Jasona Jones", gender: "Gal", skill: 1 },
    { name: "Joy Swasy", gender: "Gal", skill: 6 },
    { name: "Jesica Bullrich", gender: "Gal", skill: 2 },
    { name: "Lauren Hopkins", gender: "Gal", skill: 6 },
    { name: "Matt Taylor", gender: "Guy", skill: 7 },
    { name: "Alaina McCoy", gender: "Gal", skill: 4 },
    { name: "Alexandra Broskey", gender: "Gal", skill: 6 }
];

async function seedDatabase() {
    console.log('Seeding database with initial players...');

    const playersToInsert = seedPlayersData.map(player => ({
        ...player,
        present: false
    }));

    const { error } = await supabase
        .from('players')
        .insert(playersToInsert);

    if (error) {
        console.error('Error seeding database:', error);
        throw error;
    }

    console.log('Database seeded successfully.');
}

// --- Player Data Actions ---

export async function getPlayers(): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        console.log('[VERBOSE DEBUG] actions.getPlayers: Calling supabase');

        const { data: players, error } = await supabase
            .from('players')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[CRITICAL DEBUG] getPlayers Error:', error);
            return { success: false, error: 'Failed to retrieve players from the database.' };
        }

        if (players && players.length > 0) {
            const playersArray = players.map(player => ({
                ...player,
                present: player.present ?? false
            }));
            return { success: true, data: playersArray };
        } else {
            // If no players, seed the database
            await seedDatabase();

            const { data: seededPlayers, error: seededError } = await supabase
                .from('players')
                .select('*')
                .order('created_at', { ascending: true });

            if (seededError) {
                return { success: false, error: 'Failed to retrieve seeded players.' };
            }

            const seededPlayersArray = (seededPlayers || []).map(player => ({
                ...player,
                present: player.present ?? false
            }));
            return { success: true, data: seededPlayersArray };
        }
    } catch (error: any) {
        console.error('[CRITICAL DEBUG] getPlayers Error:', error.message);
        return { success: false, error: 'Failed to retrieve players from the database.' };
    }
}

export async function addPlayer(player: Omit<Player, 'id' | 'present'>): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const { error } = await supabase
            .from('players')
            .insert([{
                ...player,
                present: true,
            }]);

        if (error) {
            console.error('[CRITICAL DEBUG] Add Player Error:', error);
            return { success: false, error: 'Failed to add player to the database.' };
        }

        const allPlayers = await getPlayers();
        return { success: true, data: allPlayers.data };

    } catch (error: any) {
        console.error('[CRITICAL DEBUG] Add Player Error:', error.message);
        return { success: false, error: 'Failed to add player to the database.' };
    }
}

export async function updatePlayer(updatedPlayer: Player): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        const { id, ...playerData } = updatedPlayer;

        const { error } = await supabase
            .from('players')
            .update(playerData)
            .eq('id', id);

        if (error) {
            console.error('[CRITICAL DEBUG] Update Player Error:', error);
            return { success: false, error: 'Failed to update player in the database.' };
        }

        const allPlayers = await getPlayers();
        return { success: true, data: allPlayers.data };
    } catch (error: any) {
        console.error('[CRITICAL DEBUG] Update Player Error:', error.message);
        return { success: false, error: 'Failed to update player in the database.' };
    }
}

export async function deletePlayer(playerId: string): Promise<{ success: boolean; data?: Player[]; error?: string }> {
    try {
        // Get published data first to update teams
        const publishedDataResult = await getPublishedData();
        if (!publishedDataResult.success || !publishedDataResult.data) {
            throw new Error('Could not retrieve existing data to perform delete.');
        }
        let { teams, format, schedule, activeRule, pointsToWin } = publishedDataResult.data;

        // Delete the player
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId);

        if (error) {
            console.error('[CRITICAL DEBUG] Delete Player Error:', error);
            return { success: false, error: 'Failed to delete player from the database.' };
        }

        // If there are teams, filter the deleted player out of them
        if (teams && teams.length > 0) {
            teams = teams.map(team => ({
                ...team,
                players: team.players.filter(p => p.id !== playerId)
            })).filter(team => team.players.length > 0); // Optional: remove empty teams

            // Write the cleaned-up teams array back to the database
            await publishData(teams, format, schedule, activeRule, pointsToWin);
        }

        const allPlayers = await getPlayers();
        return { success: true, data: allPlayers.data };
    } catch (error: any) {
        console.error('[CRITICAL DEBUG] deletePlayer error:', error.message);
        return { success: false, error: error.message || 'Failed to delete player from the database.' };
    }
}

export async function updatePlayerPresence(playerId: string, present: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('players')
            .update({ present })
            .eq('id', playerId);

        if (error) {
            console.error('[CRITICAL DEBUG] Update Player Presence Error:', error);
            return { success: false, error: 'Failed to update player presence in the database.' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[CRITICAL DEBUG] Update Player Presence Error:', error.message);
        return { success: false, error: 'Failed to update player presence in the database.' };
    }
}

export async function resetAllPlayerPresence(): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('players')
            .update({ present: false })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all players

        if (error) {
            console.error('[CRITICAL DEBUG] Reset All Player Presence Error:', error);
            return { success: false, error: 'Failed to reset player presence in the database.' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[CRITICAL DEBUG] Reset All Player Presence Error:', error.message);
        return { success: false, error: 'Failed to reset player presence in the database.' };
    }
}

// --- Published Tournament Data Actions ---

type PublishedData = {
    teams: Team[];
    format: GameFormat | GameVariant;
    schedule: Match[];
    activeRule: PowerUp | null;
    pointsToWin: number;
};

export async function publishData(teams: Team[], format: GameFormat | GameVariant, schedule: Match[], activeRule: PowerUp | null, pointsToWin: number) {
    try {
        const dataToPublish = {
            teams: teams || [],
            format: format || 'king-of-the-court',
            schedule: schedule || [],
            active_rule: activeRule || null,
            points_to_win: pointsToWin || 15,
        };

        // Use upsert to handle both insert and update
        const { error } = await supabase
            .from('published_data')
            .upsert(dataToPublish, { onConflict: 'id' });

        if (error) {
            console.error('[CRITICAL DEBUG] Publish Data Error:', error);
            return { success: false, error: 'Failed to publish data to the database.' };
        }

        return { success: true, message: 'Teams, format, and schedule published successfully!' };
    } catch (error: any) {
        console.error('[CRITICAL DEBUG] Publish Data Error:', error.message);
        return { success: false, error: 'Failed to publish data to the database.' };
    }
}

export async function getPublishedData(): Promise<{ success: boolean; data?: PublishedData; error?: string }> {
    const defaultData: PublishedData = {
        teams: [],
        format: 'round-robin',
        schedule: [],
        activeRule: null,
        pointsToWin: 15,
    };

    try {
        const { data, error } = await supabase
            .from('published_data')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('[CRITICAL DEBUG] Get Published Data Error:', error);
            return { success: true, data: defaultData };
        }

        if (data) {
            const saneData: PublishedData = {
                teams: data.teams || [],
                format: data.format || 'round-robin',
                schedule: data.schedule || [],
                activeRule: data.active_rule || null,
                pointsToWin: data.points_to_win || 15,
            };
            return { success: true, data: saneData };
        }

        return { success: true, data: defaultData };

    } catch (error: any) {
        console.error('[CRITICAL DEBUG] Get Published Data Error:', error.message);
        return { success: true, data: defaultData };
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

    } catch (error: any) {
        console.error('[CRITICAL DEBUG] Export Players Error:', error.message);
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
            console.error('[CRITICAL DEBUG] CSV Parsing Errors:', parseResult.errors);
            return { success: false, error: `CSV parsing error on row ${parseResult.errors[0].row}: ${parseResult.errors[0].message}`};
        }

        const newPlayers = parseResult.data;

        if (newPlayers.length === 0) {
            return { success: false, error: "No players found in the CSV file." };
        }

        // Filter and prepare valid players
        const validPlayers = newPlayers.filter(player =>
            player.name &&
            (player.gender === 'Guy' || player.gender === 'Gal') &&
            player.skill >= 1 &&
            player.skill <= 10
        ).map(player => ({
            ...player,
            present: false
        }));

        if (validPlayers.length === 0) {
            return { success: false, error: "No valid players found in the CSV file." };
        }

        const { error } = await supabase
            .from('players')
            .insert(validPlayers);

        if (error) {
            console.error('[CRITICAL DEBUG] Import Players Error:', error);
            return { success: false, error: 'Failed to import players.' };
        }

        const allPlayers = await getPlayers();

        return { success: true, data: allPlayers.data, importCount: validPlayers.length };
    } catch (error: any) {
        console.error('[CRITICAL DEBUG] Import Players Error:', error.message);
        return { success: false, error: 'Failed to import players.' };
    }
}