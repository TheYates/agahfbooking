 -- Users table (clients, receptionists, admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    x_number VARCHAR(10) UNIQUE NOT NULL, -- Format: X12345/67
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'client', -- client, receptionist, admin
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments/Specializations table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    slots_per_day INTEGER DEFAULT 10,
    working_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]',
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table (for reference/tracking purposes)
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Department availability table
CREATE TABLE department_availability (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id),
    date DATE NOT NULL,
    available_slots INTEGER NOT NULL DEFAULT 10,
    is_available BOOLEAN DEFAULT true,
    reason VARCHAR(255), -- holiday, reduced capacity, etc.
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id),
    department_id INTEGER REFERENCES departments(id),
    doctor_id INTEGER REFERENCES doctors(id), -- optional: which specific doctor if assigned
    appointment_date DATE NOT NULL,
    slot_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'booked', -- booked, arrived, waiting, completed, no_show, cancelled
    notes TEXT,
    booked_by INTEGER REFERENCES users(id), -- who booked it (client or receptionist)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id, appointment_date, slot_number)
);

-- Appointment status types (configurable by admin)
CREATE TABLE appointment_statuses (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    status_color VARCHAR(7), -- hex color code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP table for authentication
CREATE TABLE otp_codes (
    id SERIAL PRIMARY KEY,
    x_number VARCHAR(10) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('max_advance_booking_days', '14', 'Maximum days in advance clients can book'),
('multiple_appointments_allowed', 'false', 'Allow clients to have multiple future appointments'),
('same_day_booking_allowed', 'false', 'Allow same-day appointment booking'),
('default_slots_per_day', '10', 'Default number of slots per day'),
('session_duration_hours', '24', 'User session duration in hours'),
('recurring_appointments_enabled', 'false', 'Enable recurring appointments feature'),
('waitlist_enabled', 'false', 'Enable waitlist feature'),
('emergency_slots_enabled', 'false', 'Enable emergency slots feature');

-- Insert default appointment statuses
INSERT INTO appointment_statuses (status_name, status_color) VALUES
('booked', '#3B82F6'),
('arrived', '#10B981'),
('waiting', '#F59E0B'),
('completed', '#059669'),
('no_show', '#EF4444'),
('cancelled', '#6B7280'),
('rescheduled', '#8B5CF6');

-- Insert sample categories (these will be imported daily)
INSERT INTO users (x_number, name, phone, category, role) VALUES
('X12345/67', 'John Doe', '+1234567890', 'PRIVATE CASH', 'client'),
('X98765/43', 'Jane Smith', '+0987654321', 'PUBLIC SPONSORED(NHIA)', 'client'),
('R00001/00', 'Mary Johnson', '+1122334455', 'STAFF', 'receptionist'),
('A00001/00', 'Dr. Admin', '+9988776655', 'STAFF', 'admin');

-- Insert sample departments
INSERT INTO departments (name, description, slots_per_day, working_days, working_hours, color) VALUES
('General Medicine', 'General medical consultations and primary care', 15, '["monday", "tuesday", "wednesday", "thursday", "friday"]', '{"start": "08:00", "end": "18:00"}', '#3B82F6'),
('Cardiology', 'Heart and cardiovascular system specialists', 10, '["monday", "tuesday", "wednesday", "thursday", "friday"]', '{"start": "09:00", "end": "17:00"}', '#EF4444'),
('Pediatrics', 'Medical care for infants, children, and adolescents', 12, '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]', '{"start": "08:00", "end": "16:00"}', '#10B981'),
('Orthopedics', 'Bone, joint, and musculoskeletal system care', 8, '["monday", "tuesday", "wednesday", "thursday", "friday"]', '{"start": "09:00", "end": "17:00"}', '#8B5CF6'),
('Dermatology', 'Skin, hair, and nail conditions', 10, '["monday", "tuesday", "wednesday", "thursday"]', '{"start": "10:00", "end": "16:00"}', '#F59E0B'),
('Gynecology', 'Women''s reproductive health', 10, '["monday", "tuesday", "wednesday", "thursday", "friday"]', '{"start": "09:00", "end": "17:00"}', '#EC4899'),
('Ophthalmology', 'Eye and vision care', 12, '["monday", "tuesday", "wednesday", "thursday", "friday"]', '{"start": "08:30", "end": "17:30"}', '#06B6D4'),
('ENT', 'Ear, nose, and throat specialists', 8, '["monday", "tuesday", "wednesday", "thursday", "friday"]', '{"start": "09:00", "end": "16:00"}', '#84CC16');

-- Insert sample doctors (linked to departments)
INSERT INTO doctors (name, department_id) VALUES
('Dr. Sarah Wilson', 1), -- General Medicine
('Dr. Michael Brown', 2), -- Cardiology
('Dr. Emily Davis', 3), -- Pediatrics
('Dr. James Miller', 4), -- Orthopedics
('Dr. Lisa Anderson', 5); -- Dermatology

-- Create indexes for better performance
CREATE INDEX idx_appointments_date_department ON appointments(appointment_date, department_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_users_x_number ON users(x_number);
CREATE INDEX idx_otp_x_number ON otp_codes(x_number, expires_at);
CREATE INDEX idx_department_availability_date ON department_availability(department_id, date);
