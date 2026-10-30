CREATE TABLE IF NOT EXISTS playtest_signups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
    name TEXT CHECK (name IS NULL OR char_length(name) BETWEEN 1 AND 100),
    platform TEXT NOT NULL CHECK (platform IN ('windows', 'macos', 'android', 'ios')),
    consent_version TEXT NOT NULL,
    consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_route TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_playtest_signups_email_normalized
    ON playtest_signups (lower(email));

CREATE INDEX IF NOT EXISTS idx_playtest_signups_created_at
    ON playtest_signups (created_at DESC);

ALTER TABLE playtest_signups ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE playtest_signups FROM anon, authenticated;

COMMENT ON TABLE playtest_signups IS
    'Private Crazy Chess playtest contact list. Accessed only by trusted server-side code and Supabase administrators.';
