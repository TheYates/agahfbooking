import { type NextRequest, NextResponse } from "next/server";
import { sendOTP } from "@/lib/auth";
import { rateLimiter } from "@/lib/rate-limiter";
import { getClientInfo } from "@/lib/get-client-ip";

/**
 * Mask phone number for display purposes
 * Examples: +233240298713 -> +233****8713, +1234567890 -> +1****7890
 */
function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return phone;

  // Remove any spaces, dashes, or parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

  if (cleanPhone.length <= 6) {
    // For very short numbers, mask middle part
    return cleanPhone.slice(0, 2) + "****" + cleanPhone.slice(-2);
  }

  // For longer numbers, show country code + first digit and last 4 digits
  if (cleanPhone.startsWith("+")) {
    const countryCodeEnd =
      cleanPhone.indexOf("0") > 0 ? cleanPhone.indexOf("0") : 4;
    const prefix = cleanPhone.slice(0, Math.min(countryCodeEnd + 1, 5));
    const suffix = cleanPhone.slice(-4);
    return prefix + "****" + suffix;
  }

  // Fallback for numbers without country code
  return cleanPhone.slice(0, 2) + "****" + cleanPhone.slice(-4);
}

export async function POST(request: NextRequest) {
  let requestBody: { xNumber?: string } = {};
  
  try {
    requestBody = await request.json();
    const { xNumber } = requestBody;

    // Get client information for rate limiting
    const clientInfo = getClientInfo(request);

    // Validate X-number format
    const xNumberRegex = /^X\d{5}\/\d{2}$/;
    if (!xNumberRegex.test(xNumber)) {
      // Record failed attempt for invalid format
      rateLimiter.recordAttempt(
        clientInfo.ip,
        false,
        undefined,
        clientInfo.userAgent
      );

      return NextResponse.json(
        { error: "Invalid X-number format" },
        { status: 400 }
      );
    }

    // Check rate limiting before processing
    const rateLimitResult = rateLimiter.checkRateLimit(
      clientInfo.ip,
      xNumber,
      clientInfo.userAgent
    );

    if (!rateLimitResult.allowed) {
      console.log(
        `🚫 Rate limit exceeded for ${clientInfo.ip} (${xNumber}): ${rateLimitResult.reason}`
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

    // Use BetterAuth sendOTP function
    const result = await sendOTP(xNumber);

    // Record successful attempt
    rateLimiter.recordAttempt(
      clientInfo.ip,
      true,
      xNumber,
      clientInfo.userAgent
    );

    // Include rate limiting info in response
    return NextResponse.json({
      ...result,
      rateLimitInfo: {
        remainingAttempts: rateLimitResult.remainingAttempts,
        requiresCaptcha: rateLimitResult.requiresCaptcha,
        resetTime: rateLimitResult.resetTime,
      },
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    // Record failed attempt for server errors
    try {
      const clientInfo = getClientInfo(request);
      const { xNumber } = requestBody; // Use already parsed body
      if (xNumber) {
        rateLimiter.recordAttempt(
          clientInfo.ip,
          false,
          xNumber,
          clientInfo.userAgent
        );
      }
    } catch (recordError) {
      console.error("Failed to record rate limit attempt:", recordError);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message.includes("not found")
            ? 404
            : 500,
      }
    );
  }
}
