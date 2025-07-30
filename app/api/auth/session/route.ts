import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 }
      );
    }

    try {
      const sessionData = JSON.parse(sessionToken.value);
      
      return NextResponse.json({
        success: true,
        user: sessionData,
      });
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid session data" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
