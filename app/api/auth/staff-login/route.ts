import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { staffLogin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Use BetterAuth staff login function
    const userData = await staffLogin(username, password);

    // Set secure HTTP-only cookie (maintaining compatibility)
    const cookieStore = await cookies();
    cookieStore.set("session_token", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Staff login error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message.includes("Invalid")
            ? 401
            : 500,
      }
    );
  }
}
