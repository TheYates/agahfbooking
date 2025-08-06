import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOTP } from "@/lib/auth";
import { rateLimiter } from "@/lib/rate-limiter";
import { getClientInfo } from "@/lib/get-client-ip";

export async function POST(request: NextRequest) {
  try {
    const { token, otp } = await request.json();

    // Get client information for rate limiting
    const clientInfo = getClientInfo(request);

    if (!token) {
      // Record failed attempt for missing token
      rateLimiter.recordAttempt(
        clientInfo.ip,
        false,
        undefined,
        clientInfo.userAgent
      );

      return NextResponse.json(
        { error: "OTP token is required" },
        { status: 400 }
      );
    }

    // Check rate limiting before processing
    const rateLimitResult = rateLimiter.checkRateLimit(
      clientInfo.ip,
      undefined, // We don't have X-number here, but IP limiting still applies
      clientInfo.userAgent
    );

    if (!rateLimitResult.allowed) {
      console.log(
        `🚫 Rate limit exceeded for ${clientInfo.ip} during OTP verification: ${rateLimitResult.reason}`
      );

      return NextResponse.json(
        {
          error:
            rateLimitResult.reason ||
            "Too many attempts. Please try again later.",
          rateLimited: true,
          resetTime: rateLimitResult.resetTime,
          blockDuration: rateLimitResult.blockDuration,
          requiresCaptcha: rateLimitResult.requiresCaptcha,
        },
        { status: 429 }
      );
    }

    // Use BetterAuth verifyOTP function with JWT token
    const userData = await verifyOTP(token, otp);

    // Record successful attempt
    rateLimiter.recordAttempt(
      clientInfo.ip,
      true,
      userData.xNumber,
      clientInfo.userAgent
    );

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
      redirectUrl: "/dashboard",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    // Record failed attempt for verification errors
    try {
      const clientInfo = getClientInfo(request);
      rateLimiter.recordAttempt(
        clientInfo.ip,
        false,
        undefined,
        clientInfo.userAgent
      );
    } catch (recordError) {
      console.error("Failed to record rate limit attempt:", recordError);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message.includes("Invalid")
            ? 400
            : error instanceof Error && error.message.includes("not found")
            ? 404
            : 500,
      }
    );
  }
}
