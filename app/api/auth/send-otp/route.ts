import { type NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";
import { getClientInfo } from "@/lib/get-client-ip";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let requestBody: { xNumber?: string } = {};

  try {
    requestBody = await request.json();
    const { xNumber } = requestBody;

    const clientInfo = getClientInfo(request);

    // Validate X-number format
    const xNumberRegex = /^X\d{5}\/\d{2}$/;
    if (!xNumber || !xNumberRegex.test(xNumber)) {
      rateLimiter.recordAttempt(clientInfo.ip, false, undefined, clientInfo.userAgent);
      return NextResponse.json({ error: "Invalid X-number format" }, { status: 400 });
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

    // Look up client email
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id,email")
      .eq("x_number", xNumber)
      .eq("is_active", true)
      .single();

    if (clientErr || !client) {
      rateLimiter.recordAttempt(clientInfo.ip, false, xNumber, clientInfo.userAgent);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!(client as any).email) {
      return NextResponse.json(
        { error: "No email is set for this client. Please contact reception." },
        { status: 400 }
      );
    }

    // Trigger Supabase Email OTP
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: (client as any).email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (otpErr) {
      rateLimiter.recordAttempt(clientInfo.ip, false, xNumber, clientInfo.userAgent);
      return NextResponse.json({ error: otpErr.message }, { status: 500 });
    }

    rateLimiter.recordAttempt(clientInfo.ip, true, xNumber, clientInfo.userAgent);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // We return xNumber so the client can continue the flow; actual OTP goes to email.
      xNumber,
      rateLimitInfo: {
        remainingAttempts: rateLimitResult.remainingAttempts,
        requiresCaptcha: rateLimitResult.requiresCaptcha,
        resetTime: rateLimitResult.resetTime,
      },
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    try {
      const clientInfo = getClientInfo(request);
      const { xNumber } = requestBody;
      if (xNumber) {
        rateLimiter.recordAttempt(clientInfo.ip, false, xNumber, clientInfo.userAgent);
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
