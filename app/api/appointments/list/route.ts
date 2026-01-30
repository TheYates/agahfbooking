// 🚀 Appointments List API (Supabase) with Memory Caching
// Keeps response shape compatible with existing UI hooks.

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
const { MemoryCache } = require("@/lib/memory-cache.js");

function statusColorsMap() {
  return {
    scheduled: "#3B82F6",
    booked: "#3B82F6",
    confirmed: "#8B5CF6",
    arrived: "#10B981",
    waiting: "#F59E0B",
    completed: "#059669",
    no_show: "#EF4444",
    cancelled: "#6B7280",
  } as Record<string, string>;
}

function dateOnly(value: any): string {
  if (!value) return "";
  return value.toString().split("T")[0];
}

export async function GET(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const dateFilter = searchParams.get("dateFilter") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    const cacheKey = `appointments_list_${search || "all"}_${status || "all"}_${
      dateFilter || "all"
    }_${page}_${limit}`;

    const appointmentsData = await MemoryCache.get(
      cacheKey,
      async () => {
        const supabase = createServerSupabaseClient();

        // Derived date filtering.
        const today = new Date().toISOString().split("T")[0];

        let query = supabase
          .from("appointments")
          .select(
            "id,client_id,department_id,appointment_date,slot_number,status,notes,created_at,clients(name,x_number,phone,category),departments(name)",
            { count: "exact" }
          )
          .order("appointment_date", { ascending: false })
          .order("slot_number", { ascending: true });

        if (status && status !== "all") {
          query = query.eq("status", status);
        }

        if (dateFilter && dateFilter !== "all") {
          switch (dateFilter) {
            case "today":
              query = query.gte("appointment_date", today).lte("appointment_date", today);
              break;
            case "upcoming":
              query = query.gte("appointment_date", today);
              break;
            case "past":
              query = query.lt("appointment_date", today);
              break;
          }
        }

        if (search) {
          const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
          // Search in related tables via embedded filters. PostgREST supports filtering referenced tables.
          // We use OR across client name/x_number and department name.
          query = query.or(
            `clients.name.ilike.%${escaped}%,clients.x_number.ilike.%${escaped}%,departments.name.ilike.%${escaped}%`
          );
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw new Error(error.message);

        const statusColors = await MemoryCache.get(
          "appointment_status_colors",
          async () => statusColorsMap(),
          "departments"
        );

        const appointments = (data || []).map((row: any) => ({
          id: row.id,
          clientId: row.client_id,
          clientName: row.clients?.name || "Unknown Client",
          clientXNumber: row.clients?.x_number || "",
          doctorId: row.department_id,
          doctorName: row.departments?.name || "Unknown Department",
          departmentId: row.department_id,
          departmentName: row.departments?.name || "Unknown Department",
          date: dateOnly(row.appointment_date),
          slotNumber: row.slot_number,
          status: row.status,
          statusColor: statusColors[row.status] || "#6B7280",
          notes: row.notes,
          phone: row.clients?.phone || "",
          category: row.clients?.category || "",
        }));

        const totalCount = count || 0;
        const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

        return {
          appointments,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
          },
        };
      },
      search || (status && status !== "all") || (dateFilter && dateFilter !== "all")
        ? "appointments"
        : "recentActivity"
    );

    const responseTime = Date.now() - requestStart;

    // NOTE: hooks expect pagination.hasMore. Keep it.
    const totalPages = appointmentsData.pagination.totalPages;
    const totalCount = appointmentsData.pagination.totalCount;

    return NextResponse.json(
      {
        success: true,
        data: appointmentsData.appointments,
        pagination: {
          currentPage: appointmentsData.pagination.currentPage,
          totalPages,
          totalCount,
          hasMore: totalPages > 0 ? page < totalPages : false,
          limit: appointmentsData.pagination.limit,
        },
        meta: {
          responseTime: `${responseTime}ms`,
          cached: responseTime < 20,
          cacheType: "memory",
          filters: { search, status, dateFilter, page, limit },
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
    console.error(`❌ Appointments List API error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch appointments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function invalidateAppointmentsListCache() {
  await MemoryCache.invalidate("appointments_list_");
  await MemoryCache.invalidate("appointment_status_colors");
}
