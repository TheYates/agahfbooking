-- Performance optimization indexes for faster dashboard loading
-- Run these commands in your PostgreSQL database to improve query performance

-- Index for appointments by client_id and date (most common dashboard query)
CREATE INDEX IF NOT EXISTS idx_appointments_client_date_status 
ON appointments (client_id, appointment_date, status);

-- Index for appointments by department and date (for availability calculations)
CREATE INDEX IF NOT EXISTS idx_appointments_dept_date_status 
ON appointments (department_id, appointment_date, status);

-- Index for active departments (frequently queried)
CREATE INDEX IF NOT EXISTS idx_departments_active 
ON departments (is_active) WHERE is_active = true;

-- Index for active clients
CREATE INDEX IF NOT EXISTS idx_clients_active 
ON clients (is_active) WHERE is_active = true;

-- Index for active doctors with department
CREATE INDEX IF NOT EXISTS idx_doctors_active_dept 
ON doctors (is_active, department_id) WHERE is_active = true;

-- Composite index for appointment date range queries
CREATE INDEX IF NOT EXISTS idx_appointments_date_range 
ON appointments (appointment_date, status, client_id);

-- Index for monthly appointment aggregations
CREATE INDEX IF NOT EXISTS idx_appointments_month_client 
ON appointments (date_trunc('month', appointment_date), client_id, status);

-- Analyze tables to update statistics
ANALYZE appointments;
ANALYZE departments;
ANALYZE clients;
ANALYZE doctors;

-- Optional: Create partial indexes for specific status queries
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming 
ON appointments (client_id, appointment_date) 
WHERE status NOT IN ('cancelled', 'completed', 'no_show');

CREATE INDEX IF NOT EXISTS idx_appointments_completed 
ON appointments (client_id) 
WHERE status = 'completed';
