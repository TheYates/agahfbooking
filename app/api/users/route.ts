import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/db-services";
import { requireAdminAuth } from "@/lib/auth-server";
import bcrypt from "bcryptjs";

// GET /api/users - Get all users with optional search
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const currentUser = await requireAdminAuth();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let users;
    if (search) {
      users = await UserService.search(search);
    } else {
      users = await UserService.getAll();
    }

    return NextResponse.json({ users });
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
    if (!["receptionist", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be either 'receptionist' or 'admin'" },
        { status: 400 }
      );
    }

    // Create user
    const newUser = await UserService.create({
      name,
      phone,
      role,
      employee_id,
    });

    // Set password if provided
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await UserService.setPassword(newUser.id, passwordHash);
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
