import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const userType = searchParams.get("userType");

    const limit = Math.min(Number(limitParam) || 50, 200);

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("login_audit")
      .select("id,user_type,user_id,identifier,ip_address,user_agent,success,error_message,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status === "success") {
      query = query.eq("success", true);
    }

    if (status === "failed") {
      query = query.eq("success", false);
    }

    if (userType) {
      query = query.eq("user_type", userType);
    }

    if (search) {
      query = query.or(
        `identifier.ilike.%${search}%,ip_address.ilike.%${search}%,error_message.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ entries: data || [] });
  } catch (error) {
    console.error("Login audit fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch login audit entries" },
      { status: 500 }
    );
  }
}
