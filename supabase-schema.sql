-- Supabase Schema for Saeed's Shuffle

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Guy', 'Gal')),
    skill INTEGER NOT NULL CHECK (skill >= 1 AND skill <= 10),
    present BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Published data table (for tournament settings)
CREATE TABLE IF NOT EXISTS published_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teams JSONB NOT NULL DEFAULT '[]',
    format TEXT NOT NULL DEFAULT 'round-robin',
    schedule JSONB NOT NULL DEFAULT '[]',
    active_rule JSONB,
    points_to_win INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop first if they exist)
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_published_data_updated_at ON published_data;
CREATE TRIGGER update_published_data_updated_at
    BEFORE UPDATE ON published_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_data ENABLE ROW LEVEL SECURITY;

-- Create policies for players table (drop first if they exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON players;
DROP POLICY IF EXISTS "Enable insert access for all users" ON players;
DROP POLICY IF EXISTS "Enable update access for all users" ON players;
DROP POLICY IF EXISTS "Enable delete access for all users" ON players;

CREATE POLICY "Enable read access for all users" ON players FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON players FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON players FOR DELETE USING (true);

-- Create policies for published_data table (drop first if they exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON published_data;
DROP POLICY IF EXISTS "Enable insert access for all users" ON published_data;
DROP POLICY IF EXISTS "Enable update access for all users" ON published_data;
DROP POLICY IF EXISTS "Enable delete access for all users" ON published_data;

CREATE POLICY "Enable read access for all users" ON published_data FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON published_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON published_data FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON published_data FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at);
CREATE INDEX IF NOT EXISTS idx_players_present ON players(present);
CREATE INDEX IF NOT EXISTS idx_published_data_created_at ON published_data(created_at);