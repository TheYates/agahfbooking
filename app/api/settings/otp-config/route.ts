import { NextRequest, NextResponse } from "next/server";
import { otpConfig, OTPMode } from "@/lib/otp-config-service";
import { cookies } from "next/headers";

// Helper function to check admin authentication for API routes
async function checkAdminAuth(): Promise<{ isAdmin: boolean; user?: any }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session_token");

    if (!sessionCookie?.value) {
      return { isAdmin: false };
    }

    const userData = JSON.parse(sessionCookie.value);

    if (userData.role !== "admin") {
      return { isAdmin: false };
    }

    return { isAdmin: true, user: userData };
  } catch (error) {
    return { isAdmin: false };
  }
}

// GET /api/settings/otp-config - Get current OTP configuration
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { isAdmin } = await checkAdminAuth();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin authentication required",
        },
        { status: 401 }
      );
    }

    const config = await otpConfig.getConfig();
    const status = await otpConfig.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        ...status,
        debugInfo:
          process.env.NODE_ENV === "development"
            ? otpConfig.getDebugInfo()
            : undefined,
      },
    });
  } catch (error) {
    console.error("Get OTP config error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get OTP configuration",
      },
      { status: 500 }
    );
  }
}

// POST /api/settings/otp-config - Update OTP configuration
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { isAdmin } = await checkAdminAuth();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin authentication required",
        },
        { status: 401 }
      );
    }

    const { mode, testConnection } = await request.json();

    // Validate mode if provided
    if (mode && mode !== "hubtel" && mode !== "mock") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid OTP mode. Must be 'hubtel' or 'mock'",
        },
        { status: 400 }
      );
    }

    let result: any = { success: true };

    // Update mode if provided
    if (mode) {
      const currentStatus = await otpConfig.getStatus();

      // Check if the requested mode is available
      if (mode === "hubtel" && !currentStatus.canSwitchToHubtel) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot switch to Hubtel mode. Please check Hubtel configuration (HUBTEL_CLIENT_ID and HUBTEL_CLIENT_SECRET).",
          },
          { status: 400 }
        );
      }

      await otpConfig.setMode(mode as OTPMode);
      result.modeChanged = true;
      result.newMode = mode;
    }

    // Test connection if requested
    if (testConnection) {
      const testResult = await otpConfig.testConnection();
      result.connectionTest = testResult;
    }

    // Get updated configuration
    const updatedConfig = await otpConfig.getConfig();
    const updatedStatus = await otpConfig.getStatus();

    return NextResponse.json({
      ...result,
      data: {
        ...updatedConfig,
        ...updatedStatus,
        debugInfo:
          process.env.NODE_ENV === "development"
            ? otpConfig.getDebugInfo()
            : undefined,
      },
    });
  } catch (error) {
    console.error("Update OTP config error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update OTP configuration",
      },
      { status: 500 }
    );
  }
}

// PUT /api/settings/otp-config/test - Test current OTP service
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const { isAdmin } = await checkAdminAuth();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin authentication required",
        },
        { status: 401 }
      );
    }

    const { phone, message } = await request.json();

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required for testing",
        },
        { status: 400 }
      );
    }

    const testMessage =
      message ||
      "Test message from AGAHF Hospital booking system. OTP service is working correctly.";

    // Test SMS sending with current configuration
    const result = await otpConfig.sendSMS({
      to: phone,
      message: testMessage,
    });

    return NextResponse.json({
      success: result.status === "success",
      mode: otpConfig.getCurrentMode(),
      message: result.message,
      data: result.data,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Test OTP service error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test OTP service",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
