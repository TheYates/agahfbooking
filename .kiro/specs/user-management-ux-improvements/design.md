# Design Document: User Management UX Improvements

## Overview

This design addresses two key UX improvements to the user management system:

1. **Terminology Update**: Replace "Employee ID" with "Username" throughout the application stack (frontend UI, backend API, database schema)
2. **Optional Phone Numbers**: Make the phone number field optional instead of required for staff users

The changes span the entire application stack, requiring coordinated updates to the database schema, backend API, and frontend components. The design prioritizes backward compatibility and data integrity during the migration process.

## Architecture

### System Components

The user management system consists of three primary layers:

1. **Frontend Layer**: React/Next.js components for user management UI and staff login
2. **Backend Layer**: API routes for user CRUD operations and authentication
3. **Data Layer**: Supabase/PostgreSQL database with user table

### Data Flow

```
Admin/Staff User → Frontend Component → API Route → Database
                                      ↓
                              Validation & Business Logic
```

### Migration Strategy

The terminology change requires a coordinated migration:

1. **Database Migration**: Rename column from `employee_id` to `username`
2. **Backend Update**: Update all references to use `username`
3. **Frontend Update**: Update all UI labels and form fields

The migration will be executed as a single deployment to avoid inconsistencies between layers.

## Components and Interfaces

### Database Schema Changes

**Current Schema (users table)**:
```typescript
{
  id: string (UUID)
  employee_id: string (unique, not null)
  name: string
  email: string
  phone: string (not null)
  role: string
  created_at: timestamp
}
```

**Updated Schema (users table)**:
```typescript
{
  id: string (UUID)
  username: string (unique, not null)
  name: string
  email: string
  phone: string | null (nullable)
  role: string
  created_at: timestamp
}
```

**Migration SQL**:
```sql
-- Rename column
ALTER TABLE users RENAME COLUMN employee_id TO username;

-- Make phone nullable
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
```

### API Interface Changes

**User Creation Endpoint**: `POST /api/users`

**Current Request Body**:
```typescript
{
  employee_id: string
  name: string
  email: string
  phone: string  // required
  role: string
  password: string
}
```

**Updated Request Body**:
```typescript
{
  username: string
  name: string
  email: string
  phone?: string  // optional
  role: string
  password: string
}
```

**User Update Endpoint**: `PUT /api/users/:id`

Similar changes to request body (employee_id → username, phone optional).

**Staff Login Endpoint**: `POST /api/auth/staff-login`

**Current Request Body**:
```typescript
{
  employee_id: string
  password: string
}
```

**Updated Request Body**:
```typescript
{
  username: string
  password: string
}
```

### Frontend Component Changes

**User Management Form** (`app/dashboard/users/page-supabase.tsx`):
- Update form field label: "Employee ID" → "Username"
- Update form field name: `employee_id` → `username`
- Remove `required` attribute from phone input
- Update validation to allow empty phone

**Staff Login Form** (`app/staff-login/page.tsx`):
- Update form field label: "Employee ID" → "Username"
- Update form field name: `employee_id` → `username`
- Update error messages to reference "Username"

**Profile Display** (`app/dashboard/profile/page.tsx`):
- Update display label: "Employee ID" → "Username"
- Update property access: `user.employee_id` → `user.username`
- Handle null phone values gracefully

### Backend Logic Changes

**User CRUD Operations** (`app/api/users/route.ts`):
- Update parameter names: `employee_id` → `username`
- Update database queries to use `username` column
- Remove phone validation requirement
- Allow null/empty phone values

**Authentication Logic** (`lib/auth.ts` and `app/api/auth/staff-login/route.ts`):
- Update staffLogin function parameter: `employee_id` → `username`
- Update database query to search by `username` column
- Update error messages to reference "Username"

## Data Models

### User Type Definition

**Current Type**:
```typescript
interface User {
  id: string
  employee_id: string
  name: string
  email: string
  phone: string
  role: string
  created_at: string
}
```

**Updated Type**:
```typescript
interface User {
  id: string
  username: string
  name: string
  email: string
  phone: string | null
  role: string
  created_at: string
}
```

### Validation Rules

**Username Validation**:
- Required field (cannot be empty)
- Must be unique across all users
- Minimum length: 3 characters
- Maximum length: 50 characters
- Allowed characters: alphanumeric, underscore, hyphen

**Phone Validation**:
- Optional field (can be empty or null)
- When provided, must match valid phone format
- No minimum/maximum length constraints when empty

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Username terminology in error messages
*For any* validation or authentication error related to the username field, the error message should contain the word "Username" (not "Employee ID")
**Validates: Requirements 1.4, 2.2**

### Property 2: API accepts username parameter
*For any* valid user creation or update request, the API should successfully accept "username" as the parameter name and process the request
**Validates: Requirements 3.2**

### Property 3: API responses include username property
*For any* user data returned by the API, the response object should include a "username" property (not "employee_id")
**Validates: Requirements 3.3**

### Property 4: Authentication uses username field
*For any* valid username and password combination, the authentication system should successfully validate credentials using the "username" field
**Validates: Requirements 3.4**

### Property 5: Optional phone number acceptance
*For any* valid user data without a phone number, the system should accept the submission for both creation and update operations
**Validates: Requirements 4.1, 4.2**

### Property 6: Null phone storage
*For any* user created or updated without a phone number, the database should store a null value in the phone column
**Validates: Requirements 4.3**

### Property 7: Null phone display handling
*For any* user with a null phone number, the UI should render without errors and display the user information gracefully
**Validates: Requirements 4.4**

### Property 8: Migration preserves data
*For all* existing users before migration, their employee_id values should be preserved as username values after the migration completes
**Validates: Requirements 5.2**

### Property 9: Username uniqueness enforcement
*For any* username that already exists in the system, attempting to create a new user or update an existing user to use that username should be rejected with an error
**Validates: Requirements 6.1, 6.2**

## Error Handling

### Validation Errors

**Username Validation**:
- Empty username: "Username is required"
- Username too short: "Username must be at least 3 characters"
- Username too long: "Username must be at most 50 characters"
- Invalid characters: "Username can only contain letters, numbers, underscores, and hyphens"
- Duplicate username: "Username already exists"

**Phone Validation**:
- Invalid format (when provided): "Phone number format is invalid"
- No error when empty (phone is optional)

### API Error Responses

**400 Bad Request**:
```typescript
{
  error: "Validation failed",
  details: {
    username?: string[]  // Array of validation errors
    phone?: string[]     // Array of validation errors
  }
}
```

**401 Unauthorized** (Login):
```typescript
{
  error: "Invalid username or password"
}
```

**409 Conflict** (Duplicate username):
```typescript
{
  error: "Username already exists"
}
```

### Database Error Handling

**Migration Failures**:
- Wrap migration in transaction for automatic rollback
- Log detailed error messages for debugging
- Preserve original schema if migration fails

**Constraint Violations**:
- Unique constraint on username: Return 409 Conflict
- Not null constraint on username: Return 400 Bad Request

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific UI rendering examples (labels, forms, error messages)
- Database schema verification (column names, constraints)
- Migration execution and rollback scenarios
- Edge cases (empty strings, null values, special characters)

**Property Tests** focus on:
- Error message terminology across all error scenarios
- API contract compliance across all valid inputs
- Phone number optionality across all user operations
- Username uniqueness enforcement across all duplicate scenarios
- Data preservation across all migration scenarios

### Property-Based Testing Configuration

We will use **fast-check** (for TypeScript/JavaScript) as the property-based testing library.

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with format: **Feature: user-management-ux-improvements, Property {number}: {property_text}**
- Each correctness property implemented by a single property-based test

**Example Test Structure**:
```typescript
// Feature: user-management-ux-improvements, Property 5: Optional phone number acceptance
test('accepts user creation without phone number', () => {
  fc.assert(
    fc.property(
      fc.record({
        username: fc.string({ minLength: 3, maxLength: 50 }),
        name: fc.string(),
        email: fc.emailAddress(),
        role: fc.constantFrom('staff', 'admin'),
        password: fc.string({ minLength: 8 })
      }),
      async (userData) => {
        const response = await createUser(userData);
        expect(response.status).toBe(201);
        expect(response.data.phone).toBeNull();
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

**Frontend Tests**:
- Component rendering with correct labels
- Form submission with and without phone
- Error message display
- Null phone value handling in UI

**Backend Tests**:
- API endpoint parameter acceptance
- API response format validation
- Authentication with username
- Validation logic for username and phone
- Database operations with new schema

**Integration Tests**:
- End-to-end user creation flow
- End-to-end login flow
- Migration execution and verification
- Uniqueness constraint enforcement

### Migration Testing

**Pre-Migration Verification**:
- Create test users with employee_id values
- Verify employee_id column exists
- Verify phone is not null

**Post-Migration Verification**:
- Verify username column exists
- Verify employee_id column does not exist
- Verify all data preserved in username column
- Verify phone column is nullable
- Verify unique constraint on username
- Verify existing users can log in with username

**Rollback Testing**:
- Simulate migration failure
- Verify database returns to original state
- Verify no data loss
