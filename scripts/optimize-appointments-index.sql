-- 🚀 CRITICAL INDEX for Appointments List Performance
-- This will dramatically speed up the slow 10+ second queries

-- Drop existing index if it exists and recreate optimized version
DROP INDEX IF EXISTS idx_appointments_list_optimized;

-- Create the PERFECT composite index for appointments list queries
CREATE INDEX CONCURRENTLY idx_appointments_list_optimized 
ON appointments (appointment_date DESC, status, client_id, department_id) 
INCLUDE (id, slot_number, notes, created_at);

-- Additional index for filtered queries (search functionality)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_search
ON appointments (status, appointment_date DESC)
WHERE status IS NOT NULL;

-- Index for client-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_client_filter
ON appointments (client_id, appointment_date DESC, status);

-- Index for department-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_dept_filter  
ON appointments (department_id, appointment_date DESC, status);

-- Update table statistics for query planner
ANALYZE appointments;

-- Verify index usage
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
  a.id,
  a.client_id,
  a.department_id,
  a.appointment_date,
  a.slot_number,
  a.status,
  a.notes,
  a.created_at,
  COUNT(*) OVER() as total_count
FROM appointments a
WHERE 1=1
ORDER BY a.appointment_date DESC, a.slot_number ASC
LIMIT 20 OFFSET 0;

-- Expected result: Should show "Index Scan" instead of "Seq Scan"
-- Target: Sub-100ms query time instead of 10+ seconds