-- Migration: Add Row Level Security Policies
-- Date: 2026-02-09
-- Description: Comprehensive RLS policies for all tables to secure data access
-- Note: Since we use custom session-based auth (not Supabase Auth),
-- these policies allow access to all authenticated users via anon key.
-- Security is enforced at the API layer (service role key).

-- Enable RLS on all tables first
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_statuses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE
-- ============================================

-- Allow service role full access (API routes)
DROP POLICY IF EXISTS "Service role has full access to users" ON users;
CREATE POLICY "Service role has full access to users"
ON users FOR ALL
USING (auth.role() = 'service_role');

-- Allow anon key access for custom auth (API filters data)
DROP POLICY IF EXISTS "Allow anon access to users" ON users;
CREATE POLICY "Allow anon access to users"
ON users FOR ALL
USING (auth.role() = 'anon');

-- ============================================
-- CLIENTS TABLE
-- ============================================

-- Service role full access
DROP POLICY IF EXISTS "Service role has full access to clients" ON clients;
CREATE POLICY "Service role has full access to clients"
ON clients FOR ALL
USING (auth.role() = 'service_role');

-- Allow anon key access for custom auth (API filters data)
DROP POLICY IF EXISTS "Allow anon access to clients" ON clients;
CREATE POLICY "Allow anon access to clients"
ON clients FOR ALL
USING (auth.role() = 'anon');

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

-- Service role full access
DROP POLICY IF EXISTS "Service role has full access to appointments" ON appointments;
CREATE POLICY "Service role has full access to appointments"
ON appointments FOR ALL
USING (auth.role() = 'service_role');

-- Allow anon key access for custom auth (API filters data)
DROP POLICY IF EXISTS "Allow anon access to appointments" ON appointments;
CREATE POLICY "Allow anon access to appointments"
ON appointments FOR ALL
USING (auth.role() = 'anon');

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================

-- Allow anon key access for custom auth (API filters data)
DROP POLICY IF EXISTS "Allow anon access to departments" ON departments;
CREATE POLICY "Allow anon access to departments"
ON departments FOR ALL
USING (auth.role() = 'anon');

-- Service role can manage
DROP POLICY IF EXISTS "Service role can manage departments" ON departments;
CREATE POLICY "Service role can manage departments"
ON departments FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- OTP_CODES TABLE (Most Sensitive!)
-- ============================================

-- Service role full access (backend only)
DROP POLICY IF EXISTS "Service role has full access to otp_codes" ON otp_codes;
CREATE POLICY "Service role has full access to otp_codes"
ON otp_codes FOR ALL
USING (auth.role() = 'service_role');

-- No anon access - only backend can read/write OTPs

-- ============================================
-- IN_APP_NOTIFICATIONS TABLE
-- ============================================

-- Service role full access
DROP POLICY IF EXISTS "Service role has full access to notifications" ON in_app_notifications;
CREATE POLICY "Service role has full access to notifications"
ON in_app_notifications FOR ALL
USING (auth.role() = 'service_role');

-- Allow anon key access for custom auth (API filters data)
DROP POLICY IF EXISTS "Allow anon access to notifications" ON in_app_notifications;
CREATE POLICY "Allow anon access to notifications"
ON in_app_notifications FOR ALL
USING (auth.role() = 'anon');

-- ============================================
-- LOGIN_AUDIT TABLE
-- ============================================

-- Service role full access
DROP POLICY IF EXISTS "Service role has full access to login audit" ON login_audit;
CREATE POLICY "Service role has full access to login audit"
ON login_audit FOR ALL
USING (auth.role() = 'service_role');

-- No anon access - only backend can access login audit

-- ============================================
-- APP_FEEDBACK TABLE
-- ============================================

-- Service role full access
DROP POLICY IF EXISTS "Service role has full access to feedback" ON app_feedback;
CREATE POLICY "Service role has full access to feedback"
ON app_feedback FOR ALL
USING (auth.role() = 'service_role');

-- Allow anon key access for custom auth (API filters data)
DROP POLICY IF EXISTS "Allow anon access to feedback" ON app_feedback;
CREATE POLICY "Allow anon access to feedback"
ON app_feedback FOR ALL
USING (auth.role() = 'anon');

-- ============================================
-- NOTIFICATION_LOG TABLE
-- ============================================

-- Service role full access
DROP POLICY IF EXISTS "Service role has full access to notification log" ON notification_log;
CREATE POLICY "Service role has full access to notification log"
ON notification_log FOR ALL
USING (auth.role() = 'service_role');

-- No anon access - only backend can access notification log

-- ============================================
-- PUSH_REMINDERS TABLE
-- ============================================

-- Service role full access
DROP POLICY IF EXISTS "Service role has full access to reminders" ON push_reminders;
CREATE POLICY "Service role has full access to reminders"
ON push_reminders FOR ALL
USING (auth.role() = 'service_role');

-- No anon access - only backend can access reminders

-- ============================================
-- USER_REMINDER_PREFERENCES TABLE
-- ============================================

-- Service role full access
DROP POLICY IF EXISTS "Service role has full access to reminder preferences" ON user_reminder_preferences;
CREATE POLICY "Service role has full access to reminder preferences"
ON user_reminder_preferences FOR ALL
USING (auth.role() = 'service_role');

-- Allow anon key access for custom auth (API filters data)
DROP POLICY IF EXISTS "Allow anon access to reminder preferences" ON user_reminder_preferences;
CREATE POLICY "Allow anon access to reminder preferences"
ON user_reminder_preferences FOR ALL
USING (auth.role() = 'anon');

-- ============================================
-- SYSTEM_SETTINGS TABLE
-- ============================================

-- Service role full access
DROP POLICY IF EXISTS "Service role has full access to system settings" ON system_settings;
CREATE POLICY "Service role has full access to system settings"
ON system_settings FOR ALL
USING (auth.role() = 'service_role');

-- Allow anon key access for custom auth (API filters data)
DROP POLICY IF EXISTS "Allow anon access to system settings" ON system_settings;
CREATE POLICY "Allow anon access to system settings"
ON system_settings FOR ALL
USING (auth.role() = 'anon');

-- ============================================
-- DEPARTMENT_AVAILABILITY TABLE
-- ============================================

-- Allow anon key access for custom auth (API filters data)
DROP POLICY IF EXISTS "Allow anon access to department availability" ON department_availability;
CREATE POLICY "Allow anon access to department availability"
ON department_availability FOR ALL
USING (auth.role() = 'anon');

-- Service role can manage
DROP POLICY IF EXISTS "Service role can manage department availability" ON department_availability;
CREATE POLICY "Service role can manage department availability"
ON department_availability FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- APPOINTMENT_STATUSES TABLE (Lookup table)
-- ============================================

-- Allow anon key access for custom auth (API filters data)
DROP POLICY IF EXISTS "Allow anon access to appointment statuses" ON appointment_statuses;
CREATE POLICY "Allow anon access to appointment statuses"
ON appointment_statuses FOR ALL
USING (auth.role() = 'anon');

-- Service role can manage
DROP POLICY IF EXISTS "Service role can manage appointment statuses" ON appointment_statuses;
CREATE POLICY "Service role can manage appointment statuses"
ON appointment_statuses FOR ALL
USING (auth.role() = 'service_role');

