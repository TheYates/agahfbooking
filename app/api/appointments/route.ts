// 🚀 Appointments API - Supabase Backend

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const departmentIdRaw = searchParams.get("departmentId");
    const date = searchParams.get("date");

    const supabase = await createServerSupabaseClient();

    // Default: today
    const today = new Date().toISOString().split("T")[0];
    const start = date || startDate || today;
    const end = date || endDate || today;

    let query = supabase
      .from("appointments")
      .select(
        "id,client_id,department_id,appointment_date,slot_number,status,notes,created_at,updated_at",
        { count: "exact" }
      )
      .gte("appointment_date", start)
      .lte("appointment_date", end)
      .order("appointment_date", { ascending: true })
      .order("slot_number", { ascending: true });

    if (departmentIdRaw) {
      const departmentId = parseInt(departmentIdRaw, 10);
      if (!Number.isNaN(departmentId)) query = query.eq("department_id", departmentId);
    }

    const { data: appointments, error } = await query;
    if (error) throw new Error(error.message);

    const responseTime = Date.now() - requestStart;

    return NextResponse.json({
      success: true,
      data: appointments || [],
      meta: { responseTime: `${responseTime}ms` },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Appointments fetch error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to fetch appointments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const requestStart = Date.now();

  try {
    const body = await request.json();
    const { client_id, department_id, appointment_date, slot_number, notes } =
      body || {};

    if (!client_id || !department_id || !appointment_date || !slot_number) {
      return NextResponse.json(
        {
          error:
            "client_id, department_id, appointment_date and slot_number are required",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: created, error } = await supabase
      .from("appointments")
      .insert({
        client_id,
        department_id,
        appointment_date,
        slot_number,
        status: "booked",
        notes: notes || null,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const responseTime = Date.now() - requestStart;

    return NextResponse.json({
      success: true,
      data: created,
      meta: { responseTime: `${responseTime}ms` },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Appointment creation error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to create appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const requestStart = Date.now();

  try {
    const body = await request.json();
    const { id, ...patch } = body || {};

    if (!id) {
      return NextResponse.json({ error: "Appointment id is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: updated, error } = await supabase
      .from("appointments")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const responseTime = Date.now() - requestStart;

    return NextResponse.json({
      success: true,
      data: updated,
      meta: { responseTime: `${responseTime}ms` },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Appointment update error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to update appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const idRaw = searchParams.get("id");

    if (!idRaw) {
      return NextResponse.json({ error: "Appointment id is required" }, { status: 400 });
    }

    const id = parseInt(idRaw, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw new Error(error.message);

    const responseTime = Date.now() - requestStart;

    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
      meta: { responseTime: `${responseTime}ms` },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Appointment deletion error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to delete appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
