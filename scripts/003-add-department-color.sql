-- Migration script to add color field to departments table
-- This adds support for department color coding in the UI

-- Add color column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'departments' AND column_name = 'color') THEN
        ALTER TABLE departments ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';
        RAISE NOTICE 'Added color column to departments table';
    ELSE
        RAISE NOTICE 'Color column already exists in departments table';
    END IF;
END $$;

-- Update existing departments with default colors if they don't have colors
UPDATE departments 
SET color = CASE 
    WHEN LOWER(name) LIKE '%cardio%' THEN '#EF4444'  -- Red for Cardiology
    WHEN LOWER(name) LIKE '%pediatric%' OR LOWER(name) LIKE '%child%' THEN '#10B981'  -- Green for Pediatrics
    WHEN LOWER(name) LIKE '%orthopedic%' OR LOWER(name) LIKE '%bone%' THEN '#8B5CF6'  -- Purple for Orthopedics
    WHEN LOWER(name) LIKE '%dermat%' OR LOWER(name) LIKE '%skin%' THEN '#F59E0B'  -- Orange for Dermatology
    ELSE '#3B82F6'  -- Blue for General Medicine and others
END
WHERE color IS NULL OR color = '';

-- Add comment to the column
COMMENT ON COLUMN departments.color IS 'Hex color code for department visual identification (e.g., #3B82F6)';
