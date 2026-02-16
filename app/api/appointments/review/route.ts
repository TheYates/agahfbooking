import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session-service";
import { invalidateAppointmentsListCache } from "@/lib/appointments-cache";
import {
  sendReviewConfirmedNotification,
  sendRescheduleRequestNotification,
  fetchAppointmentForNotification,
} from "@/lib/notification-service";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return null;
  }

  const session = await getSession(sessionId);
  return session;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const session = await getAuthenticatedUser();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!["admin", "reviewer"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Reviewer or admin access required." },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();

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

    if (departmentId) {
      query = query.eq("department_id", parseInt(departmentId, 10));
    }
    if (startDate) {
      query = query.gte("appointment_date", startDate);
    }
    if (endDate) {
      query = query.lte("appointment_date", endDate);
    }

    const { data: appointments, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

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

    const session = await getAuthenticatedUser();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!["admin", "reviewer"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Reviewer or admin access required." },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();

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

    if (appointment.status !== "pending_review") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot confirm appointment with status: ${appointment.status}`,
        },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "booked",
        reviewer_notes: notes || null,
        reviewed_by: session.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    await invalidateAppointmentsListCache();

    try {
      const appointmentForNotification = await fetchAppointmentForNotification(appointmentId);
      if (appointmentForNotification) {
        await sendReviewConfirmedNotification(appointmentForNotification);
      }
    } catch (notificationError) {
      console.error("Failed to send confirmation notification:", notificationError);
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

    const session = await getAuthenticatedUser();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!["admin", "reviewer"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Reviewer or admin access required." },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();

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

    if (appointment.status !== "pending_review") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot request reschedule for appointment with status: ${appointment.status}`,
        },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "reschedule_requested",
        reschedule_reason: reason.trim(),
        reviewed_by: session.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    try {
      const appointmentForNotification = await fetchAppointmentForNotification(appointmentId);
      if (appointmentForNotification) {
        await sendRescheduleRequestNotification(appointmentForNotification, reason.trim());
      }
    } catch (notificationError) {
      console.error("Failed to send reschedule request notification:", notificationError);
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
