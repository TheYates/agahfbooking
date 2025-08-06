import { NextRequest, NextResponse } from "next/server";
import { calendarConfig, CalendarVisibility } from "@/lib/calendar-config-service";
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

/**
 * GET /api/settings/calendar-config
 * Get current calendar configuration
 */
export async function GET(request: NextRequest) {
  try {
    const config = await calendarConfig.getConfig();
    const status = await calendarConfig.getStatus();
    const options = calendarConfig.getVisibilityOptions();

    return NextResponse.json({
      success: true,
      data: {
        config,
        status,
        options,
      },
    });
  } catch (error) {
    console.error("Calendar config GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/calendar-config
 * Update calendar configuration (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { isAdmin, user } = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin authentication required",
        },
        { status: 401 }
      );
    }

    const { visibility } = await request.json();

    // Validate input
    if (!visibility) {
      return NextResponse.json(
        {
          success: false,
          error: "Calendar visibility setting is required",
        },
        { status: 400 }
      );
    }

    if (!calendarConfig.isValidVisibility(visibility)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid visibility setting. Must be 'own_only' or 'all_appointments'",
        },
        { status: 400 }
      );
    }

    // Update visibility setting
    await calendarConfig.setVisibility(visibility as CalendarVisibility, user.id);

    // Get updated configuration
    const updatedConfig = await calendarConfig.getConfig();
    const updatedStatus = await calendarConfig.getStatus();

    return NextResponse.json({
      success: true,
      message: "Calendar configuration updated successfully",
      data: {
        config: updatedConfig,
        status: updatedStatus,
        visibilityChanged: true,
        newVisibility: visibility,
      },
    });
  } catch (error) {
    console.error("Calendar config POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/calendar-config/reset
 * Reset calendar configuration to default (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const { isAdmin, user } = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin authentication required",
        },
        { status: 401 }
      );
    }

    // Reset to default
    await calendarConfig.resetToDefault(user.id);

    // Get updated configuration
    const updatedConfig = await calendarConfig.getConfig();
    const updatedStatus = await calendarConfig.getStatus();

    return NextResponse.json({
      success: true,
      message: "Calendar configuration reset to default",
      data: {
        config: updatedConfig,
        status: updatedStatus,
        resetToDefault: true,
      },
    });
  } catch (error) {
    console.error("Calendar config reset error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
