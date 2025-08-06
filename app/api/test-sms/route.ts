import { NextRequest, NextResponse } from "next/server";
import { hubtelSMS } from "@/lib/hubtel-sms";
import { requireAdminAuth } from "@/lib/auth-server";

// POST /api/test-sms - Test Hubtel SMS integration (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth();

    const { phone, message } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const testMessage = message || "Test message from AGAHF Hospital booking system. If you receive this, SMS integration is working correctly.";

    // Test SMS sending
    const result = await hubtelSMS.sendSMS({
      to: phone,
      message: testMessage
    });

    return NextResponse.json({
      success: result.status === 'success',
      message: result.message,
      data: result.data,
      errors: result.errors
    });

  } catch (error) {
    console.error("Test SMS error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to send test SMS",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET /api/test-sms - Check Hubtel configuration status
export async function GET() {
  try {
    const clientId = process.env.HUBTEL_CLIENT_ID;
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
    const senderId = process.env.HUBTEL_SENDER_ID;

    const isConfigured = !!(
      clientId && 
      clientSecret && 
      clientId !== "your_hubtel_client_id_here" &&
      clientSecret !== "your_hubtel_client_secret_here"
    );

    return NextResponse.json({
      configured: isConfigured,
      clientId: clientId ? `${clientId.substring(0, 4)}****` : "Not set",
      senderId: senderId || "AGAHF",
      message: isConfigured 
        ? "Hubtel SMS is configured and ready to use" 
        : "Hubtel SMS is not properly configured. Please check your environment variables."
    });

  } catch (error) {
    console.error("SMS config check error:", error);
    return NextResponse.json(
      { 
        configured: false,
        error: "Failed to check SMS configuration"
      },
      { status: 500 }
    );
  }
}
