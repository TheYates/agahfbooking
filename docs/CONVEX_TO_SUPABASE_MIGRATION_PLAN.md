# Convex  Supabase Migration Plan

> Branch: `migration/supabase`
> 
> Goal: Replace Convex (data + auth + queries) with Supabase (Postgres + Auth + RLS) while keeping the existing Next.js App Router UX stable.

## 0) Current State (What exists today)

### Convex usage (to be removed/rewired)
- UI provider: `components/providers/convex-provider.tsx` (`ConvexProvider`, `ConvexReactClient`)
- Convex client: `lib/convex-client.ts`
- Convex auth hook: `hooks/use-convex-auth.ts` (OTP + staff login through Convex mutations)
- Convex query hooks: `hooks/use-convex-queries.ts`, `hooks/use-hospital-queries.ts`
- API routes that call Convex over HTTP: many under `app/api/**` using `ConvexHttpClient`
- Convex backend functions: `convex/*` and generated API/types in `convex/_generated/*`

### Postgres code already present (useful for Supabase)
- `lib/db.ts`, `lib/db-services.ts`, `lib/db-types.ts`
  - These implement a direct Postgres access layer (pg Pool) and typed services.
  - We can either:
    1) keep using these services and point `DATABASE_URL` to Supabase Postgres, OR
    2) migrate to `@supabase/supabase-js` and use Supabase client everywhere.

**Recommendation:** Use `@supabase/supabase-js` for new work (auth, RLS-friendly queries) and keep `lib/db-services.ts` temporarily as a reference/bridge until the app is fully migrated.

## 1) Decisions to make (quick)

1. **Auth source**
   - A) Supabase Auth (recommended)
   - B) Keep existing Better Auth / custom auth and use Supabase only for DB

2. **Access pattern**
   - A) Client-side queries via Supabase + React Query (recommended for dashboards)
   - B) Server-only queries via Route Handlers calling Supabase (recommended where you need server secrets)

3. **Data migration**
   - A) Export Convex data and import into Supabase tables
   - B) Fresh seed data only

> If you confirm (1A + 2 mixed + 3A), the remainder of this plan assumes that.

## 2) Phase 1  Scaffold Supabase (no behavior changes)

### 2.1 Dependencies
Add:
- `@supabase/supabase-js`
- (optional but recommended for Next App Router) `@supabase/ssr`

### 2.2 Environment variables
Add to deployment + local env:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never exposed to client)

### 2.3 Supabase client modules
Create:
- `lib/supabase/browser.ts`  browser client using anon key
- `lib/supabase/server.ts`  server client for Route Handlers (uses cookies/session)
- `lib/supabase/admin.ts`  service-role client for admin tasks (seed, migrations, privileged ops)

### 2.4 Provider updates
- Replace `ConvexClientProvider` with a Supabase session/provider pattern.
  - If we use `@supabase/ssr`, we can keep session hydration consistent.
  - Keep existing UI working by migrating one screen at a time.

**Exit criteria:** app builds; no functional endpoints migrated yet.

## 3) Phase 2  Choose a Vertical Slice and Migrate It End-to-End

Pick one domain to establish patterns:
- **Departments** (good first slice: small schema, used across UI)

### What "end-to-end" means
- Data model exists in Supabase
- API route uses Supabase (or UI calls Supabase directly)  no Convex
- UI reads/writes successfully
- Types updated

**Exit criteria:** One feature works without Convex.

## 4) Phase 3  Migrate Auth

### 4.1 Replace `hooks/use-convex-auth.ts`
- Implement OTP + staff login using Supabase Auth.
  - Options:
    - Supabase Phone OTP (native)
    - Custom OTP tables + verification via server route (if you need Hubtel SMS)

### 4.2 Session handling
- Use Supabase session cookies in Route Handlers.
- Replace localStorage "convex_user" with Supabase session-based user identity.

**Exit criteria:** Login + protected pages work without Convex.

## 5) Phase 4  Migrate remaining APIs and UI hooks

Migrate in this suggested order (least risky  most risky):
1. Departments
2. Doctors
3. Clients
4. Appointments (book/cancel/list/available-slots)
5. Dashboard stats + reports
6. Settings + anti-abuse
7. Push notification scheduling endpoints

For each:
- Replace Convex calls in `app/api/**` with Supabase queries
- Replace Convex hooks in UI with Supabase/React Query hooks
- Add RLS policies as needed

## 6) Phase 5  Remove Convex

- Delete/stop using:
  - `convex/*`
  - `components/providers/convex-provider.tsx`
  - `lib/convex-client.ts`
  - Convex scripts in `package.json` (`convex:*`)
  - Convex env vars (`NEXT_PUBLIC_CONVEX_URL`)
- Remove dependencies:
  - `convex`, `@convex-dev/auth`

**Exit criteria:** `pnpm test` + `pnpm build` pass; no runtime Convex references.

## 7) Data + Schema work for Supabase

### 7.1 Tables
Map Convex tables/collections to Supabase tables:
- users
- clients
- departments
- doctors
- appointments
- otp_codes (if keeping custom OTP)
- system_settings
- department_availability

### 7.2 RLS policies (outline)
- Staff/admin can read/write operational tables.
- Clients can only read their own appointments.
- Public can only hit whitelisted RPCs/routes.

### 7.3 Migrations
- Prefer SQL migrations tracked in repo (e.g., `database/` folder), applied via Supabase CLI.

## 8) Testing / Verification checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] Auth flows work (client OTP, staff login)
- [ ] CRUD flows work for migrated slices
- [ ] RLS rules verified with anon key

## 9) Rollout strategy

- Keep Convex + Supabase running in parallel during migration.
- Toggle each route/screen behind a feature flag if needed.
- Migrate data once at the end (or keep dual-writes if absolutely necessary).

---

## Next action (recommended)

1) Scaffold Supabase deps + `lib/supabase/*` + env keys.
2) Migrate **Departments** as the first vertical slice.
