# ✅ Convex Migration Checklist

## 🎯 Setup Phase (Do This First!)

### Initial Setup
- [ ] Run `npx convex dev` (creates your Convex project)
- [ ] Copy `NEXT_PUBLIC_CONVEX_URL` from terminal output
- [ ] Create `.env.local` with the URL
- [ ] Run `pnpm convex:seed` (seeds initial data)
- [ ] Verify Convex dashboard opens at https://dashboard.convex.dev

**Estimated time:** 5-10 minutes

---

## 📦 What's Already Done

### ✅ Infrastructure (Completed)
- ✅ Convex package installed via pnpm
- ✅ `convex.json` configuration created
- ✅ Convex folder structure set up
- ✅ Environment template created (`.env.example`)

### ✅ Backend (Completed)
- ✅ Schema with 12 tables (`convex/schema.ts`)
- ✅ 30+ query functions (`convex/queries.ts`)
- ✅ 20+ mutation functions (`convex/mutations.ts`)
- ✅ Authentication system (`convex/auth.ts`)
- ✅ SMS integration (`convex/actions.ts`)
- ✅ HTTP endpoints (`convex/http.ts`)

### ✅ Frontend Integration (Completed)
- ✅ Convex React provider (`components/providers/convex-provider.tsx`)
- ✅ Root layout updated to use Convex
- ✅ Authentication hook (`hooks/use-convex-auth.ts`)
- ✅ Data fetching hooks (`hooks/use-convex-queries.ts`)

### ✅ Documentation (Completed)
- ✅ Full migration guide (`CONVEX_MIGRATION.md`)
- ✅ Quick start guide (`CONVEX_QUICK_START.md`)
- ✅ Migration summary (`MIGRATION_SUMMARY.md`)
- ✅ Before/After comparison (`BEFORE_AND_AFTER.md`)
- ✅ Function reference (`convex/README.md`)
- ✅ This checklist (`CONVEX_CHECKLIST.md`)

---

## 🔄 Component Migration Phase (Do This Next!)

### Priority 1: Authentication Pages
- [ ] `/app/login/page.tsx` - Replace with `useConvexAuth()`
- [ ] `/app/staff-login/page.tsx` - Replace with `useConvexAuth()`
- [ ] Test OTP flow
- [ ] Test staff login

### Priority 2: Dashboard Home
- [ ] `/app/dashboard/page.tsx` - Replace with `useDashboardStats()`
- [ ] Verify stats display correctly
- [ ] Test real-time updates

### Priority 3: Clients Management
- [ ] `/app/dashboard/clients/page.tsx` - Replace with `useClients()`
- [ ] Update client list component
- [ ] Update create client modal (`components/clients/add-client-modal.tsx`)
- [ ] Update edit client form (`components/clients/edit-client-form.tsx`)
- [ ] Test CRUD operations

### Priority 4: Appointments
- [ ] `/app/dashboard/appointments/page.tsx` - Replace with `useAppointments()`
- [ ] Update desktop appointments view
- [ ] Update mobile appointments view
- [ ] Test booking flow
- [ ] Test cancellation
- [ ] Test status updates

### Priority 5: Calendar
- [ ] `/app/dashboard/calendar/page.tsx` - Replace with Convex hooks
- [ ] Update calendar view component
- [ ] Update booking modal
- [ ] Test slot availability
- [ ] Test appointment creation from calendar

### Priority 6: Departments
- [ ] `/app/dashboard/departments/page.tsx` - Replace with `useDepartments()`
- [ ] Test department list
- [ ] Test create/edit/delete

### Priority 7: Users Management
- [ ] `/app/dashboard/users/page.tsx` - Replace with `useUsers()`
- [ ] Test user list
- [ ] Test create/edit/delete
- [ ] Test toggle active status

### Priority 8: Settings
- [ ] `/app/dashboard/settings/page.tsx` - Replace with `useSystemSettings()`
- [ ] `/app/dashboard/settings/anti-abuse/page.tsx`
- [ ] Test settings updates

### Priority 9: My Appointments (Client View)
- [ ] `/app/dashboard/my-appointments/page.tsx`
- [ ] Test client appointment list

### Priority 10: Reports
- [ ] `/app/dashboard/reports/page.tsx`
- [ ] Update report generation

---

## 🧪 Testing Phase

### Functionality Tests
- [ ] Create a new client
- [ ] Book an appointment
- [ ] Cancel an appointment
- [ ] Reschedule an appointment
- [ ] Search for clients
- [ ] View dashboard stats
- [ ] Login as client (OTP)
- [ ] Login as staff (password)
- [ ] Create a new department
- [ ] Generate a report

### Real-time Tests
- [ ] Open two browser windows
- [ ] Create appointment in one window
- [ ] Verify it appears in other window automatically
- [ ] Update appointment status
- [ ] Verify real-time update

### Performance Tests
- [ ] Check page load times
- [ ] Verify no unnecessary re-renders
- [ ] Test with multiple concurrent users
- [ ] Monitor Convex dashboard for slow queries

---

## 🗑️ Cleanup Phase (Do This Last!)

### Remove PostgreSQL Dependencies
- [ ] Stop PostgreSQL database
- [ ] Run `pnpm remove pg @types/pg`
- [ ] Run `pnpm remove ioredis` (Redis no longer needed)
- [ ] Run `pnpm remove better-auth` (if not using elsewhere)
- [ ] Run `pnpm remove bcryptjs jsonwebtoken @types/bcryptjs`

### Delete Unused Files
- [ ] Delete `lib/db.ts`
- [ ] Delete `lib/db-types.ts`
- [ ] Delete `lib/db-services.ts`
- [ ] Delete `lib/auth.ts`
- [ ] Delete `lib/auth-server.ts`
- [ ] Delete `lib/redis-cache.ts`
- [ ] Delete `lib/cache-utils.ts`
- [ ] Delete `lib/memory-cache.ts`
- [ ] Delete entire `scripts/` folder (SQL scripts)
- [ ] Delete all files in `app/api/` (API routes)

### Update Configuration
- [ ] Remove PostgreSQL env vars from `.env.example`
- [ ] Update `package.json` scripts (remove db: scripts)
- [ ] Update README if you have one
- [ ] Remove `database/` folder

### Final Verification
- [ ] Run `pnpm build` (verify no errors)
- [ ] Test production build locally
- [ ] Deploy to staging/production
- [ ] Monitor for errors

---

## 📊 Migration Progress Tracker

**Total Pages:** ~10  
**Migrated:** 0  
**Remaining:** 10  
**Progress:** 0%

Update this as you go! 🎯

---

## 🚀 Quick Commands Reference

```bash
# Start Convex backend
npx convex dev

# Start Next.js frontend
pnpm dev

# Seed initial data
pnpm convex:seed

# Deploy to production
npx convex deploy --prod

# View logs
# Check Convex dashboard at https://dashboard.convex.dev
```

---

## 📚 Documentation Quick Links

| What | Where |
|------|-------|
| Quick patterns & examples | `CONVEX_QUICK_START.md` |
| Detailed migration steps | `CONVEX_MIGRATION.md` |
| Before/after comparisons | `BEFORE_AND_AFTER.md` |
| Function reference | `convex/README.md` |
| This checklist | `CONVEX_CHECKLIST.md` |

---

## 🎊 Success Criteria

You've successfully migrated when:

- ✅ All pages load without PostgreSQL
- ✅ All CRUD operations work
- ✅ Authentication works (OTP + staff login)
- ✅ Real-time updates work
- ✅ No console errors
- ✅ Build succeeds (`pnpm build`)
- ✅ PostgreSQL is uninstalled
- ✅ Old API routes are deleted

---

**Ready to start?** Begin with the Setup Phase above! 🚀

**Questions?** Check the documentation files or visit https://docs.convex.dev/
