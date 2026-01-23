# Convex Migration Guide

This document outlines the migration from PostgreSQL + Better Auth to Convex.

## ✅ Completed Steps

### 1. Infrastructure Setup
- ✅ Installed Convex package (`pnpm add convex`)
- ✅ Created `convex.json` configuration
- ✅ Created Convex schema based on PostgreSQL tables

### 2. Schema Migration
- ✅ Converted all PostgreSQL tables to Convex tables
- ✅ Added proper indexes for query performance
- ✅ Tables migrated:
  - `users` (staff: receptionists, admins)
  - `clients` (separate from users)
  - `departments`
  - `doctors`
  - `appointments`
  - `system_settings`
  - `department_availability`
  - `appointment_statuses`
  - `otp_codes`
  - `rate_limits` (anti-abuse)
  - `calendar_config`
  - `otp_config`

### 3. Authentication
- ✅ Created Convex authentication functions (`convex/auth.ts`)
- ✅ Replaced Better Auth with custom OTP system
- ✅ Implemented:
  - OTP generation and verification
  - Staff login with employee_id/password
  - Rate limiting for OTP requests
  - Session management

### 4. Queries & Mutations
- ✅ Created comprehensive query functions (`convex/queries.ts`)
- ✅ Created mutation functions (`convex/mutations.ts`)
- ✅ Created action functions for external services (`convex/actions.ts`)
- ✅ Created HTTP endpoints (`convex/http.ts`)

### 5. Client-Side Integration
- ✅ Created Convex React provider
- ✅ Created custom hooks for authentication (`use-convex-auth.ts`)
- ✅ Created custom hooks for data fetching (`use-convex-queries.ts`)
- ✅ Updated root layout to use Convex provider

### 6. Configuration
- ✅ Created `.env.example` with Convex configuration
- ✅ Documented environment variables

## 📋 Next Steps (To Complete Migration)

### 1. Initialize Convex Backend
```bash
# Login to Convex (interactive)
npx convex dev

# This will:
# - Create a new Convex project
# - Generate your NEXT_PUBLIC_CONVEX_URL
# - Deploy your schema and functions
# - Start watching for changes
```

### 2. Configure Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-name

# Optional: SMS integration
HUBTEL_CLIENT_ID=your-hubtel-client-id
HUBTEL_CLIENT_SECRET=your-hubtel-client-secret
HUBTEL_SENDER_ID=AGAHF
```

### 3. Seed Initial Data
Run the seed action to populate default data:
```bash
# After running `npx convex dev`, in another terminal:
npx convex run actions:seedInitialData
```

### 4. Update Components to Use Convex Hooks

Replace TanStack Query hooks with Convex hooks:

**Before (PostgreSQL + TanStack Query):**
```tsx
import { useQuery } from "@tanstack/react-query";

function MyComponent() {
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => fetch("/api/clients").then(r => r.json())
  });
}
```

**After (Convex):**
```tsx
import { useClients } from "@/hooks/use-convex-queries";

function MyComponent() {
  const clients = useClients();
  // Note: Convex returns undefined while loading
}
```

### 5. Update Authentication Usage

**Before (Better Auth):**
```tsx
import { useSession } from "@/lib/auth-client";

function MyComponent() {
  const { data: session } = useSession();
}
```

**After (Convex):**
```tsx
import { useConvexAuth } from "@/hooks/use-convex-auth";

function MyComponent() {
  const { user, isAuthenticated, logout } = useConvexAuth();
}
```

### 6. Migrate API Routes (Examples)

Most API routes are replaced by Convex functions. Remove these files after updating components:

- `/api/appointments/*` → Use `useAppointments()` hook
- `/api/clients/*` → Use `useClients()` hook
- `/api/departments/*` → Use `useDepartments()` hook
- `/api/auth/*` → Use `useConvexAuth()` hook

### 7. Remove PostgreSQL Dependencies

After verifying everything works with Convex:

```bash
pnpm remove pg @types/pg ioredis better-auth bcryptjs jsonwebtoken
```

Remove files:
- `lib/db.ts`
- `lib/db-types.ts`
- `lib/db-services.ts`
- `lib/auth.ts`
- `lib/auth-server.ts`
- `scripts/*.sql`
- All API route files

### 8. Update package.json Scripts

Remove PostgreSQL-related scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "convex:dev": "npx convex dev",
    "convex:deploy": "npx convex deploy"
  }
}
```

## 🔄 Migration Strategy

### Gradual Migration (Recommended)
1. Keep both PostgreSQL and Convex running temporarily
2. Migrate components one page at a time
3. Test each page thoroughly
4. Once all pages are migrated, remove PostgreSQL

### Direct Migration (Faster but riskier)
1. Deploy all Convex functions
2. Update all components at once
3. Remove PostgreSQL immediately

## 📊 Data Migration

If you have existing data in PostgreSQL:

### Option 1: Manual Export/Import
1. Export data from PostgreSQL
2. Create migration script to insert into Convex
3. Run migration

### Option 2: Fresh Start
1. Start with fresh Convex database
2. Run seed function to populate default data
3. Add new data as needed

## 🎯 Key Differences

### PostgreSQL vs Convex

| Feature | PostgreSQL | Convex |
|---------|-----------|--------|
| **Queries** | SQL strings | Type-safe functions |
| **Real-time** | Polling/Webhooks | Built-in reactive |
| **Caching** | Manual (Redis/TanStack) | Automatic |
| **Authentication** | Better Auth | Custom or Convex Auth |
| **Transactions** | SQL BEGIN/COMMIT | Automatic |
| **Indexing** | Manual SQL | Schema definition |
| **Hosting** | Self-hosted/Cloud | Convex Cloud |

### Benefits of Convex
- ✅ Real-time updates out of the box
- ✅ Automatic caching and optimization
- ✅ Type-safe queries and mutations
- ✅ No SQL injection vulnerabilities
- ✅ Simpler deployment
- ✅ Built-in development dashboard
- ✅ Automatic scaling

## 🔧 Development Workflow

### Starting Development
```bash
# Terminal 1: Run Convex backend
npx convex dev

# Terminal 2: Run Next.js frontend
pnpm dev
```

### Deploying to Production
```bash
# Deploy Convex functions
npx convex deploy --prod

# Deploy Next.js app (Vercel, etc.)
pnpm build
```

## 📝 Notes

- Convex uses milliseconds for timestamps (Date.now()) instead of TIMESTAMP
- IDs are type-safe: `Id<"users">` instead of `number`
- Queries are reactive: components re-render when data changes
- No need for `useMutation` refetch - Convex updates automatically
- Rate limiting is built into the schema and functions

## 🆘 Troubleshooting

### "NEXT_PUBLIC_CONVEX_URL not set"
Run `npx convex dev` to get your URL and add it to `.env.local`

### "Cannot find module '@/convex/_generated/api'"
Run `npx convex dev` to generate the API types

### Functions not deploying
Check `convex.json` is in the root and run `npx convex dev` again

## 📚 Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react)
- [Convex Authentication](https://docs.convex.dev/auth)
