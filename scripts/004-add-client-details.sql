-- Add additional fields to clients table for detailed information
-- This script adds emergency contact, address, and medical notes fields

-- Add emergency contact field
ALTER TABLE clients ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20);

-- Add address field
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;

-- Add medical notes field
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- Update existing clients with some sample data for demonstration
UPDATE clients SET 
  emergency_contact = '+1234567891',
  address = '123 Main St, City, State 12345',
  medical_notes = 'No known allergies'
WHERE x_number = 'X12345/67';

UPDATE clients SET 
  emergency_contact = '+0987654322',
  address = '456 Oak Ave, City, State 12345',
  medical_notes = NULL
WHERE x_number = 'X98765/43';

-- Display the updated clients
SELECT id, x_number, name, phone, category, emergency_contact, address, medical_notes, created_at 
FROM clients 
ORDER BY name;
