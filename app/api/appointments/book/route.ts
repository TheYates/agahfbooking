import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  invalidateAvailableSlotsCache,
  invalidateAppointmentsListCache,
} from "@/lib/appointments-cache";
import { calculateSlotTimes } from "@/lib/slot-time-utils";
import {
  sendBookingConfirmation,
  fetchAppointmentForNotification,
} from "@/lib/notification-service";

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
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");
    
    if (!finalClientId) {
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

    const supabase = await createServerSupabaseClient();

    // Determine who is booking the appointment
    // booked_by must reference users table (staff), not clients table
    let bookedById;
    
    if (sessionToken) {
      try {
        const sessionData = JSON.parse(sessionToken.value);
        // If it's a staff member (admin/receptionist), use their ID
        if (sessionData.role === "admin" || sessionData.role === "receptionist") {
          bookedById = sessionData.id;
        }
      } catch {
        // Session parsing failed, will use default admin below
      }
    }
    
    // If bookedById is not set (client booking or no valid staff session), use default admin
    if (!bookedById) {
      const { data: adminUser } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .single();
      bookedById = adminUser?.id || 1; // Fallback to ID 1 if no admin found
    }

    // Check if slot is still available
    const { data: existing, error: existingErr } = await supabase
      .from("appointments")
      .select("id")
      .eq("department_id", departmentId)
      .eq("appointment_date", date)
      .eq("slot_number", slotNumber)
      .neq("status", "cancelled")
      .neq("status", "rescheduled")
      .maybeSingle();

    if (existingErr) throw new Error(existingErr.message);

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Fetch department for slot time calculation and review settings
    const { data: department, error: deptErr } = await supabase
      .from("departments")
      .select("working_hours, slot_duration_minutes, require_review, auto_confirm_staff_bookings")
      .eq("id", departmentId)
      .single();

    if (deptErr || !department) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    // Calculate slot times
    const workingHours = department.working_hours as { start: string; end: string } | null;
    const slotDuration = department.slot_duration_minutes || 30;

    // Only calculate slot times if working_hours is available
    let slotStartTime: string | null = null;
    let slotEndTime: string | null = null;

    if (workingHours && workingHours.start) {
      const slotTimes = calculateSlotTimes(workingHours, slotNumber, slotDuration);
      slotStartTime = slotTimes.startTime;
      slotEndTime = slotTimes.endTime;
    }

    // Determine initial status based on review settings
    const isStaffBooking = sessionToken ? (() => {
      try {
        const sessionData = JSON.parse(sessionToken.value);
        return ["admin", "receptionist", "reviewer"].includes(sessionData.role);
      } catch {
        return false;
      }
    })() : false;

    let initialStatus: "booked" | "pending_review" = "pending_review";

    // Staff bookings are always auto-confirmed (they're acting as confirmation)
    // Client bookings follow the department's require_review setting
    if (isStaffBooking) {
      initialStatus = "booked";
    } else if (!department.require_review) {
      // No review required, auto-confirm for clients too
      initialStatus = "booked";
    }

    const { data: created, error: createErr } = await supabase
      .from("appointments")
      .insert({
        client_id: finalClientId,
        department_id: departmentId,
        appointment_date: date,
        slot_number: slotNumber,
        slot_start_time: slotStartTime,
        slot_end_time: slotEndTime,
        status: initialStatus,
        booked_by: bookedById,
      })
      .select("*")
      .single();

    if (createErr) throw new Error(createErr.message);

    // Invalidate caches relevant to booking
    await invalidateAvailableSlotsCache(Number(departmentId), date);
    await invalidateAppointmentsListCache();

    // Send notification if appointment was auto-confirmed (status is "booked")
    if (initialStatus === "booked") {
      try {
        const appointmentForNotification = await fetchAppointmentForNotification(created.id);
        if (appointmentForNotification) {
          await sendBookingConfirmation(appointmentForNotification);
        }
      } catch (notificationError) {
        console.error("Failed to send booking notification:", notificationError);
        // Don't fail the booking if notification fails
      }
    }

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
