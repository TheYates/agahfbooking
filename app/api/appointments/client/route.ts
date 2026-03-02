import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Returns client appointments in the format consumed by the mobile client appointments UI.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientIdRaw = searchParams.get("clientId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!clientIdRaw || ["NaN", "undefined", "null", ""].includes(clientIdRaw) || clientIdRaw.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Valid Client ID is required" },
        { status: 400 }
      );
    }

    const clientId = parseInt(clientIdRaw, 10);
    if (Number.isNaN(clientId)) {
      return NextResponse.json(
        { success: false, error: "Valid Client ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("appointments")
      .select(
        "id,client_id,department_id,appointment_date,slot_number,slot_start_time,slot_end_time,status,notes,created_at,departments(name,color),clients(name,x_number)",
        { count: "exact" }
      )
      .eq("client_id", clientId)
      .order("appointment_date", { ascending: false })
      .order("slot_number", { ascending: true });

    if (startDate) query = query.gte("appointment_date", startDate);
    if (endDate) query = query.lte("appointment_date", endDate);

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

const appointments = (data || []).map((appointment: any) => ({
      id: appointment.id,
      clientId: appointment.client_id,
      clientName: appointment.clients?.name,
      clientXNumber: appointment.clients?.x_number,
      date: (appointment.appointment_date || "").toString().split("T")[0],
      slotNumber: appointment.slot_number,
      slotStartTime: appointment.slot_start_time,
      slotEndTime: appointment.slot_end_time,
      status: appointment.status,
      notes: appointment.notes,
      departmentId: appointment.department_id,
      departmentName: appointment.departments?.name,
      departmentColor: appointment.departments?.color,
      doctorName: null,
      bookedAt: appointment.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching client appointments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch appointments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
