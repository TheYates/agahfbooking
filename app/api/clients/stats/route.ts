// 🚀 Clients Stats API (Supabase) with Memory Caching

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
const { MemoryCache } = require("@/lib/memory-cache.js");

function getSort(sortBy: string, sortOrder: string) {
  const order = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

  // Map API sort keys -> DB columns.
  // NOTE: Some keys (totalAppointments, lastAppointment, status) are derived.
  const columnMap: Record<string, string> = {
    name: "name",
    xNumber: "x_number",
    phone: "phone",
    category: "category",
    joinDate: "created_at",
  };

  return { column: columnMap[sortBy] || "name", ascending: order !== "desc" };
}

function toDateOnly(value: string | null | undefined) {
  if (!value) return null;
  return value.split("T")[0];
}

type ClientRow = {
  id: number;
  x_number: string;
  name: string;
  phone: string;
  category: string;
  emergency_contact: string | null;
  address: string | null;
  created_at: string;
  is_active: boolean;
};

type AppointmentRow = {
  client_id: number;
  appointment_date: string; // date or timestamp
};

export async function GET(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || "all";
    const status = searchParams.get("status") || "all";
    const clientIdRaw = searchParams.get("clientId") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const cacheKey = `clients_stats_${search || "all"}_${category}_${status}_${clientIdRaw || "all"}_${page}_${limit}_${sortBy}_${sortOrder}`;

    const result = await MemoryCache.get(
      cacheKey,
      async () => {
        const supabase = await createServerSupabaseClient();

        const { column, ascending } = getSort(sortBy, sortOrder);

        let query = supabase
          .from("clients")
          .select(
            "id,x_number,name,phone,category,emergency_contact,address,created_at,is_active",
            { count: "exact" }
          )
          .eq("is_active", true)
          .order(column, { ascending });

        // Filters
        if (clientIdRaw) {
          const clientId = parseInt(clientIdRaw, 10);
          if (!Number.isNaN(clientId)) query = query.eq("id", clientId);
        }

        if (search) {
          // Search across name, x_number, phone
          const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
          query = query.or(
            `name.ilike.%${escaped}%,x_number.ilike.%${escaped}%,phone.ilike.%${escaped}%`
          );
        }

        if (category && category !== "all") {
          query = query.eq("category", category);
        }

        // Pagination (Supabase uses inclusive range)
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data: clientRows, error: clientsError, count } = await query;
        if (clientsError) throw new Error(clientsError.message);

        const clients = (clientRows || []) as ClientRow[];
        const ids = clients.map((c) => c.id);

        // Fetch appointment stats only for the current page clients.
        // We only need date values.
        let appointmentRows: AppointmentRow[] = [];
        if (ids.length) {
          const { data: apts, error: apptError } = await supabase
            .from("appointments")
            .select("client_id,appointment_date")
            .in("client_id", ids);
          if (apptError) throw new Error(apptError.message);
          appointmentRows = (apts || []) as AppointmentRow[];
        }

        const apptByClient = new Map<number, { total: number; last: string | null }>();
        for (const appt of appointmentRows) {
          const curr = apptByClient.get(appt.client_id) || { total: 0, last: null };
          curr.total += 1;
          const d = toDateOnly(appt.appointment_date);
          if (d && (!curr.last || d > curr.last)) curr.last = d;
          apptByClient.set(appt.client_id, curr);
        }

        // Compute status = active if last appointment within 90 days OR no appointments
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const cutoffStr = cutoff.toISOString().split("T")[0];

        const mapped = clients
          .map((row) => {
            const stats = apptByClient.get(row.id) || { total: 0, last: null };
            const derivedStatus =
              !stats.last || stats.last >= cutoffStr ? "active" : "inactive";

            return {
              id: row.id,
              xNumber: row.x_number,
              name: row.name,
              phone: row.phone,
              category: row.category,
              joinDate: toDateOnly(row.created_at) || row.created_at,
              totalAppointments: stats.total,
              lastAppointment: stats.last,
              status: derivedStatus,
              emergencyContact: row.emergency_contact,
              address: row.address,
            };
          })
          .filter((c) => {
            if (status === "active") return c.status === "active";
            if (status === "inactive") return c.status === "inactive";
            return true;
          });

        const totalCount = count || 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / limit));

        return {
          clients: mapped,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasMore: page < totalPages,
          },
        };
      },
      // Cache strategy
      search || category !== "all" || status !== "all" ? "appointments" : "recentActivity"
    );

    const responseTime = Date.now() - requestStart;

    return NextResponse.json(
      {
        success: true,
        data: result.clients,
        pagination: result.pagination,
        meta: {
          responseTime: `${responseTime}ms`,
          cached: responseTime < 30,
          cacheType: "memory",
          filters: { search, category, status, clientId: clientIdRaw, sortBy, sortOrder },
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
    console.error(`❌ Clients Stats API error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to fetch clients",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Note: Next.js Route Handlers must not export arbitrary helpers.
// If you need cache invalidation from elsewhere, move a helper to a separate
// module (not inside `route.ts`) or invalidate within handlers.
