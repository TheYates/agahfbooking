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

        // If you have a view `dashboard_stats_mv` in Supabase, use it.
        const mvRes = await supabase
          .from("dashboard_stats_mv")
          .select(
            "upcoming_count,total_month_count,completed_count,next_appointment_date"
          )
          .eq("client_id", clientId)
          .maybeSingle();

        if (mvRes.error) {
          // If the view isn't available via Supabase, fall back to safe defaults.
          console.warn("dashboard_stats_mv query failed:", mvRes.error.message);
        }

        const dashboardData = mvRes.data;

        if (!dashboardData) {
          return {
            upcomingAppointments: 0,
            totalAppointments: 0,
            completedAppointments: 0,
            availableSlots: 0,
            daysUntilNext: null,
            recentAppointments: [],
          } satisfies DashboardStats;
        }

        // Days until next appointment
        let daysUntilNext: number | null = null;
        if (dashboardData.next_appointment_date) {
          const nextDate = new Date(dashboardData.next_appointment_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          daysUntilNext = Math.ceil(
            (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        // Available slots is currently a rough estimate in existing implementation.
        // Keep behavior stable for now.
        const availableSlots = 50;

        // Recent appointments
        const recentAppointments = await MemoryCache.get(
          `recent_appointments_${clientId}`,
          async () => {
            const recentRes = await supabase
              .from("appointments")
              .select(
                "id,appointment_date,slot_number,status,departments(name,color),doctors(name)"
              )
              .eq("client_id", clientId)
              .order("appointment_date", { ascending: false })
              .order("slot_number", { ascending: false })
              .limit(5);

            if (recentRes.error) throw new Error(recentRes.error.message);

            return (recentRes.data || []).map((row: any) => ({
              id: row.id,
              date: (row.appointment_date || "").toString().split("T")[0],
              slotNumber: row.slot_number,
              status: row.status,
              doctorName: row.doctors?.name ?? null,
              departmentName: row.departments?.name ?? "",
              departmentColor: row.departments?.color ?? null,
            }));
          },
          "recentActivity"
        );

        return {
          upcomingAppointments: parseInt(dashboardData.upcoming_count || "0"),
          totalAppointments: parseInt(dashboardData.total_month_count || "0"),
          completedAppointments: parseInt(dashboardData.completed_count || "0"),
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
