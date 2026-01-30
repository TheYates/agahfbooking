import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { invalidateAvailableSlotsCache } from "@/app/api/appointments/available-slots/route";
import { invalidateAppointmentsListCache } from "@/app/api/appointments/list/route";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentIdRaw = searchParams.get("departmentId");
    const date = searchParams.get("date");
    const slotNumberRaw = searchParams.get("slotNumber");
    const clientIdRaw = searchParams.get("clientId");

    if (!departmentIdRaw || !date || !slotNumberRaw || !clientIdRaw) {
      return NextResponse.json(
        {
          success: false,
          error: "Department ID, date, slot number, and client ID are required",
        },
        { status: 400 }
      );
    }

    const departmentId = parseInt(departmentIdRaw, 10);
    const slotNumber = parseInt(slotNumberRaw, 10);
    const clientId = parseInt(clientIdRaw, 10);

    if ([departmentId, slotNumber, clientId].some((n) => Number.isNaN(n))) {
      return NextResponse.json(
        { success: false, error: "Invalid departmentId, slotNumber, or clientId" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Find appointment
    const { data: appointment, error: findErr } = await supabase
      .from("appointments")
      .select("id,client_id,status")
      .eq("department_id", departmentId)
      .eq("appointment_date", date)
      .eq("slot_number", slotNumber)
      .eq("client_id", clientId)
      .neq("status", "cancelled")
      .single();

    if (findErr || !appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found or already cancelled" },
        { status: 404 }
      );
    }

    if (appointment.client_id !== clientId) {
      return NextResponse.json(
        { success: false, error: "You can only cancel your own appointments" },
        { status: 403 }
      );
    }

    // Check if in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return NextResponse.json(
        { success: false, error: "Cannot cancel past appointments" },
        { status: 400 }
      );
    }

    // Cancel
    const { data: cancelled, error: cancelErr } = await supabase
      .from("appointments")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", appointment.id)
      .select("id,status")
      .single();

    if (cancelErr) throw new Error(cancelErr.message);

    await invalidateAvailableSlotsCache(departmentId, date);
    await invalidateAppointmentsListCache();

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: cancelled,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
