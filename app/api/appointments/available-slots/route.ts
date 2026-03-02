// 🚀 Available Slots API (Supabase) with Memory Caching
// Preserves response shape used by booking UI.

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSlotTimeInfo, type WorkingHours } from "@/lib/slot-time-utils";
const { MemoryCache } = require("@/lib/memory-cache.js");

const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function isWorkingDayFromArray(workingDays: string[] | null, date: string): boolean {
  if (!workingDays || workingDays.length === 0) return false;
  const d = new Date(date);
  const dayName = dayNames[d.getDay()];
  return workingDays.includes(dayName);
}

export async function GET(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const departmentIdRaw = searchParams.get("departmentId");
    const date = searchParams.get("date");

    if (!departmentIdRaw || !date) {
      return NextResponse.json(
        { error: "departmentId and date are required" },
        { status: 400 }
      );
    }

    const departmentId = parseInt(departmentIdRaw, 10);
    if (Number.isNaN(departmentId)) {
      return NextResponse.json(
        { error: "departmentId must be a number" },
        { status: 400 }
      );
    }

    const cacheKey = `available_slots_${departmentId}_${date}`;

    const slotsData = await MemoryCache.get(
      cacheKey,
      async () => {
        const supabase = await createServerSupabaseClient();

        // Load department config (slots per day + working days + slot duration)
        const { data: dept, error: deptErr } = await supabase
          .from("departments")
          .select("id,slots_per_day,working_days,working_hours,slot_duration_minutes")
          .eq("id", departmentId)
          .single();

        if (deptErr || !dept) {
          throw new Error("Department not found");
        }

        const workingDays = (dept as any).working_days as string[] | null;
        const slotsPerDay = (dept as any).slots_per_day as number | null;
        const workingHours = (dept as any).working_hours as WorkingHours | null;
        const slotDuration = (dept as any).slot_duration_minutes as number | null || 30;

        // Not a working day -> no slots.
        if (!isWorkingDayFromArray(workingDays, date)) {
          return {
            available_slots: [],
            total_available: 0,
            department_id: departmentId,
            date,
            fetched_at: new Date().toISOString(),
          };
        }

        const totalSlots = slotsPerDay || 10;

        // Fetch booked slots (exclude cancelled/no_show)
        const { data: booked, error: bookedErr } = await supabase
          .from("appointments")
          .select("slot_number,status")
          .eq("department_id", departmentId)
          .eq("appointment_date", date)
          .not("status", "in", "(cancelled,no_show)");

        if (bookedErr) throw new Error(bookedErr.message);

        const bookedSlots = new Set<number>(
          (booked || []).map((r: any) => Number(r.slot_number)).filter((n) => !Number.isNaN(n))
        );

        const availableSlots: Array<{
          slotNumber: number;
          time: string;
          startTime: string | null;
          endTime: string | null;
        }> = [];
        for (let i = 1; i <= totalSlots; i++) {
          if (!bookedSlots.has(i)) {
            const slotTimeInfo = workingHours
              ? getSlotTimeInfo(workingHours, i, slotDuration)
              : null;

            availableSlots.push({
              slotNumber: i,
              time: slotTimeInfo?.displayTime || `Slot ${i}`,
              startTime: slotTimeInfo?.startTime || null,
              endTime: slotTimeInfo?.endTime || null,
            });
          }
        }

        return {
          available_slots: availableSlots,
          total_available: availableSlots.length,
          department_id: departmentId,
          date,
          slot_duration_minutes: slotDuration,
          fetched_at: new Date().toISOString(),
        };
      },
      "availableSlots" // 15-second cache
    );

    const responseTime = Date.now() - requestStart;

    return NextResponse.json(
      {
        success: true,
        data: slotsData,
        meta: {
          responseTime: `${responseTime}ms`,
          cached: responseTime < 10,
          cacheType: "memory",
          departmentId: departmentIdRaw,
          date,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
          "X-Response-Time": `${responseTime}ms`,
          "X-Cache-Type": "memory",
        },
      }
    );
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Available Slots API error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to fetch available slots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Note: Next.js Route Handlers must not export arbitrary helpers.
// Cache invalidation helpers live in `lib/appointments-cache.ts`.
