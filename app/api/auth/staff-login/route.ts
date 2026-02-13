import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { staffLogin } from "@/lib/auth";
import { getClientInfo } from "@/lib/get-client-ip";
import { logLoginAttempt } from "@/lib/login-audit";
import { createSession } from "@/lib/session-service";

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

    const userData = await staffLogin(username, password);

    const session = await createSession({
      userId: userData.id,
      userType: "staff",
      role: userData.role as "admin" | "receptionist" | "reviewer",
      employeeId: userData.employee_id || userData.username,
      name: userData.name,
      phone: userData.phone,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });

    await logLoginAttempt({
      userType: "staff",
      userId: userData.id,
      identifier: userData.username || username,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: true,
    });

    const cookieStore = await cookies();
    cookieStore.set("session_id", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        name: session.name,
        phone: session.phone,
        role: session.role,
        employeeId: session.employeeId,
      },
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
