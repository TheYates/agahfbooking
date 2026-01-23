# Implementation Plan: PostgreSQL to Convex Migration

## Overview

This implementation plan breaks down the migration from PostgreSQL to Convex into discrete, manageable tasks. Each task builds on previous steps and includes validation checkpoints. The plan follows a phased approach: Setup → Core Backend → Frontend → Data Migration → Testing → Deployment.

## Tasks

- [x] 1. Project Setup and Configuration
  - Initialize Convex project in the existing Next.js application
  - Install required dependencies (@convex-dev/auth, fast-check for testing)
  - Configure Convex environment variables
  - Set up Convex development environment
  - _Requirements: 1.1, 1.2_

- [x] 2. Define Convex Schema
  - [x] 2.1 Create schema.ts with all table definitions
    - Define staff_users, clients, departments, doctors tables
    - Define appointments, department_availability tables
    - Define system_settings, client_penalties, rate_limit_attempts tables
    - Include Convex Auth tables using authTables
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 2.2 Write property test for schema validation
    - **Property 17: Data Migration Relationship Preservation**
    - **Validates: Requirements 11.2**
  
  - [x] 2.3 Define all indexes for query optimization
    - Add indexes for common query patterns (by_x_number, by_date_department, etc.)
    - Add composite indexes for uniqueness constraints
    - _Requirements: 1.4_

- [-] 3. Implement Authentication System
  - [x] 3.1 Set up Convex Auth configuration
    - Create convex/auth.ts with Password provider
    - Configure session duration and settings
    - _Requirements: 2.1, 2.4_
  
  - [x] 3.2 Implement staff login mutation
    - Create staffLogin mutation with password verification
    - Implement bcrypt password comparison
    - Create Convex Auth session on successful login
    - _Requirements: 2.1, 2.3_
  
  - [x] 3.3 Write property test for staff authentication
    - **Property 1: Authentication Credential Validation**
    - **Validates: Requirements 2.1, 2.3**
  
  - [x] 3.4 Implement OTP provider
    - Create sendOTP mutation with JWT generation
    - Create verifyOTP mutation with JWT verification
    - Integrate Hubtel SMS service
    - Support mock mode for development
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [-] 3.5 Write property test for OTP round trip
    - **Property 2: OTP Generation and Verification Round Trip**
    - **Validates: Requirements 3.1, 3.3**
  
  - [ ] 3.6 Write property test for OTP expiration
    - **Property 3: OTP Expiration Enforcement**
    - **Validates: Requirements 3.5**
  
  - [ ] 3.7 Implement authentication helpers
    - Create requireAuth, requireStaffAuth, requireClientAuth helpers
    - Implement role-based access control checks
    - _Requirements: 2.5_

- [ ] 4. Checkpoint - Authentication System
  - Ensure all authentication tests pass, ask the user if questions arise.

- [ ] 5. Implement Rate Limiting and Anti-Abuse
  - [ ] 5.1 Create rate limiting action
    - Implement checkRateLimit action with IP and X-number tracking
    - Implement recordAttempt mutation
    - Add progressive security (CAPTCHA thresholds, blocking)
    - _Requirements: 3.6, 9.2, 9.3, 9.4_
  
  - [ ] 5.2 Write property test for rate limiting
    - **Property 4: Rate Limiting Enforcement**
    - **Validates: Requirements 3.6, 9.2, 9.3, 9.4**
  
  - [ ] 5.3 Implement anti-abuse validation functions
    - Create validateBookingRules helper
    - Implement client scoring calculation
    - Implement penalty application logic
    - _Requirements: 9.6, 9.7_
  
  - [ ] 5.4 Write property test for client scoring
    - **Property 11: Client Reliability Scoring**
    - **Validates: Requirements 9.6**
  
  - [ ] 5.5 Write property test for penalty escalation
    - **Property 12: Penalty Escalation**
    - **Validates: Requirements 9.7**

- [ ] 6. Implement Core Query Functions
  - [ ] 6.1 Create client queries
    - Implement getByXNumber, search, getAll queries
    - Add proper indexing and filtering
    - _Requirements: 4.1, 14.1_
  
  - [ ] 6.2 Create department queries
    - Implement getAll, getById queries
    - Add working day validation logic
    - _Requirements: 4.1, 15.1_
  
  - [ ] 6.3 Create appointment queries
    - Implement getByDateRange, getAvailableSlots, getClientAppointments
    - Add relationship enrichment (client, department, doctor details)
    - _Requirements: 4.1, 4.4_
  
  - [ ] 6.4 Write property test for calendar filtering
    - **Property 20: Calendar Filtering Accuracy**
    - **Validates: Requirements 13.3**
  
  - [ ] 6.5 Write property test for client appointment history
    - **Property 21: Client Appointment History Completeness**
    - **Validates: Requirements 14.4**

- [ ] 7. Implement Core Mutation Functions
  - [ ] 7.1 Create client mutations
    - Implement create, update client mutations
    - Add validation for duplicate X-numbers
    - _Requirements: 4.2, 14.2_
  
  - [ ] 7.2 Create department mutations
    - Implement create, update, delete department mutations
    - Preserve department configuration (slots, working days, colors)
    - _Requirements: 4.2, 15.1, 15.3_
  
  - [ ] 7.3 Create appointment mutations
    - Implement bookAppointment mutation with transaction support
    - Implement updateStatus mutation
    - Add slot availability validation
    - Add booking rules validation
    - _Requirements: 4.2, 4.3, 16.1, 16.2, 16.6_
  
  - [ ] 7.4 Write property test for transaction atomicity
    - **Property 5: Transaction Atomicity for Appointment Booking**
    - **Validates: Requirements 4.3**
  
  - [ ] 7.5 Write property test for double-booking prevention
    - **Property 23: Double-Booking Prevention**
    - **Validates: Requirements 16.2, 16.3**
  
  - [ ] 7.6 Write property test for booking rules enforcement
    - **Property 25: Booking Rules Enforcement**
    - **Validates: Requirements 16.6**

- [ ] 8. Checkpoint - Core Backend Functions
  - Ensure all backend function tests pass, ask the user if questions arise.

- [ ] 9. Implement Working Schedule Logic
  - [ ] 9.1 Create working day validation function
    - Implement isWorkingDay helper
    - Check date against department working_days array
    - _Requirements: 10.2_
  
  - [ ] 9.2 Write property test for working day validation
    - **Property 13: Working Day Validation**
    - **Validates: Requirements 10.2**
  
  - [ ] 9.3 Create availability calculation function
    - Implement getAvailableSlots with override support
    - Calculate available = total - booked
    - _Requirements: 10.3, 10.4_
  
  - [ ] 9.4 Write property test for availability override
    - **Property 14: Availability Override Application**
    - **Validates: Requirements 10.3**
  
  - [ ] 9.5 Write property test for available slots calculation
    - **Property 15: Available Slots Calculation**
    - **Validates: Requirements 10.4**
  
  - [ ] 9.6 Implement working hours enforcement
    - Add validation for booking times within working_hours
    - _Requirements: 10.5_
  
  - [ ] 9.7 Write property test for working hours enforcement
    - **Property 16: Working Hours Enforcement**
    - **Validates: Requirements 10.5**

- [ ] 10. Implement External Service Actions
  - [ ] 10.1 Create SMS service action
    - Implement sendSMS action with Hubtel integration
    - Add retry logic for transient failures
    - Support mock mode for development
    - _Requirements: 8.1, 8.3_
  
  - [ ] 10.2 Write property test for SMS message format
    - **Property 9: SMS Message Format Consistency**
    - **Validates: Requirements 8.2**
  
  - [ ] 10.3 Write property test for SMS failure handling
    - **Property 10: SMS Failure Graceful Handling**
    - **Validates: Requirements 8.5**
  
  - [ ] 10.4 Implement error handling and logging
    - Add comprehensive error handling to all functions
    - Implement structured logging with context
    - _Requirements: 18.1, 18.2_
  
  - [ ] 10.5 Write property test for error handling consistency
    - **Property 8: Error Handling Consistency**
    - **Validates: Requirements 5.4, 18.3**

- [ ] 11. Migrate Frontend Authentication
  - [ ] 11.1 Replace ConvexProvider setup
    - Install @convex-dev/auth/react
    - Replace ConvexProvider with ConvexAuthProvider
    - _Requirements: 7.1_
  
  - [ ] 11.2 Update staff login component
    - Replace better-auth staffLogin with Convex mutation
    - Update form handling and error states
    - _Requirements: 2.1, 7.2_
  
  - [ ] 11.3 Update client OTP login component
    - Replace OTP flow with Convex mutations (sendOTP, verifyOTP)
    - Update UI for OTP input and verification
    - _Requirements: 3.1, 3.3, 7.2_
  
  - [ ] 11.4 Write integration test for authentication flows
    - Test staff login end-to-end
    - Test OTP flow end-to-end
    - _Requirements: 2.1, 3.1, 3.3_

- [ ] 12. Migrate Frontend Data Fetching
  - [ ] 12.1 Replace TanStack Query with Convex hooks in calendar component
    - Replace useQuery with Convex useQuery
    - Replace useMutation with Convex useMutation
    - Remove manual cache invalidation
    - _Requirements: 7.1, 7.2, 7.6, 13.1_
  
  - [ ] 12.2 Replace TanStack Query in dashboard component
    - Update statistics queries to use Convex
    - Implement real-time subscription for dashboard updates
    - _Requirements: 7.1, 7.2, 12.1_
  
  - [ ] 12.3 Replace TanStack Query in appointments component
    - Update appointment queries and mutations
    - Implement real-time subscription for appointment updates
    - _Requirements: 7.1, 7.2_
  
  - [ ] 12.4 Replace TanStack Query in clients component
    - Update client search and CRUD operations
    - _Requirements: 7.1, 7.2, 14.1_
  
  - [ ] 12.5 Remove TanStack Query configuration
    - Remove QueryClient setup
    - Remove TanStack Query provider
    - Remove TanStack Query dependency
    - _Requirements: 7.3_

- [ ] 13. Checkpoint - Frontend Migration
  - Ensure all frontend components work with Convex, ask the user if questions arise.

- [ ] 14. Implement Real-Time Subscriptions
  - [ ] 14.1 Add real-time subscription to calendar view
    - Subscribe to appointment changes for displayed date range
    - Update UI automatically on changes
    - _Requirements: 6.1, 6.2, 13.2_
  
  - [ ] 14.2 Add real-time subscription to dashboard
    - Subscribe to statistics changes
    - Update charts and counts in real-time
    - _Requirements: 6.4, 12.2_
  
  - [ ] 14.3 Add real-time subscription to available slots
    - Subscribe to slot availability changes
    - Update slot picker in real-time
    - _Requirements: 6.5, 13.5_
  
  - [ ] 14.4 Write integration test for real-time updates
    - Test appointment creation triggers subscription update
    - Test status change triggers subscription update
    - _Requirements: 6.1, 6.2_

- [ ] 15. Create Data Migration Scripts
  - [ ] 15.1 Create PostgreSQL export script
    - Export all tables to JSON format
    - Preserve relationships and timestamps
    - _Requirements: 11.1_
  
  - [ ] 15.2 Create data transformation script
    - Transform PostgreSQL data to Convex schema format
    - Convert foreign keys to document IDs
    - Handle JSONB fields (working_days, working_hours)
    - _Requirements: 11.2, 11.6_
  
  - [ ] 15.3 Create Convex import script
    - Import data in batches to handle large datasets
    - Maintain referential integrity
    - _Requirements: 11.2, 11.5_
  
  - [ ] 15.4 Create migration validation script
    - Compare record counts between PostgreSQL and Convex
    - Validate relationships are preserved
    - Validate timestamps are preserved
    - Generate migration report
    - _Requirements: 11.3, 11.7_
  
  - [ ] 15.5 Write property test for relationship preservation
    - **Property 17: Data Migration Relationship Preservation**
    - **Validates: Requirements 11.2**
  
  - [ ] 15.6 Write property test for timestamp preservation
    - **Property 18: Data Migration Timestamp Preservation**
    - **Validates: Requirements 11.6**

- [ ] 16. Implement Pagination Support
  - [ ] 16.1 Add pagination to large query results
    - Implement cursor-based pagination for appointments
    - Implement pagination for client lists
    - _Requirements: 4.7, 19.4_
  
  - [ ] 16.2 Write property test for pagination consistency
    - **Property 6: Pagination Consistency**
    - **Validates: Requirements 4.7, 19.4**

- [ ] 17. Implement Business Logic Preservation Tests
  - [ ] 17.1 Write property test for business logic preservation
    - **Property 7: Business Logic Preservation**
    - **Validates: Requirements 5.3, 5.6**
  
  - [ ] 17.2 Write property test for appointment status workflow
    - **Property 24: Appointment Status Workflow Validity**
    - **Validates: Requirements 16.4**
  
  - [ ] 17.3 Write property test for department utilization
    - **Property 19: Department Utilization Calculation**
    - **Validates: Requirements 12.3**
  
  - [ ] 17.4 Write property test for doctor-department relationships
    - **Property 22: Doctor-Department Relationship Integrity**
    - **Validates: Requirements 15.2**

- [ ] 18. Checkpoint - All Property Tests
  - Ensure all 26 property tests pass with 100 iterations each, ask the user if questions arise.

- [ ] 19. Run Data Migration in Staging
  - [ ] 19.1 Set up Convex staging environment
    - Create staging deployment
    - Configure environment variables
    - _Requirements: 21.4_
  
  - [ ] 19.2 Execute data migration to staging
    - Run export script on PostgreSQL
    - Run transformation script
    - Run import script to Convex staging
    - _Requirements: 11.1, 11.2_
  
  - [ ] 19.3 Run migration validation
    - Execute validation script
    - Review migration report
    - Fix any data integrity issues
    - _Requirements: 11.3, 11.7_
  
  - [ ] 19.4 Write property test for migration consistency
    - **Property 26: Data Consistency During Migration**
    - **Validates: Requirements 21.5**

- [ ] 20. Integration Testing
  - [ ] 20.1 Write integration test for booking workflow
    - Test complete booking flow: search client → check availability → book → confirm
    - _Requirements: 16.1, 16.2, 16.6_
  
  - [ ] 20.2 Write integration test for authentication workflows
    - Test staff login workflow
    - Test OTP workflow
    - _Requirements: 2.1, 3.1, 3.3_
  
  - [ ] 20.3 Write integration test for real-time subscriptions
    - Test subscription updates across multiple clients
    - _Requirements: 6.1, 6.2_

- [ ] 21. Performance and Load Testing
  - [ ] 21.1 Run performance benchmarks
    - Compare query response times with PostgreSQL baseline
    - Test real-time subscription performance
    - _Requirements: 19.1_
  
  - [ ] 21.2 Run load testing
    - Test concurrent booking attempts
    - Test high-volume real-time updates
    - _Requirements: 6.6_

- [ ] 22. Security Audit
  - [ ] 22.1 Review authentication and authorization
    - Verify role-based access control
    - Test session management
    - _Requirements: 2.3, 2.5_
  
  - [ ] 22.2 Review rate limiting and anti-abuse
    - Test rate limiting under attack scenarios
    - Verify penalty system works correctly
    - _Requirements: 9.2, 9.3, 9.4, 9.7_

- [ ] 23. Checkpoint - Pre-Production Validation
  - Ensure all tests pass, performance is acceptable, and security is verified, ask the user if questions arise.

- [ ] 24. Production Deployment
  - [ ] 24.1 Deploy Convex backend to production
    - Push schema and functions to production
    - Configure production environment variables
    - _Requirements: 21.1_
  
  - [ ] 24.2 Run production data migration
    - Execute migration scripts on production PostgreSQL
    - Import data to production Convex
    - Validate migration success
    - _Requirements: 11.1, 11.2, 11.3, 21.3_
  
  - [ ] 24.3 Deploy frontend changes
    - Deploy Next.js application with Convex integration
    - Monitor for errors and performance issues
    - _Requirements: 21.1_
  
  - [ ] 24.4 Monitor system health
    - Monitor error rates
    - Monitor response times
    - Monitor real-time subscription performance
    - _Requirements: 21.6_
  
  - [ ] 24.5 Keep PostgreSQL as backup
    - Maintain PostgreSQL for 1 week as rollback option
    - Document rollback procedure
    - _Requirements: 21.2_

- [ ] 25. Final Checkpoint - Production Validation
  - Ensure production system is stable, all features work correctly, and no critical issues exist.

## Notes

- All tasks including property-based tests and integration tests are required for comprehensive correctness validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the migration
- Property tests validate universal correctness properties with 100+ iterations
- Integration tests verify end-to-end workflows
- Migration can be rolled back at any point by reverting to PostgreSQL
- PostgreSQL remains as backup for 1 week after production deployment
