-- Migration: Add reschedule_requested status
-- Adds 'reschedule_requested' to the appointments status check constraint
-- This status is used when admin/reviewer requests a client to reschedule their appointment

-- Drop the existing check constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add the updated check constraint with reschedule_requested status
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
CHECK (status IN (
  'pending_review',
  'reschedule_requested',
  'booked',
  'confirmed',
  'arrived',
  'waiting',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
));

-- Create index for finding appointments with reschedule_requested status
CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_requested
ON appointments(status, client_id, appointment_date)
WHERE status = 'reschedule_requested';

COMMENT ON CONSTRAINT appointments_status_check ON appointments IS 'Valid appointment statuses including reschedule_requested for admin-requested reschedules';
