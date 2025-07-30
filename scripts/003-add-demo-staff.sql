-- Add demo staff users for testing
-- This script adds sample staff members to the users table

-- Insert demo admin user
INSERT INTO users (name, phone, role, employee_id, is_active) 
VALUES ('Dr. Admin', '+9988776655', 'admin', 'admin', true)
ON CONFLICT (employee_id) DO NOTHING;

-- Insert demo receptionist user
INSERT INTO users (name, phone, role, employee_id, is_active) 
VALUES ('Mary Johnson', '+1122334455', 'receptionist', 'receptionist', true)
ON CONFLICT (employee_id) DO NOTHING;

-- Insert additional demo staff
INSERT INTO users (name, phone, role, employee_id, is_active) 
VALUES ('Dr. Sarah Wilson', '+5566778899', 'admin', 'sarah.wilson', true)
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO users (name, phone, role, employee_id, is_active) 
VALUES ('John Smith', '+4433221100', 'receptionist', 'john.smith', true)
ON CONFLICT (employee_id) DO NOTHING;

-- Display the inserted staff
SELECT id, name, phone, role, employee_id, is_active, created_at 
FROM users 
WHERE role IN ('admin', 'receptionist') 
ORDER BY role, name;
