-- Migration script to add working_days and working_hours to existing departments table
-- Run this if you have an existing database without these columns

-- Add working_days column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'departments' AND column_name = 'working_days') THEN
        ALTER TABLE departments ADD COLUMN working_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]';
    END IF;
END $$;

-- Add working_hours column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'departments' AND column_name = 'working_hours') THEN
        ALTER TABLE departments ADD COLUMN working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}';
    END IF;
END $$;

-- Update existing departments with default working schedule if they have NULL values
UPDATE departments 
SET working_days = '["monday", "tuesday", "wednesday", "thursday", "friday"]'
WHERE working_days IS NULL;

UPDATE departments 
SET working_hours = '{"start": "09:00", "end": "17:00"}'
WHERE working_hours IS NULL;
