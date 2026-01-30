// 🚀 Doctors API - Supabase Backend

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DoctorRow = {
  id: number;
  name: string;
  department_id: number;
  is_active?: boolean;
  departments?: {
    name?: string;
    color?: string;
  } | null;
};

export async function GET(request: Request) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const departmentIdRaw = searchParams.get("departmentId");

    const supabase = createServerSupabaseClient();

    let query = supabase
      .from("doctors")
      .select(
        "id,name,department_id,is_active,departments(name,color)"
      )
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (departmentIdRaw) {
      const departmentId = parseInt(departmentIdRaw, 10);
      if (!Number.isNaN(departmentId)) {
        query = query.eq("department_id", departmentId);
      }
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const enrichedDoctors = ((data || []) as DoctorRow[]).map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      department_id: doctor.department_id,
      department_name: doctor.departments?.name || "Unknown",
      department_color: doctor.departments?.color || "#3B82F6",
    }));

    const responseTime = Date.now() - requestStart;

    return NextResponse.json({
      success: true,
      data: enrichedDoctors,
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Doctors API error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to fetch doctors",
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
    const { name, department_id } = body || {};

    if (!name || !department_id) {
      return NextResponse.json(
        { error: "Doctor name and department_id are required" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { data: doctor, error } = await supabase
      .from("doctors")
      .insert({
        name,
        department_id,
        is_active: true,
      })
      .select("id,name,department_id,is_active")
      .single();

    if (error) throw new Error(error.message);

    const responseTime = Date.now() - requestStart;

    return NextResponse.json({
      success: true,
      data: doctor,
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Doctor creation error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to create doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
