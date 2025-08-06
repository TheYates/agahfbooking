-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, updated_by) 
VALUES (
  'system_settings', 
  '{"maxAdvanceBookingDays": 14, "multipleAppointmentsAllowed": false, "sameDayBookingAllowed": false, "defaultSlotsPerDay": 10, "sessionDurationHours": 24, "sessionTimeoutMinutes": 60, "recurringAppointmentsEnabled": false, "waitlistEnabled": false, "emergencySlotsEnabled": false, "antiAbuseSettings": {"maxFutureDays": 30, "minAdvanceHours": 1}, "clientCalendarVisibility": "own_only"}',
  'Main system configuration settings',
  5
) 
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_by = EXCLUDED.updated_by,
  updated_at = CURRENT_TIMESTAMP;
