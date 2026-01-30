// 🚀 ULTRA-FAST Departments API with Memory Caching (Supabase)
//
// This file previously used the legacy `lib/db-services.ts` (direct Postgres).
// As part of Phase 4 migration, it now uses Supabase while preserving:
// - response shape
// - MemoryCache semantics

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
const { MemoryCache } = require("@/lib/memory-cache.js");

type DepartmentRow = {
  id: number;
  name: string;
  description: string | null;
  slots_per_day: number | null;
  working_days: string[] | null;
  working_hours: { start: string; end: string } | null;
  color: string | null;
  is_active: boolean | null;
};

function normalizeDepartment(d: DepartmentRow) {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    slots_per_day: d.slots_per_day ?? 10,
    working_days: d.working_days ?? ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: d.working_hours ?? { start: "09:00", end: "17:00" },
    color: d.color ?? "#3B82F6",
    is_active: d.is_active ?? true,
  };
}

export async function GET(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    // 🚀 Smart cache key based on whether we need availability data
    const cacheKey = date
      ? `departments_with_availability_${date}`
      : "departments_all";

    const departments = await MemoryCache.get(
      cacheKey,
      async () => {
        const supabase = await createServerSupabaseClient();

        // Base departments (active only)
        const { data: departmentData, error: deptError } = await supabase
          .from("departments")
          .select(
            "id,name,description,slots_per_day,working_days,working_hours,color,is_active"
          )
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (deptError) throw new Error(deptError.message);

        const baseDepartments = (departmentData || []).map(normalizeDepartment);

        // If no date, return base departments.
        if (!date) return baseDepartments;

        // Enrich with availability for a given date.
        // This mimics the old SQL join performed by DepartmentService.getDepartmentsWithAvailability().
        // We compute in JS to avoid introducing RPCs/views at this stage.

        const [availabilityRes, appointmentsRes] = await Promise.all([
          supabase
            .from("department_availability")
            .select("department_id,available_slots,is_available,date")
            .eq("date", date),
          supabase
            .from("appointments")
            .select("id,department_id,status,appointment_date")
            .eq("appointment_date", date)
            .not("status", "in", "(cancelled,no_show)"),
        ]);

        if (availabilityRes.error) {
          throw new Error(availabilityRes.error.message);
        }
        if (appointmentsRes.error) {
          throw new Error(appointmentsRes.error.message);
        }

        const availabilityByDept = new Map<
          number,
          { available_slots: number | null; is_available: boolean | null }
        >();

        for (const row of availabilityRes.data || []) {
          availabilityByDept.set(row.department_id, {
            available_slots: row.available_slots,
            is_available: row.is_available,
          });
        }

        const apptCountByDept = new Map<number, number>();
        for (const appt of appointmentsRes.data || []) {
          const deptId = appt.department_id as number;
          apptCountByDept.set(deptId, (apptCountByDept.get(deptId) ?? 0) + 1);
        }

        return baseDepartments.map((dept) => {
          const availability = availabilityByDept.get(dept.id);
          const totalAppointmentsToday = apptCountByDept.get(dept.id) ?? 0;

          return {
            ...dept,
            // Keep the old naming from DepartmentWithAvailability
            available_slots_today: availability?.available_slots ?? dept.slots_per_day,
            is_available_today: availability?.is_available ?? true,
            total_appointments_today: totalAppointmentsToday,
          };
        });
      },
      // 🎯 Cache strategy: departments rarely change, availability changes more frequently
      date ? "availableSlots" : "departments" // 15s for availability, 1hr for general departments
    );

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Departments API (cached-route): ${responseTime}ms`);

    const response = NextResponse.json({
      success: true,
      data: departments,
      meta: {
        responseTime: `${responseTime}ms`,
        cached: responseTime < 10,
        cacheType: "memory",
        date: date || null,
      },
    });

    const maxAge = date ? 15 : 300;
    response.headers.set(
      "Cache-Control",
      `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`
    );
    response.headers.set("ETag", `departments-cached-${Date.now()}`);
    response.headers.set("X-Response-Time", `${responseTime}ms`);
    response.headers.set("X-Cache-Type", "memory");

    return response;
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Departments API error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to fetch departments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Keep behavior consistent with `app/api/departments/route.ts`.
  // (This route exists mainly for compatibility; prefer the main route.)
  const requestStart = Date.now();

  try {
    const body = await request.json();

    const { name } = body;
    if (!name) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: department, error } = await supabase
      .from("departments")
      .insert({
        name,
        description: body.description ?? null,
        slots_per_day: body.slots_per_day ?? 10,
        working_days: body.working_days ?? [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
        ],
        working_hours: body.working_hours ?? { start: "09:00", end: "17:00" },
        color: body.color ?? "#3B82F6",
        is_active: true,
      })
      .select(
        "id,name,description,slots_per_day,working_days,working_hours,color,is_active"
      )
      .single();

    if (error) throw new Error(error.message);

    await MemoryCache.invalidate("departments_");

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Department creation (cached-route): ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: department,
      meta: {
        responseTime: `${responseTime}ms`,
        cacheInvalidated: true,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Department creation error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to create department",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Note: Next.js Route Handlers must not export arbitrary helpers.
// Cache invalidation should be triggered by calling `MemoryCache.invalidate()`
// within the handler methods (GET/POST/PUT/DELETE) or by moving helpers to a
// separate module outside `route.ts`.
