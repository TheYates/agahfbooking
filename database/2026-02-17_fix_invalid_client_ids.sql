-- Fix appointments with invalid client_id values
-- These appointments reference non-existent clients (likely staff user IDs were used)

-- First, find appointments with invalid client_ids
SELECT 
    a.id,
    a.client_id,
    a.appointment_date,
    a.status,
    'Invalid client_id - no matching client' as issue
FROM appointments a
LEFT JOIN clients c ON a.client_id = c.id
WHERE c.id IS NULL;

-- Option 1: Delete invalid appointments (uncomment to run)
-- DELETE FROM appointments a
-- WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = a.client_id);

-- Option 2: Create a placeholder client for orphaned appointments (uncomment to run)
-- INSERT INTO clients (x_number, name, phone, category, is_active)
-- VALUES ('X-UNKNOWN', 'Unknown Client', '', 'regular', true)
-- ON CONFLICT DO NOTHING;

-- Then update orphaned appointments to use the placeholder client
-- UPDATE appointments 
-- SET client_id = (SELECT id FROM clients WHERE x_number = 'X-UNKNOWN')
-- WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = appointments.client_id);
