-- Reschedule presets table for reviewer/admin configurable messages
CREATE TABLE IF NOT EXISTS reschedule_presets (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with default presets
INSERT INTO reschedule_presets (message) VALUES
  ('Doctor unavailable at scheduled time'),
  ('Schedule conflict - please select another time'),
  ('Equipment maintenance in progress'),
  ('Emergency case requires rescheduling'),
  ('Department closed on selected date'),
  ('Preparation requirements not met');

-- Create index for active presets lookup
CREATE INDEX IF NOT EXISTS idx_reschedule_presets_active ON reschedule_presets(is_active) WHERE is_active = true;
