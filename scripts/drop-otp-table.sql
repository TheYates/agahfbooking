-- Drop OTP codes table (no longer needed with JWT-based OTP)
-- This table was used for database-based OTP storage

-- Drop indexes first
DROP INDEX IF EXISTS idx_otp_x_number;

-- Drop the table
DROP TABLE IF EXISTS otp_codes;

-- Confirmation message
SELECT 'OTP codes table and related indexes have been dropped successfully' AS message;
