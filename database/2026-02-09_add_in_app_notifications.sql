-- Migration: Add in-app notifications table
-- Date: 2026-02-09
-- Description: Creates in_app_notifications table for notification center functionality

CREATE TABLE IF NOT EXISTS in_app_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  event_type TEXT NOT NULL, -- 'booking_confirmation', 'reschedule_request', 'review_confirmed', 'reminder', 'cancellation', etc.
  related_appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_is_read ON in_app_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_at ON in_app_notifications(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION set_in_app_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS in_app_notifications_updated_at ON in_app_notifications;
CREATE TRIGGER in_app_notifications_updated_at
  BEFORE UPDATE ON in_app_notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_in_app_notifications_updated_at();

COMMENT ON TABLE in_app_notifications IS 'In-app notification center messages for users';
COMMENT ON COLUMN in_app_notifications.type IS 'Visual type: info, success, warning, or error';
COMMENT ON COLUMN in_app_notifications.event_type IS 'Event that triggered the notification';
COMMENT ON COLUMN in_app_notifications.action_url IS 'Optional URL to navigate when notification is clicked';
