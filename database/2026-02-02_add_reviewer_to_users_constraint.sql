-- Update users table role check constraint to include 'reviewer'

-- Drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with reviewer role
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('receptionist', 'admin', 'reviewer'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';
