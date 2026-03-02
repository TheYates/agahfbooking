-- Sessions table for server-side session management
-- This replaces storing user data directly in cookies

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'staff')),
  role TEXT NOT NULL CHECK (role IN ('client', 'admin', 'receptionist', 'reviewer')),
  x_number TEXT,
  employee_id TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  category TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE
);

-- Index for fast session lookup
CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Automatically clean expired sessions on insert (optional trigger)
-- Or run periodically via cron job

-- Add auth_user_id to clients if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN auth_user_id UUID;
  END IF;
END $$;
