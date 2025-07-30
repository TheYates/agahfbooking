import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find user by employee_id (username) or name
    const result = await query(
      `SELECT * FROM users
       WHERE (employee_id = $1 OR LOWER(name) = LOWER($1))
       AND role IN ('receptionist', 'admin')
       AND is_active = true`,
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // For demo purposes, we'll use simple password comparison
    // In production, you should hash passwords with bcrypt
    let isValidPassword = false;

    // Demo credentials for testing
    if (
      (username === "admin" && password === "admin123") ||
      (username === "receptionist" && password === "recep123")
    ) {
      isValidPassword = true;
    } else {
      // If you have hashed passwords in the database, use this:
      // isValidPassword = await bcrypt.compare(password, user.password_hash)
      isValidPassword = false;
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create session data (without x_number since staff don't have them)
    const sessionData = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      employee_id: user.employee_id,
      loginTime: new Date().toISOString(),
    };

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: sessionData,
    });
  } catch (error) {
    console.error("Staff login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
