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
        const supabase = await createServerSupabaseClient();

        // Derived date filtering.
        const today = new Date().toISOString().split("T")[0];

        let data, count;

        // If search is provided, use RPC function for better performance
        if (search) {
          // Determine date range based on dateFilter
          let dateFrom = null;
          let dateTo = null;
          
          if (dateFilter && dateFilter !== "all") {
            switch (dateFilter) {
              case "today":
                dateFrom = today;
                dateTo = today;
                break;
              case "upcoming":
                dateFrom = today;
                dateTo = null;
                break;
              case "past":
                dateFrom = null;
                dateTo = new Date(new Date(today).getTime() - 86400000).toISOString().split("T")[0];
                break;
            }
          }

          const { data: rpcData, error } = await supabase.rpc('search_appointments', {
            search_term: search,
            filter_status: status && status !== "all" ? status : null,
            filter_date_from: dateFrom,
            filter_date_to: dateTo,
            result_limit: limit,
            result_offset: offset,
          });

          if (error) throw new Error(error.message);

          // RPC returns results with total_count in each row
          data = rpcData || [];
          count = data.length > 0 ? data[0].total_count : 0;
        } else {
          // No search - use regular query
          let query = supabase
            .from("appointments")
            .select(
              "id,client_id,department_id,appointment_date,slot_number,slot_start_time,slot_end_time,status,notes,created_at,clients(name,x_number,phone,category),departments(name)",
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

          query = query.range(offset, offset + limit - 1);

          const result = await query;
          if (result.error) throw new Error(result.error.message);
          
          data = result.data;
          count = result.count;
        }

        const statusColors = await MemoryCache.get(
          "appointment_status_colors",
          async () => statusColorsMap(),
          "departments"
        );

        const appointments = (data || []).map((row: any) => {
          // Handle both RPC response (flat structure) and regular query (nested structure)
          const isRpcResponse = 'client_name' in row;
          
          return {
            id: row.id,
            clientId: row.client_id,
            clientName: isRpcResponse ? row.client_name : (row.clients?.name || "Unknown Client"),
            clientXNumber: isRpcResponse ? row.client_x_number : (row.clients?.x_number || ""),
            doctorId: row.department_id,
            doctorName: isRpcResponse ? row.department_name : (row.departments?.name || "Unknown Department"),
            departmentId: row.department_id,
            departmentName: isRpcResponse ? row.department_name : (row.departments?.name || "Unknown Department"),
            date: dateOnly(row.appointment_date),
            slotNumber: row.slot_number,
            slotStartTime: row.slot_start_time,
            slotEndTime: row.slot_end_time,
            status: row.status,
            statusColor: statusColors[row.status] || "#6B7280",
            notes: row.notes,
            phone: isRpcResponse ? row.client_phone : (row.clients?.phone || ""),
            category: isRpcResponse ? row.client_category : (row.clients?.category || ""),
          };
        });

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

// Note: Next.js Route Handlers must not export arbitrary helpers.
// Cache invalidation helpers live in `lib/appointments-cache.ts`.
