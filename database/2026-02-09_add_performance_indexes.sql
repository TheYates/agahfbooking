-- Migration: Add performance indexes
-- Date: 2026-02-09
-- Description: Adds database indexes to improve query performance across the system

-- ============================================
-- CLIENTS TABLE INDEXES
-- ============================================

-- Full-text search index for clients (name, x_number, phone)
CREATE INDEX IF NOT EXISTS idx_clients_search_trgm ON clients USING gin(
  (lower(name) || ' ' || lower(COALESCE(x_number, '')) || ' ' || lower(COALESCE(phone, ''))) gin_trgm_ops
);

-- Individual field indexes for exact matches
CREATE INDEX IF NOT EXISTS idx_clients_x_number ON clients(x_number) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_clients_name_lower ON clients(lower(name)) WHERE is_active = true;

-- Active clients with created_at for listing
CREATE INDEX IF NOT EXISTS idx_clients_active_created ON clients(created_at DESC) WHERE is_active = true;

-- ============================================
-- APPOINTMENTS TABLE INDEXES
-- ============================================

-- Composite index for date-based queries with status
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date DESC, status);

-- Department + date for schedule generation
CREATE INDEX IF NOT EXISTS idx_appointments_dept_date ON appointments(department_id, appointment_date);

-- Client appointments lookup
CREATE INDEX IF NOT EXISTS idx_appointments_client_date ON appointments(client_id, appointment_date DESC);

-- Slot availability queries
CREATE INDEX IF NOT EXISTS idx_appointments_dept_date_slot ON appointments(department_id, appointment_date, slot_number);

-- Status-based queries (pending reviews, etc.)
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments(status, appointment_date DESC);

-- ============================================
-- DEPARTMENTS TABLE INDEXES
-- ============================================

-- Active departments ordering
CREATE INDEX IF NOT EXISTS idx_departments_active_name ON departments(name) WHERE is_active = true;

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Username lookup (login)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE is_active = true;

-- Role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role) WHERE is_active = true;

-- ============================================
-- NOTIFICATION TABLES INDEXES
-- (Already exist from previous migrations, but adding here for completeness)
-- ============================================

-- in_app_notifications - user unread lookup (already exists)
-- CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON in_app_notifications(user_id);
-- CREATE INDEX IF NOT EXISTS idx_in_app_notifications_is_read ON in_app_notifications(user_id, is_read);

-- ============================================
-- ENABLE pg_trgm EXTENSION (if not already enabled)
-- ============================================

-- Required for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update statistics for query planner
ANALYZE clients;
ANALYZE appointments;
ANALYZE departments;
ANALYZE users;

COMMENT ON INDEX idx_clients_search_trgm IS 'Full-text search index for client name, x_number, and phone';
COMMENT ON INDEX idx_appointments_date_status IS 'Composite index for date-based queries with status filtering';
COMMENT ON INDEX idx_appointments_dept_date_slot IS 'Slot availability lookup for booking system';
