// 🚀 Staff Dashboard Stats API (Supabase + Memory Cache)

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
const { MemoryCache } = require("@/lib/memory-cache.js");

export async function GET() {
  const requestStart = Date.now();

  try {
    const today = new Date().toISOString().split("T")[0];

    const stats = await MemoryCache.get(
      `staff_stats_${today}`,
      async () => {
        const supabase = await createServerSupabaseClient();

        // Appointment counts
        const [todayCountRes, completedTodayRes, monthCountRes, upcomingCountRes, activeStaffRes] =
          await Promise.all([
            supabase
              .from("appointments")
              .select("id", { count: "exact", head: true })
              .eq("appointment_date", today)
              .not("status", "in", "(cancelled)"),
            supabase
              .from("appointments")
              .select("id", { count: "exact", head: true })
              .eq("appointment_date", today)
              .eq("status", "completed"),
            supabase
              .from("appointments")
              .select("id", { count: "exact", head: true })
              .gte("appointment_date", today.slice(0, 7) + "-01")
              .lte("appointment_date", today),
            supabase
              .from("appointments")
              .select("id", { count: "exact", head: true })
              .gte("appointment_date", today)
              .not("status", "in", "(cancelled,completed,no_show)"),
            supabase
              .from("users")
              .select("id", { count: "exact", head: true })
              .eq("is_active", true),
          ]);

        if (todayCountRes.error) throw new Error(todayCountRes.error.message);
        if (completedTodayRes.error) throw new Error(completedTodayRes.error.message);
        if (monthCountRes.error) throw new Error(monthCountRes.error.message);
        if (upcomingCountRes.error) throw new Error(upcomingCountRes.error.message);

        // Slots: sum department slots_per_day minus booked for today
        const [deptSlotsRes, bookedTodayRes] = await Promise.all([
          supabase
            .from("departments")
            .select("slots_per_day")
            .eq("is_active", true),
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("appointment_date", today)
            .not("status", "in", "(cancelled)"),
        ]);

        if (deptSlotsRes.error) throw new Error(deptSlotsRes.error.message);
        if (bookedTodayRes.error) throw new Error(bookedTodayRes.error.message);

        const totalSlots = (deptSlotsRes.data || []).reduce(
          (sum: number, d: any) => sum + (d.slots_per_day ?? 0),
          0
        );
        const bookedSlots = bookedTodayRes.count ?? 0;

        // Recent appointments (today)
        const recentRes = await supabase
          .from("appointments")
          .select(
            "id,appointment_date,slot_number,status,clients(name,x_number),departments(name,color),doctors(name)"
          )
          .eq("appointment_date", today)
          .order("appointment_date", { ascending: false })
          .order("slot_number", { ascending: false })
          .limit(5);

        if (recentRes.error) throw new Error(recentRes.error.message);

        return {
          upcomingAppointments: upcomingCountRes.count ?? 0,
          totalAppointments: monthCountRes.count ?? 0,
          completedAppointments: completedTodayRes.count ?? 0,
          availableSlots: Math.max(0, totalSlots - bookedSlots),
          daysUntilNext: null,
          activeStaffCount: activeStaffRes.count ?? 0,
          recentAppointments: (recentRes.data || []).map((row: any) => ({
            id: row.id,
            date: (row.appointment_date || "").toString().split("T")[0],
            slotNumber: row.slot_number,
            status: row.status,
            doctorName: row.doctors?.name ?? null,
            departmentName: row.departments?.name ?? "",
            departmentColor: row.departments?.color ?? null,
            clientName: row.clients?.name ?? null,
            clientXNumber: row.clients?.x_number ?? null,
          })),
        };
      },
      "dashboardStats"
    );

    const responseTime = Date.now() - requestStart;

    return NextResponse.json(
      {
        success: true,
        data: stats,
        meta: {
          responseTime: `${responseTime}ms`,
          cached: responseTime < 20,
          cacheType: "memory",
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          "X-Response-Time": `${responseTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error("Error fetching staff dashboard stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
