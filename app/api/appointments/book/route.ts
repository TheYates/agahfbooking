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
import { buildReminderSchedule } from "@/lib/reminder-utils";
import { getUserReminderPreferences, getOffsetMinutesFromPreferences } from "@/lib/reminder-preferences-service";
import { getSession } from "@/lib/session-service";

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

    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    const session = sessionId ? await getSession(sessionId) : null;
    
    if (!finalClientId) {
      if (!session) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required or client ID must be provided",
          },
          { status: 401 }
        );
      }
      
      if (session.userType === "staff") {
        return NextResponse.json(
          {
            success: false,
            error: "Please select a client for this appointment",
          },
          { status: 400 }
        );
      }
      
      finalClientId = session.userId;
    }

    const supabase = await createServerSupabaseClient();

// Determine who is booking the appointment
    // booked_by must reference users table (staff), not clients table
    let bookedById;
    
    if (session) {
      // If it's a staff member (admin/receptionist), use their ID
      if (session.role === "admin" || session.role === "receptionist") {
        bookedById = session.userId;
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
    const isStaffBooking = session ? ["admin", "receptionist", "reviewer"].includes(session.role) : false;

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

    // Return success immediately (run notifications/reminders in background)
    const response = NextResponse.json({
      success: true,
      data: created,
      message: "Appointment booked successfully",
    });

    // Send notification if appointment was auto-confirmed (status is "booked")
    console.log('🔔 Booking status:', initialStatus, 'Created appointment ID:', created.id);
    if (initialStatus === "booked") {
      console.log('📧 Sending booking confirmation notification...');
      // Run in background (don't await)
      fetchAppointmentForNotification(created.id)
        .then(appointmentForNotification => {
          console.log('📬 Fetched appointment for notification:', appointmentForNotification?.id);
          if (appointmentForNotification) {
            return sendBookingConfirmation(appointmentForNotification);
          }
        })
        .then(() => {
          console.log('✅ Booking confirmation sent successfully');
        })
        .catch(notificationError => {
          console.error("❌ Failed to send booking notification:", notificationError);
        });
    } else {
      console.log('⏭️ Skipping notification (status is not "booked")');
    }

    // Schedule push reminders based on user preferences (run in background)
    try {
      const userPreferences = await getUserReminderPreferences(finalClientId);
      
      if (!userPreferences.enabled) {
        console.log("⏭️ Reminders disabled for user", finalClientId);
      } else {
        const offsetMinutes = getOffsetMinutesFromPreferences(userPreferences);
        
        // Extract just the date part if date contains time
        const dateOnly = date.split('T')[0];
        const appointmentDateTime = `${dateOnly}T${slotStartTime || "00:00:00"}`;
        console.log("📅 Scheduling reminders for:", appointmentDateTime);
        const reminderSchedules = buildReminderSchedule(appointmentDateTime, offsetMinutes);
        console.log("⏰ Reminder schedules:", reminderSchedules);

      for (const { scheduledAt, offsetMinutes } of reminderSchedules) {
        const { data: reminderData, error: reminderError } = await supabase.from("push_reminders").insert({
          appointment_id: created.id,
          user_id: finalClientId,
          title: "Appointment Reminder",
          body: `Your appointment is in ${offsetMinutes / 60} hour${offsetMinutes === 60 ? "" : "s"}`,
          scheduled_time: scheduledAt.toISOString(),
          status: "scheduled",
        });
        
        if (reminderError) {
          console.error("❌ Reminder insert error:", reminderError);
        } else {
          console.log("✅ Reminder created:", reminderData);
        }
      }
      }
    } catch (reminderError) {
      console.error("Failed to schedule reminders:", reminderError);
      // Don't fail the booking if reminder scheduling fails
    }

    return response;
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
