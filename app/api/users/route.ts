import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

// GET /api/users - Get all users with optional search
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const currentUser = await requireAdminAuth();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("users")
      .select("id,name,phone,role,employee_id,is_active,created_at")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }

    const { data: users, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth();

    const userData = await request.json();
    const { name, phone, role, employee_id, password } = userData;

    // Validate required fields
    if (!name || !phone || !role || !employee_id) {
      return NextResponse.json(
        { error: "Name, phone, role, and employee ID are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["receptionist", "admin", "reviewer"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'receptionist', 'admin', or 'reviewer'" },
        { status: 400 }
      );
    }

    // Hash password if provided
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const supabase = await createServerSupabaseClient();

    // Create user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        name,
        phone,
        role,
        employee_id,
        password_hash: passwordHash,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === 'P2002' || error.code === '23505') {
        throw new Error("duplicate key");
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ 
      user: newUser,
      message: "User created successfully" 
    }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
