-- Migration: Add Supabase Auth integration to clients table
-- Date: 2026-02-12
-- Description: Link clients table to Supabase Auth users

-- Add auth_user_id column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON clients(auth_user_id);

-- Add comment explaining the column
COMMENT ON COLUMN clients.auth_user_id IS 'Reference to Supabase Auth user ID for authentication';

-- Update RLS policies to use Supabase Auth
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon access to clients" ON clients;
DROP POLICY IF EXISTS "Service role has full access to clients" ON clients;

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

-- Staff can manage all clients
CREATE POLICY "Staff can manage clients"
ON clients FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role IN ('admin', 'receptionist', 'reviewer')
  )
  OR 
  auth.role() = 'service_role'
);

-- Enable RLS if not already enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Also update users table to support Supabase Auth
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

COMMENT ON COLUMN users.auth_user_id IS 'Reference to Supabase Auth user ID for staff authentication';

-- Update users RLS policies
DROP POLICY IF EXISTS "Allow anon access to users" ON users;
DROP POLICY IF EXISTS "Service role has full access to users" ON users;

CREATE POLICY "Service role has full access to users"
ON users FOR ALL
USING (auth.role() = 'service_role');

-- Users can view their own record
CREATE POLICY "Users can view own record"
ON users FOR SELECT
USING (
  auth.uid() = auth_user_id
  OR 
  auth.role() = 'service_role'
);

-- Admins can manage all users
CREATE POLICY "Admins can manage users"
ON users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() 
    AND u.role = 'admin'
  )
  OR 
  auth.role() = 'service_role'
);

-- Create function to automatically create auth user when client is created
CREATE OR REPLACE FUNCTION create_auth_user_for_client()
RETURNS TRIGGER AS $$
DECLARE
  new_auth_id UUID;
  temp_password TEXT;
BEGIN
  -- Only create auth user if email is provided and auth_user_id is not set
  IF NEW.email IS NOT NULL AND NEW.auth_user_id IS NULL THEN
    -- Generate temporary password
    temp_password := substr(md5(random()::text), 1, 12);
    
    -- Create auth user
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      NEW.email,
      crypt(temp_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object(
        'x_number', NEW.x_number,
        'name', NEW.name,
        'role', 'client'
      ),
      NOW(),
      NOW()
    )
    RETURNING id INTO new_auth_id;
    
    -- Update client with auth_user_id
    NEW.auth_user_id := new_auth_id;
    
    -- Optionally, send password reset email here
    -- Or log the temp password for admin to share with client
    RAISE NOTICE 'Created auth user % for client % with temp password: %', new_auth_id, NEW.x_number, temp_password;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (disabled by default - enable if you want auto-creation)
DROP TRIGGER IF EXISTS auto_create_auth_user ON clients;
CREATE TRIGGER auto_create_auth_user
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION create_auth_user_for_client();

-- Disable the trigger by default (enable manually when ready)
ALTER TABLE clients DISABLE TRIGGER auto_create_auth_user;
