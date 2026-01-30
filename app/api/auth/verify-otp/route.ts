import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rateLimiter } from "@/lib/rate-limiter";
import { getClientInfo } from "@/lib/get-client-ip";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { xNumber, otp } = await request.json();

    const clientInfo = getClientInfo(request);

    if (!xNumber || !otp) {
      rateLimiter.recordAttempt(clientInfo.ip, false, undefined, clientInfo.userAgent);
      return NextResponse.json(
        { error: "xNumber and otp are required" },
        { status: 400 }
      );
    }

    const rateLimitResult = rateLimiter.checkRateLimit(
      clientInfo.ip,
      xNumber,
      clientInfo.userAgent
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error:
            rateLimitResult.reason || "Too many attempts. Please try again later.",
          rateLimited: true,
          resetTime: rateLimitResult.resetTime,
          blockDuration: rateLimitResult.blockDuration,
          requiresCaptcha: rateLimitResult.requiresCaptcha,
        },
        { status: 429 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Find client email + profile
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id,x_number,name,phone,email,category,is_active")
      .eq("x_number", xNumber)
      .single();

    if (clientErr || !client) {
      rateLimiter.recordAttempt(clientInfo.ip, false, xNumber, clientInfo.userAgent);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!(client as any).is_active) {
      return NextResponse.json({ error: "Client account is inactive" }, { status: 403 });
    }

    if (!(client as any).email) {
      return NextResponse.json(
        { error: "No email is set for this client" },
        { status: 400 }
      );
    }

    // Verify the OTP using Supabase auth
    const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
      email: (client as any).email,
      token: otp,
      type: "email",
    });

    if (verifyErr || !verifyData?.session) {
      rateLimiter.recordAttempt(clientInfo.ip, false, xNumber, clientInfo.userAgent);
      return NextResponse.json(
        { error: verifyErr?.message || "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const userData = {
      id: (client as any).id as number,
      xNumber: (client as any).x_number as string,
      name: (client as any).name as string,
      phone: (client as any).phone as string,
      email: (client as any).email as string,
      category: (client as any).category as string,
      role: "client" as const,
      loginTime: new Date().toISOString(),
    };

    rateLimiter.recordAttempt(clientInfo.ip, true, xNumber, clientInfo.userAgent);

    const cookieStore = await cookies();
    cookieStore.set("session_token", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: userData,
      redirectUrl: "/dashboard",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
