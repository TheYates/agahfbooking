-- Migration: Add user_reminder_preferences table
-- Date: 2026-02-07
-- Description: Stores user-specific reminder preferences for appointments

-- Create user_reminder_preferences table
CREATE TABLE IF NOT EXISTS user_reminder_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  remind_24h BOOLEAN DEFAULT TRUE,
  remind_1h BOOLEAN DEFAULT TRUE,
  remind_30m BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_reminder_preferences_user ON user_reminder_preferences(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION set_user_reminder_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_reminder_preferences_updated_at
  BEFORE UPDATE ON user_reminder_preferences
  FOR EACH ROW
  EXECUTE FUNCTION set_user_reminder_preferences_updated_at();

-- Add comment
COMMENT ON TABLE user_reminder_preferences IS 'Stores user reminder preferences for appointment notifications';
