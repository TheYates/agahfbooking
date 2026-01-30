import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { invalidateAvailableSlotsCache } from "@/app/api/appointments/available-slots/route";
import { invalidateAppointmentsListCache } from "@/app/api/appointments/list/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { departmentId, clientId, date, slotNumber } = body || {};

    if (!departmentId || !date || !slotNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Department ID, date, and slot number are required",
        },
        { status: 400 }
      );
    }

    let finalClientId = clientId;

    // If no clientId provided, get from session (for client self-booking)
    if (!finalClientId) {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("session_token");

      if (!sessionToken) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required or client ID must be provided",
          },
          { status: 401 }
        );
      }

      try {
        const sessionData = JSON.parse(sessionToken.value);
        finalClientId = sessionData.id;
      } catch {
        return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
      }
    }

    const supabase = createServerSupabaseClient();

    // Check if slot is still available
    const { data: existing, error: existingErr } = await supabase
      .from("appointments")
      .select("id")
      .eq("department_id", departmentId)
      .eq("appointment_date", date)
      .eq("slot_number", slotNumber)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existingErr) throw new Error(existingErr.message);

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    const { data: created, error: createErr } = await supabase
      .from("appointments")
      .insert({
        client_id: finalClientId,
        department_id: departmentId,
        appointment_date: date,
        slot_number: slotNumber,
        status: "booked",
      })
      .select("*")
      .single();

    if (createErr) throw new Error(createErr.message);

    // Invalidate caches relevant to booking
    await invalidateAvailableSlotsCache(Number(departmentId), date);
    await invalidateAppointmentsListCache();

    return NextResponse.json({
      success: true,
      data: created,
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to book appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
