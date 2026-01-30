// 🚀 Doctor [id] API - Supabase Backend

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestStart = Date.now();

  try {
    const body = await request.json();
    const { id: idRaw } = await params;
    const id = parseInt(idRaw, 10);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid doctor ID" }, { status: 400 });
    }

    const { name, department_id } = body || {};

    if (!name || !department_id) {
      return NextResponse.json(
        { error: "Doctor name and department_id are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: doctor, error } = await supabase
      .from("doctors")
      .update({ name, department_id })
      .eq("id", id)
      .select("id,name,department_id")
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
    console.error(`❌ Doctor update error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to update doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestStart = Date.now();

  try {
    const { id: idRaw } = await params;
    const id = parseInt(idRaw, 10);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid doctor ID" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) throw new Error(error.message);

    const responseTime = Date.now() - requestStart;

    return NextResponse.json({
      success: true,
      message: "Doctor deleted successfully",
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Doctor deletion error (${responseTime}ms):`, error);

    return NextResponse.json(
      {
        error: "Failed to delete doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
