-- Migration: Add login_audit table for sign-in auditing
-- Date: 2026-02-09
-- Description: Stores successful and failed sign-in attempts for staff and clients

CREATE TABLE IF NOT EXISTS login_audit (
  id BIGSERIAL PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('staff', 'client')),
  user_id BIGINT NULL,
  identifier TEXT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_audit_created_at ON login_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_user_type ON login_audit(user_type);
CREATE INDEX IF NOT EXISTS idx_login_audit_user_id ON login_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_success ON login_audit(success);
CREATE INDEX IF NOT EXISTS idx_login_audit_identifier ON login_audit(identifier);

COMMENT ON TABLE login_audit IS 'Audit log of staff/client sign-in attempts (success and failure).';
