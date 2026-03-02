# Implementation Plan: User Management UX Improvements

## Overview

This implementation plan addresses two key UX improvements: replacing "Employee ID" with "Username" terminology throughout the application stack, and making the phone number field optional. The changes will be implemented in a coordinated manner across the database, backend API, and frontend components to ensure consistency and maintain data integrity.

## Tasks

- [x] 1. Create database migration for schema changes
  - Create SQL migration file to rename `employee_id` column to `username`
  - Add migration to make `phone` column nullable
  - Test migration rollback functionality
  - _Requirements: 3.1, 4.3, 5.1, 5.2, 5.3_

- [ ]* 1.1 Write property test for migration data preservation
  - **Property 8: Migration preserves data**
  - **Validates: Requirements 5.2**

- [x] 2. Update TypeScript type definitions
  - Update `User` interface to replace `employee_id` with `username`
  - Update `UserFormData` interface to replace `employee_id` with `username`
  - Update `User` interface to make `phone` optional (`string | null`)
  - _Requirements: 3.1, 3.2, 3.3, 4.3_

- [ ] 3. Update backend API endpoints
  - [x] 3.1 Update user creation endpoint (`app/api/users/route.ts` POST)
    - Change parameter name from `employee_id` to `username`
    - Update database insert to use `username` column
    - Remove phone validation requirement
    - Update error messages to reference "Username"
    - _Requirements: 3.2, 4.1, 1.4_

  - [ ]* 3.2 Write property test for API username parameter acceptance
    - **Property 2: API accepts username parameter**
    - **Validates: Requirements 3.2**

  - [ ]* 3.3 Write property test for optional phone acceptance
    - **Property 5: Optional phone number acceptance**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 3.4 Update user update endpoint (`app/api/users/[id]/route.ts` PUT)
    - Change parameter name from `employee_id` to `username`
    - Update database update to use `username` column
    - Remove phone validation requirement
    - Update error messages to reference "Username"
    - _Requirements: 3.2, 4.2, 1.4_

  - [x] 3.5 Update user search query (`app/api/users/route.ts` GET)
    - Update search query to use `username` column instead of `employee_id`
    - Update response to include `username` property
    - _Requirements: 3.3_

  - [ ]* 3.6 Write property test for API response format
    - **Property 3: API responses include username property**
    - **Validates: Requirements 3.3**

  - [ ]* 3.7 Write property test for null phone storage
    - **Property 6: Null phone storage**
    - **Validates: Requirements 4.3**

- [ ] 4. Update authentication logic
  - [x] 4.1 Update staff login endpoint (`app/api/auth/staff-login/route.ts`)
    - Change request parameter from `employee_id` to `username`
    - Update database query to use `username` column
    - Update error messages to reference "Username"
    - _Requirements: 3.4, 2.2_

  - [x] 4.2 Update staffLogin function (`lib/auth.ts`)
    - Change function parameter from `employee_id` to `username`
    - Update database query to use `username` column
    - _Requirements: 3.4_

  - [ ]* 4.3 Write property test for authentication with username
    - **Property 4: Authentication uses username field**
    - **Validates: Requirements 3.4**

  - [ ]* 4.4 Write property test for error message terminology
    - **Property 1: Username terminology in error messages**
    - **Validates: Requirements 1.4, 2.2**

- [ ] 5. Update user management frontend
  - [x] 5.1 Update user list table (`app/dashboard/users/page-supabase.tsx`)
    - Change table header from "Employee ID" to "Username"
    - Update data access from `user.employee_id` to `user.username`
    - Update search query to use `username`
    - _Requirements: 1.3_

  - [x] 5.2 Update add user dialog (`app/dashboard/users/page-supabase.tsx`)
    - Change form label from "Employee ID" to "Username"
    - Change form field name from `employee_id` to `username`
    - Remove `required` attribute from phone input
    - Update placeholder text for phone field
    - Update form validation to allow empty phone
    - _Requirements: 1.1, 4.1_

  - [x] 5.3 Update edit user dialog (`app/dashboard/users/page-supabase.tsx`)
    - Change form label from "Employee ID" to "Username"
    - Change form field name from `employee_id` to `username`
    - Remove `required` attribute from phone input
    - Update form validation to allow empty phone
    - _Requirements: 1.2, 4.2_

  - [x] 5.4 Update form submission handlers
    - Update `handleAddUser` to send `username` instead of `employee_id`
    - Update `handleEditUser` to send `username` instead of `employee_id`
    - Update validation to not require phone field
    - _Requirements: 3.2, 4.1, 4.2_

  - [ ]* 5.5 Write unit tests for UI label rendering
    - Test user creation form displays "Username" label
    - Test user edit form displays "Username" label
    - Test user list table displays "Username" header
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 5.6 Write property test for null phone display
    - **Property 7: Null phone display handling**
    - **Validates: Requirements 4.4**

- [ ] 6. Update staff login frontend
  - [x] 6.1 Update login form (`app/staff-login/page.tsx`)
    - Change form label from "Employee ID" to "Username" (already done in current code)
    - Verify form field name is `username` (already correct)
    - Update any remaining references to employee_id
    - _Requirements: 2.1_

  - [ ]* 6.2 Write unit test for login form label
    - Test login page displays "Username" label
    - _Requirements: 2.1_

- [ ] 7. Update profile display frontend
  - [x] 7.1 Update profile page (`app/dashboard/profile/page.tsx`)
    - Change display label from "Employee ID" to "Username"
    - Update property access from `user.employee_id` to `user.username`
    - Handle null phone values gracefully in display
    - _Requirements: 2.3, 4.4_

  - [ ]* 7.2 Write unit test for profile display
    - Test profile page displays "Username" label
    - Test profile handles null phone gracefully
    - _Requirements: 2.3, 4.4_

- [ ] 8. Update username uniqueness validation
  - [x] 8.1 Verify database unique constraint on username column
    - Ensure unique constraint exists after migration
    - Test constraint enforcement
    - _Requirements: 6.3_

  - [x] 8.2 Update API error handling for duplicate usernames
    - Ensure duplicate username errors return 409 Conflict
    - Ensure error messages reference "Username"
    - _Requirements: 6.1, 6.2_

  - [ ]* 8.3 Write property test for username uniqueness
    - **Property 9: Username uniqueness enforcement**
    - **Validates: Requirements 6.1, 6.2**

- [x] 9. Checkpoint - Run all tests and verify functionality
  - Run database migration in test environment
  - Run all property-based tests (minimum 100 iterations each)
  - Run all unit tests
  - Verify user creation with and without phone
  - Verify user login with username
  - Verify existing users can still log in
  - Ask the user if questions arise

- [ ] 10. Integration testing and final verification
  - [x] 10.1 Test complete user creation flow
    - Create user with phone number
    - Create user without phone number
    - Verify both users appear in list with correct data
    - _Requirements: 1.1, 4.1_

  - [x] 10.2 Test complete user update flow
    - Update user to remove phone number
    - Update user to add phone number
    - Update username (verify uniqueness check)
    - _Requirements: 1.2, 4.2, 6.2_

  - [x] 10.3 Test complete login flow
    - Login with username and password
    - Verify error messages use "Username" terminology
    - _Requirements: 2.1, 2.2, 3.4_

  - [x] 10.4 Test migration with existing data
    - Create test users with employee_id values
    - Run migration
    - Verify all employee_id values preserved as username
    - Verify existing users can log in
    - _Requirements: 5.1, 5.2_

  - [ ]* 10.5 Write integration tests for end-to-end flows
    - Test user creation → list display → edit → login flow
    - Test migration → login flow
    - _Requirements: All_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The migration must be tested thoroughly before deployment to production
- All existing users must be able to log in after the migration
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, UI rendering, and edge cases
