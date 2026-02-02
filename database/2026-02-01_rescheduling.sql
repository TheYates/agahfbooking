-- Migration: Rescheduling Support
-- Adds fields to link and track rescheduled appointments

-- Add rescheduled_from_id to link new appointment to original
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS rescheduled_from_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL;

-- Add rescheduled_to_id to link original appointment to new one
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS rescheduled_to_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL;

-- Add reschedule_reason to track why appointment was rescheduled
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;

-- Add rescheduled_by to track who performed the reschedule
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS rescheduled_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add rescheduled_at timestamp
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ;

-- Create indexes for reschedule lookups
CREATE INDEX IF NOT EXISTS idx_appointments_rescheduled_from
ON appointments(rescheduled_from_id)
WHERE rescheduled_from_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_rescheduled_to
ON appointments(rescheduled_to_id)
WHERE rescheduled_to_id IS NOT NULL;

-- Index for finding rescheduled appointments
CREATE INDEX IF NOT EXISTS idx_appointments_rescheduled_status
ON appointments(status, rescheduled_at)
WHERE status = 'rescheduled';

COMMENT ON COLUMN appointments.rescheduled_from_id IS 'ID of the original appointment this was rescheduled from';
COMMENT ON COLUMN appointments.rescheduled_to_id IS 'ID of the new appointment this was rescheduled to';
COMMENT ON COLUMN appointments.reschedule_reason IS 'Reason provided for rescheduling the appointment';
COMMENT ON COLUMN appointments.rescheduled_by IS 'User ID of who performed the reschedule (NULL if client)';
COMMENT ON COLUMN appointments.rescheduled_at IS 'Timestamp when the appointment was rescheduled';
