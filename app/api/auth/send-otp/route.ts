import { type NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";
import { getClientInfo } from "@/lib/get-client-ip";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hubtelSMS } from "@/lib/hubtel-sms";

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

    const supabase = await createServerSupabaseClient();

    // Look up client
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id,x_number,phone,name")
      .eq("x_number", xNumber)
      .eq("is_active", true)
      .single();

    if (clientErr || !client) {
      rateLimiter.recordAttempt(clientInfo.ip, false, xNumber, clientInfo.userAgent);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Generate a simple 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: otpInsertErr } = await supabase
      .from("otp_codes")
      .insert({
        x_number: xNumber,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

    if (otpInsertErr) {
      rateLimiter.recordAttempt(clientInfo.ip, false, xNumber, clientInfo.userAgent);
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    // Send OTP via SMS
    const otpMode = process.env.OTP_MODE || "mock";
    
    if (otpMode === "production" || otpMode === "hubtel") {
      // Send real SMS via Hubtel
      try {
        const smsResult = await hubtelSMS.sendOTP(client.phone, otp, "AGAHF Hospital");
        
        if (smsResult.status !== 'success') {
          console.error("Hubtel SMS sending failed:", smsResult.message);
          // Continue anyway - OTP is stored in DB and can be used
          // But log the failure for monitoring
        } else {
          console.log(`✅ OTP SMS sent successfully via Hubtel to ${client.phone}`);
        }
      } catch (smsError) {
        console.error("Error sending SMS via Hubtel:", smsError);
        // Continue - OTP is still valid in database
      }
    } else if (otpMode === "arkesel") {
      // Send real SMS via Arkesel
      try {
        const { arkeselSMS } = await import("@/lib/arkesel-sms");
        const smsResult = await arkeselSMS.sendOTP(client.phone, otp, "AGAHF Hospital");
        
        if (smsResult.status !== 'success') {
          console.error("Arkesel SMS sending failed:", smsResult.message);
          // Continue anyway - OTP is stored in DB and can be used
        } else {
          console.log(`✅ OTP SMS sent successfully via Arkesel to ${client.phone}`);
        }
      } catch (smsError) {
        console.error("Error sending SMS via Arkesel:", smsError);
        // Continue - OTP is still valid in database
      }
    } else {
      // Mock mode - log to console
      console.log(`\n🔐 OTP for ${xNumber} (${client.name}): ${otp}`);
      console.log(`   Phone: ${client.phone}`);
      console.log(`   Expires: ${expiresAt.toLocaleTimeString()}\n`);
    }

    rateLimiter.recordAttempt(clientInfo.ip, true, xNumber, clientInfo.userAgent);

    return NextResponse.json({
      success: true,
      message: otpMode === "mock" 
        ? `OTP sent successfully. Check console logs (DEV MODE)` 
        : `OTP sent to ${client.phone}`,
      xNumber,
      // In mock mode, return the OTP for testing (REMOVE IN PRODUCTION!)
      ...(otpMode === "mock" && { otp }),
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
