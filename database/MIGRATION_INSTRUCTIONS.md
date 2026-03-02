# Database Migration Instructions

## Migration: Username and Optional Phone (2026-02-03)

This migration renames the `employee_id` column to `username` and makes the `phone` column optional.

### Option 1: Run via Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `2026-02-03_username_and_optional_phone.sql`
4. Click "Run" to execute the migration

### Option 2: Run via Command Line

If you have direct database access:

```bash
node scripts/run-username-migration.js
```

### Option 3: Manual SQL Execution

Connect to your database and run:

```sql
BEGIN;

-- Rename employee_id column to username
ALTER TABLE users RENAME COLUMN employee_id TO username;

-- Make phone column nullable
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

COMMIT;
```

### Verification

After running the migration, verify it worked:

```sql
-- Check that username column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('username', 'phone');

-- Verify data was preserved
SELECT id, name, username, phone, role 
FROM users 
LIMIT 5;
```

Expected results:
- `username` column should exist (not `employee_id`)
- `phone` column should have `is_nullable = 'YES'`
- All existing data should be intact

### Rollback (if needed)

If you need to rollback the migration:

```sql
BEGIN;
ALTER TABLE users RENAME COLUMN username TO employee_id;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
COMMIT;
```

**Note:** Rollback will fail if any users have NULL phone numbers after the migration.

### What Changed

1. **Column Rename**: `employee_id` → `username`
   - All existing values preserved
   - Unique constraint maintained
   - All indexes preserved

2. **Phone Optional**: `phone NOT NULL` → `phone NULL`
   - Existing phone numbers unchanged
   - New users can be created without phone numbers
   - Empty strings should be stored as NULL

### Impact

- **Backend**: All API endpoints updated to use `username` parameter
- **Frontend**: All forms and displays updated to show "Username" label
- **Authentication**: Staff login now uses `username` field
- **Validation**: Phone number no longer required for user creation/update
