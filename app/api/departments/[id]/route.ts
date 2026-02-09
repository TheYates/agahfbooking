import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
const { MemoryCache } = require("@/lib/memory-cache.js");

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: department, error } = await supabase
      .from("departments")
      .select(
        "id,name,description,slots_per_day,working_days,working_hours,color,is_active,slot_duration_minutes,require_review,auto_confirm_staff_bookings"
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: department });
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch department",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const body = await request.json();

    const supabase = await createServerSupabaseClient();

    // Allow partial updates (e.g. toggling `is_active`) but validate if `name` is provided.
    if (body.name !== undefined && !body.name) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const updatePayload: any = {};
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.working_days !== undefined) updatePayload.working_days = body.working_days;
    if (body.working_hours !== undefined) updatePayload.working_hours = body.working_hours;
    if (body.color !== undefined) updatePayload.color = body.color;
    if (body.is_active !== undefined) updatePayload.is_active = body.is_active;
    if (body.slot_duration_minutes !== undefined) updatePayload.slot_duration_minutes = body.slot_duration_minutes;
    if (body.require_review !== undefined) updatePayload.require_review = body.require_review;
    if (body.auto_confirm_staff_bookings !== undefined) updatePayload.auto_confirm_staff_bookings = body.auto_confirm_staff_bookings;

    // Auto-calculate slots_per_day if working_hours or slot_duration_minutes changed
    if (body.working_hours !== undefined || body.slot_duration_minutes !== undefined) {
      // Fetch current department to get missing values
      const { data: currentDept } = await supabase
        .from("departments")
        .select("working_hours,slot_duration_minutes")
        .eq("id", id)
        .single();

      const workingHours = body.working_hours ?? currentDept?.working_hours ?? { start: "09:00", end: "17:00" };
      const slotDuration = body.slot_duration_minutes ?? currentDept?.slot_duration_minutes ?? 30;

      const startParts = workingHours.start.split(":");
      const endParts = workingHours.end.split(":");
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || "0");
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || "0");
      const totalMinutes = endMinutes - startMinutes;
      const calculatedSlots = Math.floor(totalMinutes / slotDuration);

      updatePayload.slots_per_day = calculatedSlots;
    }

    const { data: department, error } = await supabase
      .from("departments")
      .update(updatePayload)
      .eq("id", id)
      .select(
        "id,name,description,slots_per_day,working_days,working_hours,color,is_active,slot_duration_minutes,require_review,auto_confirm_staff_bookings"
      )
      .single();

    if (error) throw new Error(error.message);

    await MemoryCache.invalidate("departments_");

    return NextResponse.json({ success: true, data: department });
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      {
        error: "Failed to update department",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await MemoryCache.invalidate("departments_");

    return NextResponse.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      {
        error: "Failed to delete department",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
