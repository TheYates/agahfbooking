-- Migration: Notification History
-- Creates notification_log table for tracking all sent notifications

-- Create notification_log table
CREATE TABLE IF NOT EXISTS notification_log (
  id BIGSERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('sms', 'push', 'email')),
  event_type TEXT NOT NULL, -- 'booking_confirmation', 'reschedule_request', 'review_confirmed', 'reminder', etc.
  recipient_contact TEXT NOT NULL, -- phone number, push endpoint, or email
  message_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  external_id TEXT, -- ID from external service (e.g., Hubtel message ID)
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notification_log_appointment
ON notification_log(appointment_id);

CREATE INDEX IF NOT EXISTS idx_notification_log_client
ON notification_log(client_id);

CREATE INDEX IF NOT EXISTS idx_notification_log_status
ON notification_log(status)
WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_notification_log_event_type
ON notification_log(event_type, created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION set_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notification_log_updated_at ON notification_log;
CREATE TRIGGER set_notification_log_updated_at
  BEFORE UPDATE ON notification_log
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_updated_at();

COMMENT ON TABLE notification_log IS 'Log of all notifications sent for appointments (SMS, push, email)';
COMMENT ON COLUMN notification_log.notification_type IS 'Type of notification: sms, push, or email';
COMMENT ON COLUMN notification_log.event_type IS 'Event that triggered the notification (booking_confirmation, reschedule_request, etc.)';
COMMENT ON COLUMN notification_log.recipient_contact IS 'Contact info used: phone number, push subscription endpoint, or email address';
COMMENT ON COLUMN notification_log.status IS 'Delivery status: pending, sent, failed, or delivered';
COMMENT ON COLUMN notification_log.external_id IS 'Message ID from external service for tracking';
