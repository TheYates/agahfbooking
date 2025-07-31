import { type NextRequest, NextResponse } from "next/server";
import { ClientService, OtpService } from "@/lib/db-services";
import { HubtelService } from "@/lib/hubtel-service";

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
  try {
    const { xNumber } = await request.json();

    // Validate X-number format
    const xNumberRegex = /^X\d{5}\/\d{2}$/;
    if (!xNumberRegex.test(xNumber)) {
      return NextResponse.json(
        { error: "Invalid X-number format" },
        { status: 400 }
      );
    }

    // Find client by X-number
    const client = await ClientService.findByXNumber(xNumber);
    if (!client) {
      return NextResponse.json(
        { error: "X-number not found" },
        { status: 404 }
      );
    }

    // Generate random 6-digit OTP
    const otp = HubtelService.generateOTP();

    // Store OTP in database with 10-minute expiration
    await OtpService.create(xNumber, otp, 10);

    // Send OTP via SMS using Hubtel (TEMPORARILY DISABLED)
    // if (HubtelService.isConfigured()) {
    //   const smsSent = await HubtelService.sendOTP(client.phone, otp);

    //   if (!smsSent) {
    //     console.error(`Failed to send SMS to ${client.phone} for ${xNumber}`);
    //     return NextResponse.json(
    //       { error: "Failed to send OTP. Please try again." },
    //       { status: 500 }
    //     );
    //   }

    //   console.log(`OTP sent successfully to ${client.phone} for ${xNumber}`);
    // } else {
    // Mock mode: Always use development/testing mode
    console.log(`🧪 MOCK MODE: OTP ${otp} for ${xNumber} (${client.phone})`);
    // }

    // Create masked phone number for display
    const maskedPhone = maskPhoneNumber(client.phone);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      maskedPhone,
      // Include OTP in mock mode for testing (TEMPORARILY ENABLED)
      otp, // Always include OTP in mock mode
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
