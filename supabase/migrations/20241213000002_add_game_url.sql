-- Migration 002: Add game_url column to games table
-- This migration adds the game_url field to store iframe URLs for games

-- Add the game_url column to the games table
ALTER TABLE games ADD COLUMN game_url TEXT;

-- For existing games, we'll need to update them manually or set a default
-- Since this is a required field, let's add a constraint after updating existing records
-- UPDATE games SET game_url = '/games/' || slug || '/index.html' WHERE game_url IS NULL;

-- Make the column NOT NULL after setting values (uncomment the line below after updating existing games)
-- ALTER TABLE games ALTER COLUMN game_url SET NOT NULL; 