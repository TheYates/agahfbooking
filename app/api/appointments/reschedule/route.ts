import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  invalidateAvailableSlotsCache,
  invalidateAppointmentsListCache,
} from "@/lib/appointments-cache";
import { calculateSlotTimes } from "@/lib/slot-time-utils";
import {
  sendRescheduleCompletedNotification,
  fetchAppointmentForNotification,
} from "@/lib/notification-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, newDate, newSlotNumber, reason } = body || {};

    // Validate required fields
    if (!appointmentId || !newDate || !newSlotNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Appointment ID, new date, and new slot number are required",
        },
        { status: 400 }
      );
    }

    // Get session for authorization
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    let sessionData: { id: number; role: string };
    try {
      sessionData = JSON.parse(sessionToken.value);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Fetch the original appointment with client and department info
    const { data: originalAppointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        departments (
          id,
          working_hours,
          slot_duration_minutes,
          require_review,
          auto_confirm_staff_bookings
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchError || !originalAppointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const isStaff = ["admin", "receptionist", "reviewer"].includes(sessionData.role);
    const isOwnAppointment = sessionData.role === "client" && originalAppointment.client_id === sessionData.id;

    if (!isStaff && !isOwnAppointment) {
      return NextResponse.json(
        { success: false, error: "You can only reschedule your own appointments" },
        { status: 403 }
      );
    }

    // Check if appointment can be rescheduled (not already cancelled, rescheduled, completed, or no_show)
    const nonReschedulableStatuses = ["cancelled", "rescheduled", "completed", "no_show"];
    if (nonReschedulableStatuses.includes(originalAppointment.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot reschedule an appointment with status: ${originalAppointment.status}`,
        },
        { status: 400 }
      );
    }

    // Check if the new slot is available
    const { data: existingSlot, error: slotCheckError } = await supabase
      .from("appointments")
      .select("id")
      .eq("department_id", originalAppointment.department_id)
      .eq("appointment_date", newDate)
      .eq("slot_number", newSlotNumber)
      .neq("status", "cancelled")
      .neq("status", "rescheduled")
      .maybeSingle();

    if (slotCheckError) {
      throw new Error(slotCheckError.message);
    }

    if (existingSlot) {
      return NextResponse.json(
        { success: false, error: "The selected time slot is not available" },
        { status: 409 }
      );
    }

    // Calculate slot times for the new appointment
    const department = originalAppointment.departments;
    const workingHours = department.working_hours as { start: string; end: string };
    const slotDuration = department.slot_duration_minutes || 30;
    const slotTimes = calculateSlotTimes(workingHours, newSlotNumber, slotDuration);

    // Determine status for new appointment
    let newStatus: "booked" | "pending_review" = "pending_review";
    if (!department.require_review) {
      newStatus = "booked";
    } else if (isStaff && department.auto_confirm_staff_bookings) {
      newStatus = "booked";
    }

    // Get bookedById (for staff, use their ID; for clients, use admin)
    let bookedById: number;
    if (isStaff) {
      bookedById = sessionData.id;
    } else {
      const { data: adminUser } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .single();
      bookedById = adminUser?.id || 1;
    }

    // Create the new appointment
    const { data: newAppointment, error: createError } = await supabase
      .from("appointments")
      .insert({
        client_id: originalAppointment.client_id,
        department_id: originalAppointment.department_id,
        doctor_id: originalAppointment.doctor_id,
        appointment_date: newDate,
        slot_number: newSlotNumber,
        slot_start_time: slotTimes.startTime,
        slot_end_time: slotTimes.endTime,
        status: newStatus,
        notes: originalAppointment.notes,
        booked_by: bookedById,
        rescheduled_from_id: originalAppointment.id,
      })
      .select("*")
      .single();

    if (createError) {
      throw new Error(createError.message);
    }

    // Update the original appointment
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "rescheduled",
        rescheduled_to_id: newAppointment.id,
        reschedule_reason: reason || null,
        rescheduled_by: isStaff ? sessionData.id : null,
        rescheduled_at: new Date().toISOString(),
      })
      .eq("id", originalAppointment.id);

    if (updateError) {
      // Rollback: delete the new appointment
      await supabase.from("appointments").delete().eq("id", newAppointment.id);
      throw new Error(updateError.message);
    }

    // Invalidate caches
    await invalidateAvailableSlotsCache(
      originalAppointment.department_id,
      originalAppointment.appointment_date
    );
    await invalidateAvailableSlotsCache(
      originalAppointment.department_id,
      newDate
    );
    await invalidateAppointmentsListCache();

    // Send reschedule notification
    try {
      const oldApptForNotification = await fetchAppointmentForNotification(originalAppointment.id);
      const newApptForNotification = await fetchAppointmentForNotification(newAppointment.id);
      if (oldApptForNotification && newApptForNotification) {
        await sendRescheduleCompletedNotification(oldApptForNotification, newApptForNotification);
      }
    } catch (notificationError) {
      console.error("Failed to send reschedule notification:", notificationError);
      // Don't fail the reschedule if notification fails
    }

    return NextResponse.json({
      success: true,
      data: {
        originalAppointment: {
          id: originalAppointment.id,
          status: "rescheduled",
        },
        newAppointment: {
          id: newAppointment.id,
          date: newDate,
          slotNumber: newSlotNumber,
          slotStartTime: slotTimes.startTime,
          slotEndTime: slotTimes.endTime,
          status: newStatus,
        },
      },
      message: "Appointment rescheduled successfully",
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reschedule appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
