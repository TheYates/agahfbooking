# High-Level System Architecture

## Overview
This project is a Next.js (App Router) application for appointment scheduling, client management, and staff/reviewer workflows. It uses:
- **Next.js App Router** for UI routes and API routes.
- **Supabase/Postgres** as the primary data store.
- **TanStack Query** for data fetching/caching in the client.
- **PWA** features for offline support and notifications.

---

## Frontend (UI Layer)
- **App Router Pages**: `app/**` (dashboard, calendar, appointments, reviews, settings, etc.).
- **Reusable Components**: `components/**` (calendar, appointments, reviews, settings, UI primitives).
- **Hooks**: `hooks/**` (session, queries, offline, PWA).

Key UI modules:
- **Calendar Views**: `components/calendar/*` (mobile + desktop).
- **Appointment Management**: `components/appointments/*`.
- **Reviewer Workflow**: `components/reviews/*`.
- **Dashboard**: `components/dashboard/*`.

---

## Backend (API Layer)
- **Next.js API Routes**: `app/api/**`
  - Appointments: `/api/appointments/*`
  - Auth: `/api/auth/*`
  - Calendar: `/api/calendar/*`
  - Settings: `/api/settings/*`
  - Reports: `/api/reports/*`

APIs typically:
1. Validate session/user role
2. Call database services (`lib/db-services.ts`)
3. Return structured response

---

## Data Layer
- **Supabase/Postgres**: primary database.
- **Database scripts**: `database/*.sql`
- **Supabase client setup**: `lib/supabase/*`

Data access:
- `lib/db.ts` and `lib/db-services.ts` for queries and operations.
- Shared types in `lib/types.ts` and `lib/db-types.ts`.

---

## Auth & Roles
- Auth services in `lib/auth*.ts`
- Role-aware logic in API routes and UI components.
- Roles include: `admin`, `receptionist`, `reviewer`, `client`.

---

## Notifications & Integrations
- **SMS services**: `lib/hubtel-service.ts`, `lib/arkesel-sms.ts`
- **Push notifications**: `lib/push-notification-service.ts`
- **PWA**: `components/pwa/*` and `public/sw.js`

---

## Caching & Performance
- **TanStack Query** for client-side caching.
- **Memory/Redis caching**: `lib/memory-cache.ts`, `lib/redis-cache.ts`
- Cached API routes: `app/api/**/cached-route.ts`

---

## File Structure (Summary)
```
app/                 # Next.js App Router pages + API routes
components/          # UI components and features
hooks/               # Client hooks
lib/                 # Services, auth, db, utilities
database/            # SQL migrations/scripts
public/              # Static assets + PWA files
```

---

## Architecture Diagram (Text)
```
[ Client (Browser/PWA) ]
        |
        v
[ Next.js App Router (UI) ]
        |
        v
[ Next.js API Routes ]
        |
        v
[ DB Services / Auth / Notifications ]
        |
        v
[ Supabase/Postgres ]
        |
        v
[ External Services ] ---> SMS, Push Notifications
```

---

## Typical Data Flow
1. User action in UI triggers hook or mutation.
2. Hook calls API route (Next.js).
3. API validates auth + role, calls DB services.
4. Response cached by TanStack Query for UI updates.

---

## Detailed Data Flow (Appointments & Reviews)
1. Reviewer opens calendar or reviews list.
2. UI fetches data via `useCalendarData` / review queries.
3. Reviewer confirms or requests reschedule.
4. UI calls `/api/appointments/review`.
5. API validates reviewer role and updates appointment status.
6. Notifications are queued (SMS/push) if configured.
7. Client cache invalidates and refreshes the UI.

---

## Deployment & Runtime Notes
- **Runtime**: Next.js server (Node.js) handles SSR and API routes.
- **DB**: Supabase-hosted Postgres.
- **Caching**: TanStack Query client-side; optional memory/redis caches for API responses.
- **PWA**: Service worker provides offline support and notification prompts.

---
