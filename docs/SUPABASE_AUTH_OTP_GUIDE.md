# Supabase Auth with OTP Integration Guide

This guide explains how to use Supabase Auth alongside your existing X-Number + Phone OTP login system.

## Current Login Flow (Unchanged)

Your existing system continues to work exactly as before:

1. **Client enters X-Number** on login page
2. **OTP is sent to their phone** via SMS (Hubtel/Arkesel)
3. **Client enters OTP** to verify
4. **Session is created** using your existing session_token cookie
5. **Client accesses dashboard**

## Optional Supabase Auth Enhancement

Supabase Auth is **optional** and provides enhanced security features:

### Benefits of Enabling Supabase Auth:
- ✅ Better RLS (Row Level Security) policies
- ✅ Session management via Supabase
- ✅ Audit logging
- ✅ Future-proof for additional features
- ✅ Can work alongside your OTP system

### Without Supabase Auth:
- ✅ Your current OTP system works perfectly
- ✅ All existing features continue to work
- ⚠️ RLS policies are less granular

## How It Works

### Regular OTP Flow (Default)
```
Client → X-Number → OTP SMS → Verify → Custom Session → Dashboard
```

### With Supabase Auth Enabled
```
Client → X-Number → OTP SMS → Verify → Custom Session + Supabase Session → Dashboard
```

## Admin Management

### View Clients
- Navigate to `/admin/clients-otp`
- See all clients and their auth status
- Filter by: All, With Supabase Auth, OTP Only

### Enable Supabase Auth for a Client
1. Find the client in the list
2. Click "Enable Auth" button
3. Confirm the action
4. Client is now linked to Supabase Auth

### Disable Supabase Auth
1. Find client with auth enabled
2. Click "Disable Auth" button
3. Confirm (this deletes the Supabase Auth account)
4. Client reverts to OTP-only

## Database Changes

The migration adds an optional `auth_user_id` column:

```sql
-- Clients table now has:
- id (existing)
- x_number (existing)
- name (existing)
- phone (existing)
- auth_user_id (NEW - optional, links to Supabase Auth)
```

## API Endpoints

### For Admin:
- `GET /api/admin/clients` - List clients with auth status
- `POST /api/admin/clients/[id]/enable-auth` - Enable Supabase Auth
- `DELETE /api/admin/clients/[id]/enable-auth` - Disable Supabase Auth

### For Clients (unchanged):
- `POST /api/auth/send-otp` - Send OTP (your existing endpoint)
- `POST /api/auth/verify-otp` - Verify OTP (your existing endpoint)

## RLS Policies

### With Supabase Auth Enabled:
```sql
-- Clients can only view their own record
CREATE POLICY "Clients can view own record"
ON clients FOR SELECT
USING (auth.uid() = auth_user_id);
```

### Without Supabase Auth:
```sql
-- Service role handles all access (your API routes)
CREATE POLICY "Service role has full access"
ON clients FOR ALL
USING (auth.role() = 'service_role');
```

## Migration Steps

1. **Run the migration**:
```bash
psql -d your_database -f database/2026-02-12_add_supabase_auth_otp.sql
```

2. **No environment changes needed** - your existing Supabase config works

3. **Test the admin page**:
   - Visit `/admin/clients-otp`
   - You should see all clients marked as "OTP Only"

4. **Enable Supabase Auth for test client**:
   - Click "Enable Auth" on any client
   - Verify it appears as "Supabase Auth"

5. **Test login** - the client should still login normally with X-Number + OTP

## Gradual Migration Strategy

### Phase 1: Setup (Current)
- ✅ Migration applied
- ✅ Admin page available
- ✅ All clients use OTP-only (default)

### Phase 2: Testing
- Enable Supabase Auth for a few test clients
- Verify everything works
- Monitor for issues

### Phase 3: Rollout (Optional)
- Enable for all clients gradually
- Or keep as optional enhancement

### Phase 4: Full Migration (Future)
- Eventually switch to Supabase Auth only
- Deprecate custom session system

## Code Changes Made

### New Files:
- `lib/supabase-auth-otp.ts` - OTP-based auth utilities
- `app/api/admin/clients/route.ts` - Admin list API
- `app/api/admin/clients/[id]/enable-auth/route.ts` - Enable/disable auth
- `app/admin/clients-otp/page.tsx` - Admin management page
- `database/2026-02-12_add_supabase_auth_otp.sql` - Migration

### Modified Files:
- `middleware.ts` - Enhanced API protection (already done)
- `lib/api-auth.ts` - Auth helpers (already done)

### Removed Files (Password-based approach):
- ❌ `app/login-supabase/page.tsx`
- ❌ `app/admin/clients/page.tsx`
- ❌ `app/api/clients/route-supabase.ts`
- ❌ `app/api/clients/lookup/route.ts`

## Security Notes

1. **OTP system is unchanged** - Still your primary auth method
2. **Supabase Auth is additive** - Adds security layer, doesn't replace
3. **Phone numbers** - Stored in both your DB and Supabase Auth
4. **Sessions** - Can use both custom and Supabase sessions

## Troubleshooting

### Client can't login after enabling Supabase Auth?
- Check that phone number matches between systems
- Verify `auth_user_id` is set correctly in database
- Look at browser console for errors

### Want to revert to OTP-only?
- Use "Disable Auth" button in admin
- Or manually clear `auth_user_id` from database

### Migration errors?
- Ensure `auth.users` table exists (Supabase creates this)
- Check that you have admin privileges
- Verify RLS is enabled on tables

## Questions?

The OTP-based system you have now works perfectly! Supabase Auth is just an optional enhancement that you can enable gradually for clients who need it.
