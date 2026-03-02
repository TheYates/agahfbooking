-- Migration: Rename employee_id to username and make phone optional
-- Date: 2026-02-03
-- Description: 
--   1. Rename employee_id column to username for better UX
--   2. Make phone column nullable to allow staff users without phone numbers

BEGIN;

-- Rename employee_id column to username
ALTER TABLE users RENAME COLUMN employee_id TO username;

-- Make phone column nullable
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- Verify the unique constraint still exists on username (it should be preserved from employee_id)
-- If needed, we can add it explicitly:
-- ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);

COMMIT;

-- Rollback instructions (if needed):
-- BEGIN;
-- ALTER TABLE users RENAME COLUMN username TO employee_id;
-- ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
-- COMMIT;
