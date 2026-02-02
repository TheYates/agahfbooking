// 🚀 Appointments API - Supabase Backend

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  invalidateAvailableSlotsCache,
  invalidateAppointmentsListCache,
} from "@/lib/appointments-cache";

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
        `
        id,
        client_id,
        department_id,
        doctor_id,
        appointment_date,
        slot_number,
        status,
        notes,
        created_at,
        updated_at,
        clients(id, x_number, name, phone, category),
        departments(id, name, color),
        doctors(id, name)
        `,
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

    // Transform the data to include related fields at the top level
    const transformedAppointments = (appointments || []).map((apt: any) => ({
      id: apt.id,
      client_id: apt.client_id,
      client_name: apt.clients?.name || 'Unknown',
      client_x_number: apt.clients?.x_number || '',
      client_phone: apt.clients?.phone || '',
      client_category: apt.clients?.category || '',
      department_id: apt.department_id,
      department_name: apt.departments?.name || 'Unknown',
      department_color: apt.departments?.color || '#6B7280',
      doctor_id: apt.doctor_id,
      doctor_name: apt.doctors?.name || null,
      appointment_date: apt.appointment_date,
      slot_number: apt.slot_number,
      status: apt.status,
      notes: apt.notes,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
    }));

    const responseTime = Date.now() - requestStart;

    return NextResponse.json({
      success: true,
      data: transformedAppointments,
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
    const { client_id, department_id, appointment_date, slot_number, notes, booked_by } =
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

    // Determine who is booking the appointment
    // booked_by must reference users table (staff), not clients table
    let bookedById = booked_by;
    
    // If booked_by is provided, validate it exists in users table
    if (bookedById) {
      const { data: userExists } = await supabase
        .from("users")
        .select("id")
        .eq("id", bookedById)
        .single();
      
      // If the provided ID doesn't exist in users table, use default admin
      if (!userExists) {
        bookedById = null;
      }
    }
    
    // If no valid booked_by, use default admin user
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
      .eq("department_id", department_id)
      .eq("appointment_date", appointment_date)
      .eq("slot_number", slot_number)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existingErr) throw new Error(existingErr.message);

    if (existing) {
      return NextResponse.json(
        { 
          success: false, 
          error: "This time slot is no longer available" 
        },
        { status: 409 }
      );
    }

    const { data: created, error } = await supabase
      .from("appointments")
      .insert({
        client_id,
        department_id,
        appointment_date,
        slot_number,
        status: "booked",
        notes: notes || null,
        booked_by: bookedById,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    // Invalidate caches relevant to booking
    await invalidateAvailableSlotsCache(Number(department_id), appointment_date);
    await invalidateAppointmentsListCache();

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
