import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { invalidateAppointmentsListCache } from "@/lib/appointments-cache";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idRaw } = await params;
    const id = parseInt(idRaw, 10);

    if (Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = body?.status;

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: updated, error } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id,status")
      .single();

    if (error) {
      // If not found, return 404
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Invalidate appointment list caches so status changes reflect immediately.
    await invalidateAppointmentsListCache();

    return NextResponse.json({
      success: true,
      message: "Appointment status updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update appointment status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
