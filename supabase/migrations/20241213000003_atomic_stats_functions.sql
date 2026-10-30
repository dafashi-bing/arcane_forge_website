-- Create atomic increment functions for stats table
-- These functions handle race conditions properly with upsert and atomic increments

-- Function to atomically increment play count
CREATE OR REPLACE FUNCTION increment_plays(game_slug_param text)
RETURNS stats AS $$
DECLARE
    result_stats stats;
BEGIN
    -- Insert or increment plays count atomically
    INSERT INTO stats (game_slug, plays, likes, dislikes)
    VALUES (game_slug_param, 1, 0, 0)
    ON CONFLICT (game_slug)
    DO UPDATE SET
        plays = stats.plays + 1,
        updated_at = NOW()
    RETURNING * INTO result_stats;

    RETURN result_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically increment like count
CREATE OR REPLACE FUNCTION increment_likes(game_slug_param text)
RETURNS stats AS $$
DECLARE
    result_stats stats;
BEGIN
    -- Insert or increment likes count atomically
    INSERT INTO stats (game_slug, plays, likes, dislikes)
    VALUES (game_slug_param, 0, 1, 0)
    ON CONFLICT (game_slug)
    DO UPDATE SET
        likes = stats.likes + 1,
        updated_at = NOW()
    RETURNING * INTO result_stats;

    RETURN result_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically increment dislike count
CREATE OR REPLACE FUNCTION increment_dislikes(game_slug_param text)
RETURNS stats AS $$
DECLARE
    result_stats stats;
BEGIN
    -- Insert or increment dislikes count atomically
    INSERT INTO stats (game_slug, plays, likes, dislikes)
    VALUES (game_slug_param, 0, 0, 1)
    ON CONFLICT (game_slug)
    DO UPDATE SET
        dislikes = stats.dislikes + 1,
        updated_at = NOW()
    RETURNING * INTO result_stats;

    RETURN result_stats;
END;
$$ LANGUAGE plpgsql;
