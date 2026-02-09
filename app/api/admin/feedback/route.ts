import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limitParam = searchParams.get("limit");

    const limit = Math.min(Number(limitParam) || 100, 200);

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("app_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (type && type !== "all") {
      query = query.eq("feedback_type", type);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ feedback: data || [] });
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdminAuth();

    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Feedback ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.admin_notes = adminNotes;

    if (status === "resolved" || status === "closed") {
      updateData.resolved_by = user.id;
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("app_feedback")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Feedback update error:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}
