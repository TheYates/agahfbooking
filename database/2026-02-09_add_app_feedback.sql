-- Migration: Add app feedback system
-- Date: 2026-02-09
-- Description: Creates app_feedback table for clients to submit feedback, bug reports, and feature requests

CREATE TABLE IF NOT EXISTS app_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'staff', 'admin', 'guest')),
  user_name TEXT,
  user_contact TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature_request', 'feedback', 'question', 'other')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_feedback_user_id ON app_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_app_feedback_status ON app_feedback(status);
CREATE INDEX IF NOT EXISTS idx_app_feedback_type ON app_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_app_feedback_created_at ON app_feedback(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION set_app_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_feedback_updated_at ON app_feedback;
CREATE TRIGGER app_feedback_updated_at
  BEFORE UPDATE ON app_feedback
  FOR EACH ROW
  EXECUTE FUNCTION set_app_feedback_updated_at();

COMMENT ON TABLE app_feedback IS 'General app feedback, bug reports, and feature requests from users';
COMMENT ON COLUMN app_feedback.user_type IS 'Type of user submitting feedback';
COMMENT ON COLUMN app_feedback.feedback_type IS 'Category of feedback: bug, feature_request, feedback, question, other';
COMMENT ON COLUMN app_feedback.status IS 'Processing status: pending, in_progress, resolved, closed';
