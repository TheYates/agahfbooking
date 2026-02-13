-- Migration: Add Supabase Auth integration for OTP-based login
-- Date: 2026-02-12
-- Description: Link clients to Supabase Auth for phone-based OTP

-- Add auth_user_id column to users table FIRST (needed for policies)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Add auth_user_id column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON clients(auth_user_id);

-- Add comment explaining the column
COMMENT ON COLUMN clients.auth_user_id IS 'Reference to Supabase Auth user ID (phone-based OTP auth)';

-- Update RLS policies for OTP-based authentication
-- Drop existing policies
DROP POLICY IF EXISTS "Allow anon access to clients" ON clients;
DROP POLICY IF EXISTS "Service role has full access to clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own record" ON clients;
DROP POLICY IF EXISTS "Staff can manage clients" ON clients;

-- Service role full access (for API routes using admin client)
CREATE POLICY "Service role has full access to clients"
ON clients FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users can view their own client record
CREATE POLICY "Clients can view own record"
ON clients FOR SELECT
USING (
  auth.uid() = auth_user_id
  OR 
  auth.role() = 'service_role'
);

-- Staff can manage all clients (using auth.role() only to avoid recursion)
CREATE POLICY "Staff can manage clients"
ON clients FOR ALL
USING (auth.role() = 'service_role');

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Update users RLS policies
DROP POLICY IF EXISTS "Allow anon access to users" ON users;
DROP POLICY IF EXISTS "Service role has full access to users" ON users;
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Service role full access
CREATE POLICY "Service role has full access to users"
ON users FOR ALL
USING (auth.role() = 'service_role');

-- Users can view their own record (by matching auth_user_id)
CREATE POLICY "Users can view own record"
ON users FOR SELECT
USING (
  auth.uid() = auth_user_id
  OR 
  auth.role() = 'service_role'
);

-- Admins can manage users (using auth.role() only to avoid recursion)
CREATE POLICY "Admins can manage users"
ON users FOR ALL
USING (auth.role() = 'service_role');

-- Note: We don't auto-create auth users via trigger
-- Auth users are created manually when admin enables phone login for a client
