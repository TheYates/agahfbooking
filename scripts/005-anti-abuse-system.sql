-- Anti-abuse system database migration
-- This script adds tables and columns needed for the anti-abuse protection system

-- Add reliability score and restrictions to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS reliability_score INTEGER DEFAULT 100;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS booking_restrictions JSONB DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_penalty_date DATE;

-- Add tracking columns to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_arrival_time TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_by INTEGER REFERENCES users(id);

-- Create client penalties tracking table
CREATE TABLE IF NOT EXISTS client_penalties (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    penalty_type VARCHAR(50) NOT NULL, -- 'no_show', 'late_cancel', 'multiple_booking', 'abuse_detected'
    penalty_date DATE NOT NULL DEFAULT CURRENT_DATE,
    penalty_duration_days INTEGER NOT NULL,
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    applied_by INTEGER REFERENCES users(id), -- NULL for automatic penalties
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create abuse detection logs table
CREATE TABLE IF NOT EXISTS abuse_detection_logs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    detection_type VARCHAR(50) NOT NULL, -- 'rapid_booking', 'cross_dept_conflict', 'proxy_suspected'
    details JSONB,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    is_resolved BOOLEAN DEFAULT false,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointment history summary view for quick scoring
CREATE OR REPLACE VIEW client_appointment_summary AS
SELECT 
    c.id as client_id,
    c.name as client_name,
    c.x_number,
    c.reliability_score,
    COUNT(a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_shows,
    COUNT(CASE WHEN a.status = 'cancelled' AND a.cancelled_at > a.appointment_date - INTERVAL '24 hours' THEN 1 END) as last_minute_cancellations,
    ROUND(
        CASE 
            WHEN COUNT(a.id) > 0 THEN 
                (COUNT(CASE WHEN a.status = 'completed' THEN 1 END) * 100.0 / COUNT(a.id))
            ELSE 100 
        END, 1
    ) as completion_rate,
    MAX(a.appointment_date) as last_appointment_date,
    COUNT(CASE WHEN a.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as appointments_last_30_days
FROM clients c
LEFT JOIN appointments a ON c.id = a.client_id 
    AND a.created_at >= CURRENT_DATE - INTERVAL '6 months'
WHERE c.is_active = true
GROUP BY c.id, c.name, c.x_number, c.reliability_score;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_penalties_client_date ON client_penalties(client_id, penalty_date);
CREATE INDEX IF NOT EXISTS idx_client_penalties_active ON client_penalties(client_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_abuse_logs_client_date ON abuse_detection_logs(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_client_status ON appointments(client_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_clients_reliability_score ON clients(reliability_score);

-- Insert default anti-abuse settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES (
    'anti_abuse_settings',
    '{
        "bookingLimits": {
            "maxFutureDays": 30,
            "minAdvanceHours": 2,
            "maxDailyAppointments": 1,
            "maxPendingAppointments": 2,
            "maxSameDeptPending": 1
        },
        "cancellationRules": {
            "minCancelHours": 24,
            "maxCancellationsMonth": 3,
            "allowSameDayCancel": false,
            "requireCancelReason": true
        },
        "noShowPenalties": {
            "maxNoShowsMonth": 2,
            "firstOffenseDays": 3,
            "secondOffenseDays": 7,
            "thirdOffenseDays": 14,
            "chronicOffenderDays": 30,
            "autoApplyPenalties": true
        },
        "scoringSystem": {
            "enabled": true,
            "excellentThreshold": 90,
            "goodThreshold": 75,
            "averageThreshold": 60,
            "poorThreshold": 40,
            "showScoreToClients": true
        },
        "abuseDetection": {
            "enabled": true,
            "rapidBookingMinutes": 5,
            "crossDeptConflictCheck": true,
            "proxyBookingDetection": false,
            "alertAdminsOnAbuse": true
        }
    }',
    'Anti-abuse protection system settings'
) ON CONFLICT (setting_key) DO NOTHING;

-- Function to automatically update client reliability scores
CREATE OR REPLACE FUNCTION update_client_reliability_score(client_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_appointments INTEGER;
    completed_appointments INTEGER;
    no_shows INTEGER;
    last_minute_cancellations INTEGER;
    new_score INTEGER;
BEGIN
    -- Get appointment statistics for the last 6 months
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' THEN 1 END),
        COUNT(CASE WHEN status = 'no_show' THEN 1 END),
        COUNT(CASE WHEN status = 'cancelled' AND cancelled_at > appointment_date - INTERVAL '24 hours' THEN 1 END)
    INTO total_appointments, completed_appointments, no_shows, last_minute_cancellations
    FROM appointments 
    WHERE client_id = client_id_param 
    AND created_at >= CURRENT_DATE - INTERVAL '6 months';
    
    -- Calculate new score
    IF total_appointments = 0 THEN
        new_score := 100;
    ELSE
        new_score := GREATEST(0, LEAST(100, 
            ROUND((completed_appointments * 100.0 / total_appointments) - (no_shows * 10) - (last_minute_cancellations * 5))
        ));
    END IF;
    
    -- Update client score
    UPDATE clients 
    SET reliability_score = new_score, updated_at = CURRENT_TIMESTAMP
    WHERE id = client_id_param;
    
    RETURN new_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reliability score when appointment status changes
CREATE OR REPLACE FUNCTION trigger_update_client_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Update score when appointment status changes to completed, no_show, or cancelled
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status IN ('completed', 'no_show', 'cancelled')) OR
       (TG_OP = 'INSERT' AND NEW.status IN ('completed', 'no_show', 'cancelled')) THEN
        PERFORM update_client_reliability_score(NEW.client_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_client_score_trigger ON appointments;
CREATE TRIGGER update_client_score_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_client_score();

-- Comments for documentation
COMMENT ON TABLE client_penalties IS 'Tracks penalties applied to clients for no-shows, late cancellations, and abuse';
COMMENT ON TABLE abuse_detection_logs IS 'Logs suspicious booking patterns and potential abuse attempts';
COMMENT ON VIEW client_appointment_summary IS 'Summary view of client appointment statistics for quick scoring';
COMMENT ON FUNCTION update_client_reliability_score(INTEGER) IS 'Calculates and updates client reliability score based on appointment history';

-- Sample data for testing (optional)
-- Uncomment the following lines to add sample penalty data for testing

/*
-- Add some sample penalties for testing
INSERT INTO client_penalties (client_id, penalty_type, penalty_date, penalty_duration_days, reason, is_active) VALUES
((SELECT id FROM clients WHERE x_number = 'X12345/67' LIMIT 1), 'no_show', CURRENT_DATE - INTERVAL '5 days', 7, 'Failed to attend appointment without notice', false),
((SELECT id FROM clients WHERE x_number = 'X23456/78' LIMIT 1), 'late_cancel', CURRENT_DATE - INTERVAL '2 days', 3, 'Cancelled appointment 2 hours before scheduled time', true);

-- Add some sample abuse detection logs
INSERT INTO abuse_detection_logs (client_id, detection_type, details, severity) VALUES
((SELECT id FROM clients WHERE x_number = 'X34567/89' LIMIT 1), 'rapid_booking', '{"bookings_in_5_minutes": 3, "departments": ["General Medicine", "Cardiology"]}', 'medium'),
((SELECT id FROM clients WHERE x_number = 'X45678/90' LIMIT 1), 'cross_dept_conflict', '{"overlapping_appointments": [{"dept": "Pediatrics", "time": "10:00"}, {"dept": "Orthopedics", "time": "10:30"}]}', 'high');
*/
