import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { invalidateAppointmentsListCache } from "@/lib/appointments-cache";
import {
  sendReviewConfirmedNotification,
  sendRescheduleRequestNotification,
  fetchAppointmentForNotification,
} from "@/lib/notification-service";

// GET: Fetch appointments pending review
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Check authentication
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

    // Only allow admin and reviewer roles
    if (!["admin", "reviewer"].includes(sessionData.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Reviewer or admin access required." },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Build query
    let query = supabase
      .from("appointments")
      .select(`
        *,
        clients (id, name, phone, x_number, category),
        departments (id, name, color, working_hours, slot_duration_minutes)
      `)
      .eq("status", "pending_review")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (departmentId) {
      query = query.eq("department_id", parseInt(departmentId, 10));
    }
    if (startDate) {
      query = query.gte("appointment_date", startDate);
    }
    if (endDate) {
      query = query.lte("appointment_date", endDate);
    }

    const { data: appointments, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review");

    return NextResponse.json({
      success: true,
      data: appointments || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pending reviews",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST: Confirm/approve an appointment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, notes } = body || {};

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    // Check authentication
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

    // Only allow admin and reviewer roles
    if (!["admin", "reviewer"].includes(sessionData.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Reviewer or admin access required." },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Fetch the appointment
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if appointment is in pending_review status
    if (appointment.status !== "pending_review") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot confirm appointment with status: ${appointment.status}`,
        },
        { status: 400 }
      );
    }

    // Update appointment to booked
    const { data: updated, error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "booked",
        reviewer_notes: notes || null,
        reviewed_by: sessionData.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Invalidate caches
    await invalidateAppointmentsListCache();

    // Send confirmation notification to client
    try {
      const appointmentForNotification = await fetchAppointmentForNotification(appointmentId);
      if (appointmentForNotification) {
        await sendReviewConfirmedNotification(appointmentForNotification);
      }
    } catch (notificationError) {
      console.error("Failed to send confirmation notification:", notificationError);
      // Don't fail the confirmation if notification fails
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Appointment confirmed successfully",
    });
  } catch (error) {
    console.error("Error confirming appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to confirm appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT: Request client to reschedule
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, reason } = body || {};

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Reason is required when requesting reschedule" },
        { status: 400 }
      );
    }

    // Check authentication
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

    // Only allow admin and reviewer roles
    if (!["admin", "reviewer"].includes(sessionData.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Reviewer or admin access required." },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Fetch the appointment with client info
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        clients (id, name, phone, x_number)
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if appointment is in pending_review status
    if (appointment.status !== "pending_review") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot request reschedule for appointment with status: ${appointment.status}`,
        },
        { status: 400 }
      );
    }

    // Update appointment status to reschedule_requested
    // This removes it from the pending review queue and signals to client to pick a new time
    const { data: updated, error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "reschedule_requested",
        reschedule_reason: reason.trim(),
        reviewed_by: sessionData.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Send reschedule request notification to client
    try {
      const appointmentForNotification = await fetchAppointmentForNotification(appointmentId);
      if (appointmentForNotification) {
        await sendRescheduleRequestNotification(appointmentForNotification, reason.trim());
      }
    } catch (notificationError) {
      console.error("Failed to send reschedule request notification:", notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Reschedule request sent to client",
      client: {
        name: appointment.clients?.name,
        phone: appointment.clients?.phone,
      },
    });
  } catch (error) {
    console.error("Error requesting reschedule:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to request reschedule",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
