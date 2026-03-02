-- Add password_hash column to users table
-- Run this in Supabase SQL Editor

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_employee_id 
  ON public.users(employee_id);

-- Note: You'll need to set passwords for users using the seed script
-- or manually update password_hash values
