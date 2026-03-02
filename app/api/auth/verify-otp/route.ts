import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rateLimiter } from "@/lib/rate-limiter";
import { getClientInfo } from "@/lib/get-client-ip";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { arkeselSMS } from "@/lib/arkesel-sms";
import { logLoginAttempt } from "@/lib/login-audit";
import { createSession } from "@/lib/session-service";

export async function POST(request: NextRequest) {
  try {
    const { xNumber, otp } = await request.json();

    const clientInfo = getClientInfo(request);

    if (!xNumber || !otp) {
      rateLimiter.recordAttempt(clientInfo.ip, false, undefined, clientInfo.userAgent);
      await logLoginAttempt({
        userType: "client",
        identifier: xNumber || null,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "xNumber and otp are required",
      });
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
      await logLoginAttempt({
        userType: "client",
        identifier: xNumber,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: rateLimitResult.reason || "Too many attempts. Please try again later.",
      });

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

    const supabase = createAdminSupabaseClient();

    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id,x_number,name,phone,category,is_active")
      .eq("x_number", xNumber)
      .single();

    if (clientErr || !client) {
      rateLimiter.recordAttempt(clientInfo.ip, false, xNumber, clientInfo.userAgent);
      await logLoginAttempt({
        userType: "client",
        identifier: xNumber,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Client not found",
      });
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!(client as any).is_active) {
      await logLoginAttempt({
        userType: "client",
        userId: (client as any).id,
        identifier: (client as any).x_number,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Client account is inactive",
      });
      return NextResponse.json({ error: "Client account is inactive" }, { status: 403 });
    }

    const otpMode = process.env.OTP_MODE || "mock";
    let otpValid = false;

    if (otpMode === "arkesel") {
      console.log(`[Arkesel] Verifying OTP for ${(client as any).phone}`);
      const verifyResult = await arkeselSMS.verifyOTPViaArkeselAPI(
        (client as any).phone,
        otp
      );
      
      if (verifyResult.isValid) {
        console.log(`OTP verified successfully via Arkesel for ${xNumber}`);
        otpValid = true;
      } else {
        console.log(`OTP verification failed via Arkesel: ${verifyResult.message}`);
        rateLimiter.recordAttempt(clientInfo.ip, false, xNumber, clientInfo.userAgent);
        await logLoginAttempt({
          userType: "client",
          identifier: xNumber,
          ipAddress: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          success: false,
          errorMessage: verifyResult.message || "Invalid or expired OTP",
        });
        return NextResponse.json(
          { error: verifyResult.message || "Invalid or expired OTP" },
          { status: 400 }
        );
      }
    } else {
      const { data: otpRecord, error: otpErr } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("x_number", xNumber)
        .eq("otp_code", otp)
        .eq("is_used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (otpErr || !otpRecord) {
        rateLimiter.recordAttempt(clientInfo.ip, false, xNumber, clientInfo.userAgent);
        await logLoginAttempt({
          userType: "client",
          identifier: xNumber,
          ipAddress: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          success: false,
          errorMessage: "Invalid or expired OTP",
        });
        return NextResponse.json(
          { error: "Invalid or expired OTP" },
          { status: 400 }
        );
      }

      await supabase
        .from("otp_codes")
        .update({ is_used: true })
        .eq("id", otpRecord.id);
      
      otpValid = true;
    }

    const session = await createSession({
      userId: (client as any).id as number,
      userType: "client",
      role: "client",
      xNumber: (client as any).x_number as string,
      name: (client as any).name as string,
      phone: (client as any).phone as string,
      category: (client as any).category as string,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });

    rateLimiter.recordAttempt(clientInfo.ip, true, xNumber, clientInfo.userAgent);

    await logLoginAttempt({
      userType: "client",
      userId: (client as any).id,
      identifier: (client as any).x_number,
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
      token: session.id, // Return session ID as token for mobile apps
      session: {
        user: {
          id: session.userId,
          xNumber: session.xNumber,
          name: session.name,
          phone: session.phone,
          category: session.category,
          role: session.role,
        },
      },
      user: {
        id: session.userId,
        xNumber: session.xNumber,
        name: session.name,
        phone: session.phone,
        category: session.category,
        role: session.role,
      },
      redirectUrl: "/dashboard",
    });
  } catch (error) {
    const clientInfo = getClientInfo(request);
    await logLoginAttempt({
      userType: "client",
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Internal server error",
    });

    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
