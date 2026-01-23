# Convex Schema Indexes Documentation

This document lists all indexes defined in the Convex schema for query optimization.

## Staff Users Table
- `by_employee_id` - Index on employee_id for staff login
- `by_phone` - Index on phone for staff lookup
- `by_name` - Index on name for staff search

## Clients Table
- `by_x_number` - Index on x_number for client lookup (primary identifier)
- `by_phone` - Index on phone for client search
- `by_name` - Index on name for client search
- `by_active` - Index on is_active for filtering active clients
- `by_reliability_score` - Index on reliability_score for anti-abuse scoring

## Departments Table
- `by_name` - Index on name for department lookup
- `by_active` - Index on is_active for filtering active departments

## Doctors Table
- `by_department` - Index on department_id for finding doctors by department
- `by_name` - Index on name for doctor search
- `by_active` - Index on is_active for filtering active doctors

## Appointments Table (Most Critical)
- `by_date_department` - Composite index on [appointment_date, department_id] for calendar views
- `by_client` - Index on client_id for client appointment history
- `by_department_date_slot` - Composite index on [department_id, appointment_date, slot_number] for uniqueness and slot availability checks
- `by_date_range` - Index on appointment_date for date range queries
- `by_doctor` - Index on doctor_id for doctor schedules
- `by_client_status` - Composite index on [client_id, status] for filtering client appointments by status
- `by_date_status` - Composite index on [appointment_date, status] for dashboard statistics

## Department Availability Table
- `by_department_date` - Composite index on [department_id, date] for availability overrides
- `by_date` - Index on date for finding all department overrides on a specific date

## System Settings Table
- `by_key` - Index on setting_key for fast settings lookup

## Client Penalties Table (Anti-Abuse)
- `by_client` - Index on client_id for finding all penalties for a client
- `by_client_active` - Composite index on [client_id, is_active] for finding active penalties
- `by_client_date` - Composite index on [client_id, penalty_date] for penalty history

## Rate Limit Attempts Table
- `by_ip_timestamp` - Composite index on [ip, timestamp] for IP-based rate limiting
- `by_x_number_timestamp` - Composite index on [x_number, timestamp] for X-number-based rate limiting

## Abuse Detection Logs Table
- `by_client` - Index on client_id for finding abuse logs for a client
- `by_client_date` - Composite index on [client_id, _creationTime] for chronological abuse history
- `by_severity` - Index on severity for filtering by severity level

## Index Coverage Analysis

### Common Query Patterns Covered:
1. ✅ Client lookup by X-number (by_x_number)
2. ✅ Client search by name/phone (by_name, by_phone)
3. ✅ Appointments by date range (by_date_range)
4. ✅ Appointments by department and date (by_date_department)
5. ✅ Available slots check (by_department_date_slot)
6. ✅ Client appointment history (by_client)
7. ✅ Doctor schedules (by_doctor)
8. ✅ Active penalties check (by_client_active)
9. ✅ Rate limiting by IP (by_ip_timestamp)
10. ✅ Rate limiting by X-number (by_x_number_timestamp)
11. ✅ Department availability overrides (by_department_date)
12. ✅ Dashboard statistics (by_date_status)

### Performance Considerations:
- All foreign key relationships have indexes for efficient joins
- Composite indexes are used for multi-field queries
- Date-based queries are optimized with dedicated indexes
- Anti-abuse queries are optimized with composite indexes

## Requirements Validation

This schema satisfies:
- **Requirement 1.1**: All PostgreSQL tables migrated to Convex
- **Requirement 1.3**: All data types and constraints preserved
- **Requirement 1.4**: Indexes defined for optimized query performance
- **Requirement 1.5**: Separate staff_users and clients tables
- **Requirement 1.6**: JSONB fields converted to appropriate Convex types
- **Requirement 1.7**: Timestamp fields using Convex's built-in support
