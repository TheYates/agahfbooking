import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { staffLogin } from "@/lib/auth";
import { getClientInfo } from "@/lib/get-client-ip";
import { logLoginAttempt } from "@/lib/login-audit";

export async function POST(request: NextRequest) {
  const clientInfo = getClientInfo(request);
  let attemptedUsername: string | null = null;

  try {
    const { username, password } = await request.json();
    attemptedUsername = username || null;

    if (!username || !password) {
      await logLoginAttempt({
        userType: "staff",
        identifier: username || null,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Username and password are required",
      });

      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Use BetterAuth staff login function
    const userData = await staffLogin(username, password);

    await logLoginAttempt({
      userType: "staff",
      userId: userData.id,
      identifier: userData.username || username,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
    });

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
    await logLoginAttempt({
      userType: "staff",
      identifier: attemptedUsername,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Internal server error",
    });

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
