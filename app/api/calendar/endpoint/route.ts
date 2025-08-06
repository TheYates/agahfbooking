import { NextRequest, NextResponse } from "next/server";
import { calendarConfig } from "@/lib/calendar-config-service";

/**
 * GET /api/calendar/endpoint
 * Get the appropriate appointments endpoint based on user role and admin settings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userRole = searchParams.get("userRole");
    const currentUserId = searchParams.get("currentUserId");

    if (!userRole) {
      return NextResponse.json(
        {
          success: false,
          error: "User role is required",
        },
        { status: 400 }
      );
    }

    if (!currentUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Current user ID is required",
        },
        { status: 400 }
      );
    }

    // Get the appropriate appointments endpoint based on admin settings
    const endpoint = await calendarConfig.getAppointmentsEndpoint(
      userRole,
      parseInt(currentUserId, 10)
    );

    // Also get the current visibility setting for informational purposes
    const visibility = await calendarConfig.getCurrentVisibility();

    return NextResponse.json({
      success: true,
      data: {
        endpoint,
        visibility,
        userRole,
        currentUserId: parseInt(currentUserId, 10),
      },
    });
  } catch (error) {
    console.error("Calendar endpoint API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
