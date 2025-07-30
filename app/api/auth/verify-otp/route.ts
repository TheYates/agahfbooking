import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ClientService, OtpService } from "@/lib/db-services";

export async function POST(request: NextRequest) {
  try {
    const { xNumber, otp } = await request.json();

    // Verify OTP against database
    const isValidOtp = await OtpService.verify(xNumber, otp);
    if (!isValidOtp) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Find client by X-number (only clients authenticate via OTP)
    const client = await ClientService.findByXNumber(xNumber);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Create session token
    const sessionData = {
      id: client.id,
      xNumber: client.x_number,
      name: client.name,
      phone: client.phone,
      category: client.category,
      role: "client" as const,
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
      redirectUrl: "/dashboard",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
