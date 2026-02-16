import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session-service";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        name: session.name,
        role: session.role,
        xNumber: session.xNumber,
        phone: session.phone,
        category: session.category,
        employeeId: session.employeeId,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
