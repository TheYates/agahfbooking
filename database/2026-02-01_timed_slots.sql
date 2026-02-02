-- Migration: Timed Slots
-- Adds slot_duration_minutes to departments and slot times to appointments

-- Add slot_duration_minutes to departments (configurable per department)
ALTER TABLE departments
ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER DEFAULT 30;

-- Add slot times to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS slot_start_time TIME,
ADD COLUMN IF NOT EXISTS slot_end_time TIME;

-- Update existing departments with default slot duration
UPDATE departments
SET slot_duration_minutes = 30
WHERE slot_duration_minutes IS NULL;

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_slot_times
ON appointments(appointment_date, slot_start_time);

-- Function to calculate slot times from working hours and slot number
CREATE OR REPLACE FUNCTION calculate_slot_time(
  working_start TEXT,
  slot_num INTEGER,
  duration_minutes INTEGER
) RETURNS TIME AS $$
DECLARE
  start_hour INTEGER;
  start_minute INTEGER;
  offset_minutes INTEGER;
  total_minutes INTEGER;
BEGIN
  -- Parse start time (e.g., "09:00")
  start_hour := SPLIT_PART(working_start, ':', 1)::INTEGER;
  start_minute := SPLIT_PART(working_start, ':', 2)::INTEGER;

  -- Calculate offset for this slot (slot 1 = 0 offset)
  offset_minutes := (slot_num - 1) * duration_minutes;

  -- Calculate total minutes from midnight
  total_minutes := (start_hour * 60) + start_minute + offset_minutes;

  -- Convert to TIME
  RETURN (total_minutes || ' minutes')::INTERVAL::TIME;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill existing appointments with calculated times
UPDATE appointments a
SET
  slot_start_time = calculate_slot_time(
    d.working_hours->>'start',
    a.slot_number,
    COALESCE(d.slot_duration_minutes, 30)
  ),
  slot_end_time = calculate_slot_time(
    d.working_hours->>'start',
    a.slot_number,
    COALESCE(d.slot_duration_minutes, 30)
  ) + (COALESCE(d.slot_duration_minutes, 30) || ' minutes')::INTERVAL
FROM departments d
WHERE a.department_id = d.id
  AND a.slot_start_time IS NULL;

COMMENT ON COLUMN departments.slot_duration_minutes IS 'Duration of each appointment slot in minutes (default 30)';
COMMENT ON COLUMN appointments.slot_start_time IS 'Calculated start time of the appointment slot';
COMMENT ON COLUMN appointments.slot_end_time IS 'Calculated end time of the appointment slot';
