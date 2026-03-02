-- Migration: Add push_reminders table for appointment notifications
-- Date: 2026-02-07
-- Description: Creates push_reminders table to store scheduled push notifications for appointments

-- Create push_reminders table
CREATE TABLE IF NOT EXISTS push_reminders (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_reminders_appointment ON push_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_push_reminders_user ON push_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_push_reminders_scheduled ON push_reminders(scheduled_time, status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION set_push_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_reminders_updated_at
  BEFORE UPDATE ON push_reminders
  FOR EACH ROW
  EXECUTE FUNCTION set_push_reminders_updated_at();

-- Add comment
COMMENT ON TABLE push_reminders IS 'Stores scheduled push notification reminders for appointments';
