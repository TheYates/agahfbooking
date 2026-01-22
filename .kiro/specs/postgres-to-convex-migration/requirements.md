# Requirements Document: PostgreSQL to Convex Migration

## Introduction

This document outlines the requirements for migrating the AGAHF Hospital Booking Application from a PostgreSQL database with Next.js API routes to Convex, a serverless database platform with built-in real-time capabilities. The migration aims to modernize the application architecture, improve real-time functionality, and simplify the codebase while maintaining all existing features and data integrity.

## Glossary

- **System**: The AGAHF Hospital Booking Application
- **PostgreSQL**: The current relational database management system
- **Convex**: The target serverless database platform with built-in real-time subscriptions
- **Convex_Auth**: Convex's authentication system replacing better-auth
- **Convex_Function**: Server-side functions (queries, mutations, actions) in Convex
- **Convex_Schema**: Type-safe database schema definition in Convex
- **TanStack_Query**: Current React state management library for server state
- **Convex_React_Hooks**: Convex's built-in React hooks replacing TanStack Query
- **GraphQL_Resolver**: Current Apollo Server GraphQL resolvers
- **Migration_Script**: Data migration utility to transfer data from PostgreSQL to Convex
- **Staff_User**: Hospital staff (receptionist or admin) with password authentication
- **Client_User**: Hospital patient with OTP-based authentication
- **Appointment**: A scheduled hospital visit for a client
- **Department**: A hospital department/specialization with working schedules
- **Real_Time_Subscription**: Live data updates without polling
- **Rate_Limiter**: Anti-abuse system to prevent excessive login attempts
- **SMS_Service**: Hubtel integration for sending OTP codes
- **Working_Schedule**: Department availability configuration (days, hours, slots)

## Requirements

### Requirement 1: Database Schema Migration

**User Story:** As a developer, I want to convert the PostgreSQL schema to Convex schema, so that all database tables and relationships are preserved in the new system.

#### Acceptance Criteria

1. THE System SHALL define a Convex schema that includes all tables from PostgreSQL (users, clients, departments, doctors, appointments, system_settings, department_availability, client_penalties)
2. WHEN defining relationships, THE System SHALL use Convex document references to maintain foreign key relationships
3. THE System SHALL preserve all data types and constraints from PostgreSQL schema
4. THE System SHALL define indexes in Convex schema for optimized query performance
5. THE System SHALL separate the users table into staff_users and clients tables for clearer data modeling
6. THE System SHALL convert JSONB fields (working_days, working_hours) to appropriate Convex types
7. THE System SHALL maintain all timestamp fields (created_at, updated_at) using Convex's built-in timestamp support

### Requirement 2: Authentication System Migration

**User Story:** As a hospital staff member, I want to log in with my username and password, so that I can access the booking system securely.

#### Acceptance Criteria

1. WHEN a staff user provides valid credentials, THE Convex_Auth SHALL authenticate them and create a session
2. THE System SHALL migrate password hashes from PostgreSQL to Convex without requiring password resets
3. THE System SHALL support role-based access control (admin, receptionist) using Convex Auth
4. THE System SHALL maintain session duration of 24 hours as configured in current system
5. THE System SHALL provide server-side authentication helpers equivalent to requireAuth, requireAdminAuth, requireStaffAuth

### Requirement 3: OTP Authentication Migration

**User Story:** As a hospital client, I want to log in using my X-number and OTP, so that I can book appointments without remembering passwords.

#### Acceptance Criteria

1. WHEN a client requests OTP, THE System SHALL generate a JWT-based OTP token
2. THE System SHALL send OTP via Hubtel SMS service maintaining current integration
3. WHEN OTP is verified, THE Convex_Auth SHALL create a client session
4. THE System SHALL support both mock OTP mode (development) and real OTP mode (production)
5. THE System SHALL maintain OTP expiration of 10 minutes
6. THE System SHALL preserve rate limiting for OTP requests to prevent abuse

### Requirement 4: Database Query Migration

**User Story:** As a developer, I want to convert all PostgreSQL queries to Convex queries, so that all data operations work correctly in the new system.

#### Acceptance Criteria

1. THE System SHALL convert all SELECT queries to Convex query functions
2. THE System SHALL convert all INSERT/UPDATE/DELETE operations to Convex mutation functions
3. THE System SHALL maintain transaction support for multi-step operations (e.g., appointment booking with slot validation)
4. THE System SHALL convert complex JOIN queries to Convex queries using document references
5. THE System SHALL preserve all query optimizations and indexes
6. THE System SHALL convert aggregate queries (COUNT, SUM) to Convex equivalents
7. THE System SHALL maintain pagination support for large result sets

### Requirement 5: API Routes Migration

**User Story:** As a developer, I want to convert Next.js API routes to Convex functions, so that all backend logic is centralized in Convex.

#### Acceptance Criteria

1. THE System SHALL convert all REST API endpoints to Convex query or mutation functions
2. THE System SHALL migrate GraphQL resolvers to Convex functions
3. THE System SHALL preserve all business logic from API routes in Convex functions
4. THE System SHALL maintain error handling and validation in Convex functions
5. THE System SHALL convert middleware (authentication, rate limiting) to Convex function wrappers
6. THE System SHALL preserve all API response formats for backward compatibility during transition

### Requirement 6: Real-Time Subscriptions Implementation

**User Story:** As a receptionist, I want to see appointment updates in real-time, so that I can coordinate bookings without manual refreshes.

#### Acceptance Criteria

1. WHEN an appointment is created, THE System SHALL broadcast the update to all connected clients viewing that date
2. WHEN an appointment status changes, THE System SHALL update all calendar views in real-time
3. THE System SHALL replace polling-based updates with Convex subscriptions
4. THE System SHALL maintain real-time updates for dashboard statistics
5. THE System SHALL implement real-time updates for department availability
6. THE System SHALL ensure real-time updates do not cause performance degradation

### Requirement 7: State Management Migration

**User Story:** As a developer, I want to replace TanStack Query with Convex React hooks, so that data fetching is simplified and real-time by default.

#### Acceptance Criteria

1. THE System SHALL replace useQuery hooks with Convex useQuery hooks
2. THE System SHALL replace useMutation hooks with Convex useMutation hooks
3. THE System SHALL remove TanStack Query configuration and QueryClient setup
4. THE System SHALL maintain loading and error states in UI components
5. THE System SHALL preserve optimistic updates where currently implemented
6. THE System SHALL remove manual cache invalidation logic (handled automatically by Convex)

### Requirement 8: SMS Integration Preservation

**User Story:** As a system administrator, I want to maintain Hubtel SMS integration, so that OTP codes continue to be delivered to clients.

#### Acceptance Criteria

1. THE System SHALL preserve Hubtel API integration for sending SMS
2. THE System SHALL maintain OTP message formatting and branding
3. THE System SHALL support both mock mode and production mode for SMS sending
4. THE System SHALL log SMS sending results for debugging
5. THE System SHALL handle SMS sending failures gracefully without blocking authentication

### Requirement 9: Rate Limiting and Anti-Abuse Migration

**User Story:** As a system administrator, I want to maintain rate limiting and anti-abuse features, so that the system remains secure and prevents misuse.

#### Acceptance Criteria

1. THE System SHALL migrate rate limiting logic to Convex actions or mutations
2. THE System SHALL preserve IP-based rate limiting for login attempts
3. THE System SHALL maintain X-number-based rate limiting
4. THE System SHALL preserve progressive security (CAPTCHA thresholds, blocking)
5. THE System SHALL migrate anti-abuse booking validation rules to Convex
6. THE System SHALL maintain client scoring system for reliability tracking
7. THE System SHALL preserve penalty system for no-shows and late cancellations

### Requirement 10: Working Schedule and Availability Migration

**User Story:** As a receptionist, I want department working schedules to function correctly, so that I can only book appointments during available times.

#### Acceptance Criteria

1. THE System SHALL migrate working_days and working_hours from JSONB to Convex schema
2. THE System SHALL preserve working day validation logic
3. THE System SHALL maintain department availability overrides for holidays
4. THE System SHALL calculate available slots correctly based on working schedules
5. THE System SHALL prevent bookings outside working hours
6. THE System SHALL maintain slot-per-day configuration per department

### Requirement 11: Data Migration Strategy

**User Story:** As a system administrator, I want to migrate existing data from PostgreSQL to Convex, so that no historical data is lost during the transition.

#### Acceptance Criteria

1. THE Migration_Script SHALL export all data from PostgreSQL in a structured format
2. THE Migration_Script SHALL import data into Convex preserving all relationships
3. THE Migration_Script SHALL validate data integrity after migration
4. THE Migration_Script SHALL provide rollback capability in case of migration failure
5. THE Migration_Script SHALL migrate data in batches to handle large datasets
6. THE Migration_Script SHALL preserve all timestamps and audit fields
7. THE Migration_Script SHALL generate a migration report showing success/failure counts

### Requirement 12: Dashboard and Statistics Migration

**User Story:** As an administrator, I want dashboard statistics to update in real-time, so that I can monitor system usage without refreshing.

#### Acceptance Criteria

1. THE System SHALL migrate dashboard statistics queries to Convex
2. THE System SHALL implement real-time updates for appointment counts
3. THE System SHALL maintain department utilization calculations
4. THE System SHALL preserve client statistics and scoring displays
5. THE System SHALL update dashboard charts in real-time using Convex subscriptions

### Requirement 13: Calendar View Migration

**User Story:** As a receptionist, I want the calendar view to show real-time updates, so that I can see new bookings immediately without refreshing.

#### Acceptance Criteria

1. THE System SHALL migrate calendar data fetching to Convex queries
2. THE System SHALL implement real-time subscription for calendar appointments
3. THE System SHALL maintain calendar filtering by department and date range
4. THE System SHALL preserve calendar UI interactions and slot selection
5. THE System SHALL update available slots in real-time as bookings occur

### Requirement 14: Client Management Migration

**User Story:** As a receptionist, I want to search and manage clients, so that I can quickly find client information and book appointments.

#### Acceptance Criteria

1. THE System SHALL migrate client search functionality to Convex queries
2. THE System SHALL maintain client CRUD operations using Convex mutations
3. THE System SHALL preserve client category management
4. THE System SHALL maintain client appointment history queries
5. THE System SHALL implement real-time updates for client lists

### Requirement 15: Department and Doctor Management Migration

**User Story:** As an administrator, I want to manage departments and doctors, so that I can configure the system for hospital operations.

#### Acceptance Criteria

1. THE System SHALL migrate department CRUD operations to Convex mutations
2. THE System SHALL maintain doctor-department relationships
3. THE System SHALL preserve department configuration (slots, working days, colors)
4. THE System SHALL migrate doctor assignment logic to Convex
5. THE System SHALL maintain department availability management

### Requirement 16: Appointment Booking Migration

**User Story:** As a receptionist, I want to book appointments for clients, so that I can schedule hospital visits efficiently.

#### Acceptance Criteria

1. THE System SHALL migrate appointment creation to Convex mutations with transaction support
2. THE System SHALL validate slot availability before booking using Convex queries
3. THE System SHALL prevent double-booking through Convex's consistency guarantees
4. THE System SHALL maintain appointment status workflow (booked, arrived, completed, etc.)
5. THE System SHALL preserve appointment notes and doctor assignment
6. THE System SHALL validate booking rules (advance booking limits, same-day restrictions)

### Requirement 17: System Settings Migration

**User Story:** As an administrator, I want to configure system settings, so that I can control booking rules and system behavior.

#### Acceptance Criteria

1. THE System SHALL migrate system_settings table to Convex
2. THE System SHALL maintain settings CRUD operations
3. THE System SHALL preserve all current settings (max_advance_booking_days, etc.)
4. THE System SHALL support dynamic settings updates without code changes
5. THE System SHALL maintain anti-abuse settings configuration

### Requirement 18: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can debug issues and monitor system health.

#### Acceptance Criteria

1. THE System SHALL implement error handling in all Convex functions
2. THE System SHALL log errors with context for debugging
3. THE System SHALL maintain user-friendly error messages
4. THE System SHALL preserve error tracking for failed operations
5. THE System SHALL implement retry logic for transient failures

### Requirement 19: Performance Optimization

**User Story:** As a user, I want the system to respond quickly, so that I can complete tasks efficiently.

#### Acceptance Criteria

1. THE System SHALL maintain or improve query performance compared to PostgreSQL
2. THE System SHALL implement appropriate indexes in Convex schema
3. THE System SHALL optimize real-time subscriptions to minimize bandwidth
4. THE System SHALL implement pagination for large result sets
5. THE System SHALL cache frequently accessed data where appropriate

### Requirement 20: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for the migrated system, so that I can ensure all functionality works correctly.

#### Acceptance Criteria

1. THE System SHALL include unit tests for all Convex functions
2. THE System SHALL include integration tests for critical workflows (booking, authentication)
3. THE System SHALL validate data migration accuracy
4. THE System SHALL test real-time subscription behavior
5. THE System SHALL verify authentication and authorization rules
6. THE System SHALL test error handling and edge cases

### Requirement 21: Deployment and Rollback Strategy

**User Story:** As a system administrator, I want a safe deployment strategy, so that I can migrate to Convex with minimal downtime and risk.

#### Acceptance Criteria

1. THE System SHALL support a phased rollout approach (feature flags or parallel deployment)
2. THE System SHALL provide a rollback plan to PostgreSQL if critical issues arise
3. THE System SHALL minimize downtime during migration (target: < 1 hour)
4. THE System SHALL validate system functionality in staging before production deployment
5. THE System SHALL maintain data consistency during the transition period
6. THE System SHALL provide monitoring and alerting for the new Convex-based system
