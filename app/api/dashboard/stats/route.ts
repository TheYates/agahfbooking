// 🚀 Dashboard Stats API (Supabase + Memory Cache)

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
const { MemoryCache } = require("@/lib/memory-cache.js");

type DashboardStats = {
  upcomingAppointments: number;
  totalAppointments: number;
  completedAppointments: number;
  availableSlots: number;
  daysUntilNext: number | null;
  recentAppointments: Array<{
    id: number;
    date: string;
    slotNumber: number;
    status: string;
    doctorName?: string | null;
    departmentName: string;
    departmentColor?: string | null;
  }>;
};

export async function GET(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const stats = await MemoryCache.get(
      `dashboard_stats_${clientId}`,
      async () => {
        const supabase = await createServerSupabaseClient();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Query appointments directly instead of using materialized view
        const [upcomingCount, totalMonthCount, completedCount, nextAppointment] = await Promise.all([
          // Upcoming appointments (today and future, not cancelled/completed)
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .gte("appointment_date", today.toISOString().split('T')[0])
            .not("status", "in", "(cancelled,completed,no_show)")
            .then(res => res.count || 0),

          // Total appointments this month
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .gte("appointment_date", firstDayOfMonth.toISOString().split('T')[0])
            .then(res => res.count || 0),

          // Completed appointments
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .eq("status", "completed")
            .then(res => res.count || 0),

          // Next appointment
          supabase
            .from("appointments")
            .select("appointment_date")
            .eq("client_id", clientId)
            .gte("appointment_date", today.toISOString().split('T')[0])
            .not("status", "in", "(cancelled)")
            .order("appointment_date", { ascending: true })
            .limit(1)
            .maybeSingle()
            .then(res => res.data)
        ]);

        // Days until next appointment
        let daysUntilNext: number | null = null;
        if (nextAppointment?.appointment_date) {
          const nextDate = new Date(nextAppointment.appointment_date);
          nextDate.setHours(0, 0, 0, 0);
          daysUntilNext = Math.ceil(
            (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        const availableSlots = 50;

        // Upcoming appointments (soonest first)
        const recentAppointments = await MemoryCache.get(
          `recent_appointments_${clientId}`,
          async () => {
            const recentRes = await supabase
              .from("appointments")
              .select(
                "id,appointment_date,slot_number,slot_start_time,slot_end_time,status,departments(name,color),doctors(name)"
              )
              .eq("client_id", clientId)
              .gte("appointment_date", today.toISOString().split('T')[0])
              .not("status", "in", "(cancelled,completed,no_show)")
              .order("appointment_date", { ascending: true })
              .order("slot_number", { ascending: true })
              .limit(5);

            if (recentRes.error) throw new Error(recentRes.error.message);

            return (recentRes.data || []).map((row: any) => ({
              id: row.id,
              date: (row.appointment_date || "").toString().split("T")[0],
              slotNumber: row.slot_number,
              slotStartTime: row.slot_start_time ?? null,
              slotEndTime: row.slot_end_time ?? null,
              status: row.status,
              doctorName: row.doctors?.name ?? null,
              departmentName: row.departments?.name ?? "",
              departmentColor: row.departments?.color ?? null,
            }));
          },
          "recentActivity"
        );

        return {
          upcomingAppointments: upcomingCount,
          totalAppointments: totalMonthCount,
          completedAppointments: completedCount,
          availableSlots,
          daysUntilNext,
          recentAppointments,
        } satisfies DashboardStats;
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
          "X-Cache-Type": "memory",
        },
      }
    );
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Dashboard API error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Note: Next.js Route Handlers must not export arbitrary helpers.
