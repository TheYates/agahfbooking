-- Migration to separate clients (patients) from users (staff)
-- This script creates a separate clients table and migrates existing client data

-- Create clients table for patients
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    x_number VARCHAR(10) UNIQUE NOT NULL, -- Format: X12345/67
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL, -- PRIVATE CASH, PUBLIC SPONSORED(NHIA), etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing client data from users table to clients table
INSERT INTO clients (x_number, name, phone, category, is_active, created_at, updated_at)
SELECT x_number, name, phone, category, is_active, created_at, updated_at
FROM users 
WHERE role = 'client';

-- Update appointments table to reference clients instead of users for client_id
-- First, drop the existing foreign key constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;

-- Create a mapping of old user IDs to new client IDs
CREATE TEMP TABLE client_id_mapping AS
SELECT
    u.id as old_user_id,
    c.id as new_client_id
FROM users u
JOIN clients c ON u.x_number = c.x_number
WHERE u.role = 'client';

-- Update appointments to use new client IDs
UPDATE appointments
SET client_id = m.new_client_id
FROM client_id_mapping m
WHERE appointments.client_id = m.old_user_id;

-- Remove client records from users table (keep only staff)
DELETE FROM users WHERE role = 'client';

-- Update users table to remove category column (only needed for clients)
ALTER TABLE users DROP COLUMN IF EXISTS category;

-- Update users table to remove x_number (only needed for clients)
ALTER TABLE users DROP COLUMN IF EXISTS x_number;

-- Add staff-specific fields to users table if needed
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20) UNIQUE;

-- Add the new foreign key constraint to reference clients table
ALTER TABLE appointments ADD CONSTRAINT appointments_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_x_number ON clients(x_number);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);

-- Update OTP table to reference clients instead of users for x_number lookups
-- (OTP is used for client authentication via x_number)
-- No changes needed to otp_codes table structure as it uses x_number directly

COMMENT ON TABLE clients IS 'Patients/clients who book appointments';
COMMENT ON TABLE users IS 'Staff members (receptionists, admins, doctors)';
