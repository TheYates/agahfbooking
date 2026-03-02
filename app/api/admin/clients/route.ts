import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withAuth } from "@/lib/api-auth";

/**
 * GET /api/admin/clients
 * List all clients with their Supabase Auth status
 */
export async function GET(request: NextRequest) {
  return withAuth(
    async (req, session) => {
      try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const authStatus = searchParams.get("authStatus") || "all"; // 'all', 'with-auth', 'without-auth'

        const supabase = createAdminSupabaseClient();

        // Build query
        let query = supabase
          .from("clients")
          .select("*", { count: "exact" });

        // Apply search filter
        if (search) {
          query = query.or(
            `name.ilike.%${search}%,x_number.ilike.%${search}%,phone.ilike.%${search}%`
          );
        }

        // Apply auth status filter
        if (authStatus === "with-auth") {
          query = query.not("auth_user_id", "is", null);
        } else if (authStatus === "without-auth") {
          query = query.is("auth_user_id", null);
        }

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to).order("name");

        const { data: clients, error, count } = await query;

        if (error) {
          console.error("Error fetching clients:", error);
          return NextResponse.json(
            { error: "Failed to fetch clients" },
            { status: 500 }
          );
        }

        // Transform data
        const transformedClients = clients?.map((client) => ({
          id: client.id,
          xNumber: client.x_number,
          name: client.name,
          phone: client.phone,
          category: client.category,
          status: client.is_active ? "active" : "inactive",
          hasSupabaseAuth: !!client.auth_user_id,
          authUserId: client.auth_user_id,
          joinDate: client.created_at,
        }));

        // Get stats
        const { data: allClients } = await supabase
          .from("clients")
          .select("auth_user_id, is_active");

        const stats = {
          total: allClients?.length || 0,
          withAuth: allClients?.filter((c) => c.auth_user_id).length || 0,
          withoutAuth: allClients?.filter((c) => !c.auth_user_id).length || 0,
          active: allClients?.filter((c) => c.is_active).length || 0,
        };

        return NextResponse.json({
          success: true,
          data: transformedClients,
          stats,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil((count || 0) / limit),
            totalCount: count,
            limit,
          },
        });
      } catch (error) {
        console.error("Error in admin clients list:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    },
    { requireStaff: true }
  )(request);
}
