-- Add password support to users table for staff authentication
-- This migration adds password_hash column and employee_id if not exists

-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add employee_id column if it doesn't exist (for staff identification)
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE;

-- Update existing users to have employee_id if they don't have one
UPDATE users SET employee_id = 'admin' WHERE role = 'admin' AND employee_id IS NULL AND name LIKE '%Admin%';
UPDATE users SET employee_id = 'receptionist' WHERE role = 'receptionist' AND employee_id IS NULL AND name LIKE '%Johnson%';

-- Note: Password hashes will be set programmatically
-- Default passwords for demo:
-- admin: admin123 -> $2a$10$hash...
-- receptionist: recep123 -> $2a$10$hash...
