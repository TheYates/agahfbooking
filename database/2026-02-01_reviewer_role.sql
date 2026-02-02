-- Migration: Reviewer Role & Workflow
-- Adds review flags to departments and supports reviewer user role

-- Add require_review flag to departments
ALTER TABLE departments
ADD COLUMN IF NOT EXISTS require_review BOOLEAN DEFAULT true;

-- Add auto_confirm_staff_bookings flag to departments
ALTER TABLE departments
ADD COLUMN IF NOT EXISTS auto_confirm_staff_bookings BOOLEAN DEFAULT false;

-- Update existing departments with defaults
UPDATE departments
SET require_review = true
WHERE require_review IS NULL;

UPDATE departments
SET auto_confirm_staff_bookings = false
WHERE auto_confirm_staff_bookings IS NULL;

-- Create index for pending review appointments (common query)
CREATE INDEX IF NOT EXISTS idx_appointments_pending_review
ON appointments(status, created_at)
WHERE status = 'pending_review';

-- Add reviewer_notes column for review workflow
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Add reviewed_by column to track who reviewed the appointment
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);

-- Add reviewed_at timestamp
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN departments.require_review IS 'Whether appointments to this department require review before confirmation';
COMMENT ON COLUMN departments.auto_confirm_staff_bookings IS 'Whether staff-created bookings skip the review process';
COMMENT ON COLUMN appointments.reviewer_notes IS 'Notes added by reviewer during appointment review';
COMMENT ON COLUMN appointments.reviewed_by IS 'User ID of the reviewer who confirmed/processed the appointment';
COMMENT ON COLUMN appointments.reviewed_at IS 'Timestamp when the appointment was reviewed';
