import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("clients")
      .select("id,x_number,name,phone,category,is_active,created_at")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (search) {
      const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(
        `name.ilike.%${escaped}%,x_number.ilike.%${escaped}%,phone.ilike.%${escaped}%`
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch clients",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { xNumber, name, phone, email, category, emergencyContact, address } =
      body;

    if (!xNumber || !name || !phone || !email || !category) {
      return NextResponse.json(
        { error: "xNumber, name, phone, email, and category are required" },
        { status: 400 }
      );
    }

    // Validate X-number format
    const xNumberPattern = /^X\d{5}\/\d{2}$/;
    if (!xNumberPattern.test(xNumber)) {
      return NextResponse.json(
        { error: "X-Number must follow the format X12345/67" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        x_number: xNumber,
        name,
        phone,
        email,
        category,
        emergency_contact: emergencyContact || null,
        address: address || null,
        is_active: true,
      })
      .select("id,x_number,name,phone,email,category,is_active,created_at")
      .single();

    if (error) {
      // Unique constraint violations (duplicate X-number)
      if ((error as any).code === "23505") {
        return NextResponse.json(
          { error: "A client with this X-Number already exists" },
          { status: 409 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error("Error creating client:", error);

    return NextResponse.json(
      {
        error: "Failed to create client",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
