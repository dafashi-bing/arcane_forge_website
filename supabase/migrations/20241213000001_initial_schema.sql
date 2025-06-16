-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT NOT NULL,
    screenshot_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stats table (consolidated play/like stats)
CREATE TABLE stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_slug VARCHAR(255) UNIQUE NOT NULL REFERENCES games(slug) ON DELETE CASCADE,
    plays INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table (threaded support)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_slug VARCHAR(255) NOT NULL REFERENCES games(slug) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback requests table
CREATE TABLE feedback_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_slug VARCHAR(255) NOT NULL REFERENCES games(slug) ON DELETE CASCADE,
    message TEXT NOT NULL,
    email VARCHAR(320), -- RFC 5321 max email length
    want_notify BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_stats_game_slug ON stats(game_slug);
CREATE INDEX idx_comments_game_slug ON comments(game_slug);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_game_parent_created ON comments(game_slug, parent_id, created_at);
CREATE INDEX idx_feedback_game_slug ON feedback_requests(game_slug);
CREATE INDEX idx_feedback_created_at ON feedback_requests(created_at);

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies (for future auth)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;

-- Allow public read access for now (v0 requirements)
CREATE POLICY "Public read access for games" ON games FOR SELECT USING (true);
CREATE POLICY "Public read access for stats" ON stats FOR SELECT USING (true);
CREATE POLICY "Public read access for comments" ON comments FOR SELECT USING (true);

-- Allow public write access for comments and feedback
CREATE POLICY "Public insert for comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert for feedback" ON feedback_requests FOR INSERT WITH CHECK (true);

-- Allow public update for stats (play counts, likes/dislikes)
CREATE POLICY "Public update for stats" ON stats FOR UPDATE USING (true); 