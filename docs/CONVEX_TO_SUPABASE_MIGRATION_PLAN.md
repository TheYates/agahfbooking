# Convex → Supabase Migration Plan

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

## 2) Phase 1 → Scaffold Supabase (no behavior changes)

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
- `lib/supabase/browser.ts` → browser client using anon key
- `lib/supabase/server.ts` → server client for Route Handlers (uses cookies/session)
- `lib/supabase/admin.ts` → service-role client for admin tasks (seed, migrations, privileged ops)

### 2.4 Provider updates
- Replace `ConvexClientProvider` with a Supabase session/provider pattern.
  - If we use `@supabase/ssr`, we can keep session hydration consistent.
  - Keep existing UI working by migrating one screen at a time.

**Exit criteria:** app builds; no functional endpoints migrated yet.

## 3) Phase 2 → Choose a Vertical Slice and Migrate It End-to-End

Pick one domain to establish patterns:
- **Departments** (good first slice: small schema, used across UI)

### What "end-to-end" means
- Data model exists in Supabase
- API route uses Supabase (or UI calls Supabase directly) → no Convex
- UI reads/writes successfully
- Types updated

**Exit criteria:** One feature works without Convex.

## 4) Phase 3 → Migrate Auth

### 4.1 Replace `hooks/use-convex-auth.ts`
- Implement OTP + staff login using Supabase Auth.
  - Options:
    - Supabase Phone OTP (native)
    - Custom OTP tables + verification via server route (if you need Hubtel SMS)

### 4.2 Session handling
- Use Supabase session cookies in Route Handlers.
- Replace localStorage "convex_user" with Supabase session-based user identity.

**Exit criteria:** Login + protected pages work without Convex.

## 5) Phase 4 → Migrate remaining APIs and UI hooks

This phase is the bulk migration: replace Convex-backed route handlers + UI hooks domain-by-domain, while keeping UX stable.

### 5.1 Standard migration pattern (repeatable per domain)

For each domain (Departments, Doctors, Clients, Appointments, ...):

1) **Schema + types**
- Ensure tables + constraints exist in Supabase (SQL migrations under `database/`).
- Generate/maintain TypeScript types (either Supabase-generated types or local `lib/db-types.ts` equivalents).

2) **Server data access**
- For user-scoped operations: use `lib/supabase/server.ts` (cookie/session aware).
- For admin-only operations: use `lib/supabase/admin.ts` (service role key; Route Handler only).
- Keep all writes behind RLS unless explicitly admin-only.

3) **API routes**
- Replace Convex HTTP calls in `app/api/**` with Supabase queries.
- Preserve response shapes to avoid UI churn (or update UI + types in the same PR).
- If a route is cached today (`cached-route.ts`):
  - Keep caching semantics (e.g. Next `revalidate`/`fetch` cache or your existing memory cache),
  - But migrate the underlying data source.

4) **UI + hooks**
- Replace `hooks/use-convex-queries.ts` usage with React Query hooks that call:
  - Supabase directly (preferred for dashboards with RLS + anon key), or
  - Your API routes (preferred when you need server-side privileges or aggregation).

5) **Authorization**
- Add/adjust RLS policies for the domain.
- Verify behavior using the anon key (client) and a staff/admin user session.

6) **Verification**
- Update/add tests where you have coverage.
- Manually verify the UI screen(s) and API routes for the domain.

### 5.2 Suggested order (least risky → most risky)

1. Departments
2. Doctors
3. Clients
4. Appointments (book/cancel/list/available-slots)
5. Dashboard stats + reports
6. Settings + anti-abuse
7. Push notification scheduling endpoints

### 5.3 Concrete file-level checklist (by domain)

Use this to avoid missing endpoints during migration.

#### 5.3.1 Departments
- API routes:
  - `app/api/departments/route.ts`
  - `app/api/departments/cached-route.ts`
  - `app/api/departments/[id]/route.ts`
  - `app/api/departments/working-days/route.ts`
- UI pages/components:
  - `app/dashboard/departments/page.tsx`
  - `app/dashboard/departments/page-convex.tsx` (remove once migrated)
- Hooks:
  - Replace any usage of `hooks/use-hospital-queries.ts` for departments.

#### 5.3.2 Doctors
- API routes:
  - `app/api/doctors/route.ts`
  - `app/api/doctors/[id]/route.ts`
- UI pages/components:
  - Where doctors are displayed/selected (often tied to appointments + calendar views)

#### 5.3.3 Clients
- API routes:
  - `app/api/clients/route.ts`
  - `app/api/clients/[id]/route.ts`
  - `app/api/clients/stats/route.ts`
  - `app/api/clients/stats/cached-route.ts`
- UI pages/components:
  - `app/dashboard/clients/page.tsx`
  - `components/clients/*`

#### 5.3.4 Appointments
- API routes:
  - `app/api/appointments/route.ts`
  - `app/api/appointments/list/route.ts`
  - `app/api/appointments/list/cached-route.ts`
  - `app/api/appointments/available-slots/route.ts`
  - `app/api/appointments/available-slots/cached-route.ts`
  - `app/api/appointments/book/route.ts`
  - `app/api/appointments/cancel/route.ts`
  - `app/api/appointments/schedule/route.ts`
  - `app/api/appointments/validate/route.ts`
  - `app/api/appointments/client/route.ts`
  - `app/api/appointments/[id]/status/route.ts`
- UI pages/components:
  - `app/dashboard/appointments/*`
  - `components/appointments/*`
  - `components/calendar/*` (booking modal + calendar views often depend on appointments)

#### 5.3.5 Dashboard stats + reports
- API routes:
  - `app/api/dashboard/stats/route.ts`
  - `app/api/dashboard/stats/cached-route.ts`
  - `app/api/dashboard/stats/memory-cached-route.ts`
  - `app/api/dashboard/staff-stats/route.ts`
  - `app/api/reports/route.ts`
- UI pages/components:
  - `app/dashboard/page.tsx`
  - `components/dashboard/*`

#### 5.3.6 Settings + anti-abuse
- API routes:
  - `app/api/settings/system/route.ts`
  - `app/api/settings/anti-abuse/route.ts`
  - `app/api/settings/calendar-config/route.ts`
  - `app/api/settings/otp-config/route.ts`
- UI pages/components:
  - `app/dashboard/settings/*`
  - `components/settings/*`

#### 5.3.7 Push notification scheduling endpoints
- API routes:
  - `app/api/push/subscribe/route.ts`
  - `app/api/push/unsubscribe/route.ts`
  - `app/api/push/schedule/route.ts`

### 5.4 Exit criteria (Phase 4)

- All domain routes above no longer call Convex.
- No UI screen depends on `hooks/use-convex-queries.ts` / `hooks/use-hospital-queries.ts`.
- RLS policies verified for:
  - staff/admin access
  - client self-service access (where applicable)
  - anon user restrictions
- App builds and core flows are stable.

## 6) Phase 5 → Remove Convex

This phase happens after Phase 4 is complete (no remaining Convex calls in API routes or UI). The goal is to delete Convex infrastructure safely and leave the app fully Supabase-backed.

### 6.1 Pre-flight checklist (before deleting anything)

- [ ] Phase 4 exit criteria met (all migrated domains, no runtime Convex usage).
- [ ] Ensure the following are migrated or removed:
  - `hooks/use-convex-auth.ts`
  - `hooks/use-convex-queries.ts` and `hooks/use-hospital-queries.ts`
  - Any `*-convex.tsx` pages/components are either deleted or no longer imported
- [ ] Confirm production environment has Supabase env vars configured.
- [ ] Tag the last known-good commit on the Convex-backed version (easy rollback point).

### 6.2 Code removal (ordered)

1) **Stop importing Convex in runtime paths**
- Search for and remove/replace imports from:
  - `convex/react`, `convex/browser`, `convex/server`, `convex/values`
  - `ConvexHttpClient`, `ConvexReactClient`
  - `convex/_generated/*`

2) **Remove the Convex Provider**
- Delete `components/providers/convex-provider.tsx`.
- Update `app/layout.tsx` (and any nested layouts/providers) to remove the provider.
- Ensure any auth/session provider used for Supabase is the only one left.

3) **Remove Convex client utilities**
- Delete `lib/convex-client.ts`.
- Remove any wrappers/helpers that exist solely to call Convex from Route Handlers.

4) **Delete Convex-specific pages/components**
- Delete or archive any remaining files named `*-convex.tsx` that are no longer used.
  - Examples (non-exhaustive):
    - `app/dashboard/*/page-convex.tsx`
    - `components/**/**-convex.tsx`

5) **Delete the Convex backend directory**
- Delete the entire `convex/` directory:
  - `convex/schema.ts`, `convex/mutations.ts`, `convex/queries.ts`, `convex/http.ts`, `convex/auth/*`, `convex/actions/*`, etc.
- Delete `convex.json`.

### 6.3 Dependency + scripts cleanup

1) **package.json scripts**
- Remove Convex scripts:
  - `convex:dev`, `convex:deploy`, `convex:seed`, `convex:codegen`
- Update `dev:all` to no longer run `convex:dev`.

2) **package.json dependencies**
- Remove:
  - `convex`
  - `@convex-dev/auth`

3) **Lockfiles**
- Reinstall to update lockfile(s) (pnpm) after removing packages.

### 6.4 Environment variable cleanup

- Remove Convex variables from:
  - local `.env*` files (if present)
  - deployment environment config
- Examples:
  - `NEXT_PUBLIC_CONVEX_URL`
  - any `CONVEX_*` keys

### 6.5 CI/build/tooling cleanup

- Remove any Convex-specific build steps from CI (if present):
  - `convex codegen`
  - `convex deploy`
- Ensure Next build does not rely on generated Convex types.

### 6.6 Exit criteria (Phase 5)

- `pnpm lint` passes
- `pnpm test` passes
- `pnpm build` passes
- `grep -R "convex"` finds no runtime code references (docs are fine)
- Production deployment works using Supabase only

### 6.7 Verification + rollback strategy

**Staging verification (recommended):**
- Smoke test critical flows:
  - login/session persistence
  - departments/doctors/clients list pages
  - appointment booking + cancellation
  - dashboard stats endpoints
- Confirm server logs show no Convex network calls.
- Confirm Supabase RLS behavior using anon key (client) and staff/admin session.

**Rollback plan:**
- If an issue is found after deploying the "Convex removed" build:
  1) Roll back deployment to the last tagged Convex-backed commit (from 6.1).
  2) Re-enable Convex env vars/scripts if your deployment pipeline requires them.
  3) Keep Supabase data intact (no data rollback unless you implemented dual-writes).

> Tip: Do Phase 5 as its own small PR with minimal behavioral changes (mostly deletions). That keeps rollback simple.

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
