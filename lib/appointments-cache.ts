// Centralized cache invalidation helpers for appointments.
//
// IMPORTANT: Next.js Route Handler modules (`app/api/**/route.ts`) cannot export
// arbitrary helpers without breaking `.next/types` generation. Keep helpers like
// these in `lib/` (or another non-route module) and import them from routes.

const { MemoryCache } = require("@/lib/memory-cache.js");

export async function invalidateAvailableSlotsCache(
  departmentId: number,
  date: string
) {
  await MemoryCache.invalidate(`available_slots_${departmentId}_${date}`);
  await MemoryCache.invalidate(`available_slots_week_`);
}

export async function invalidateAppointmentsListCache() {
  await MemoryCache.invalidate("appointments_list_");
  await MemoryCache.invalidate("appointment_status_colors");
}
