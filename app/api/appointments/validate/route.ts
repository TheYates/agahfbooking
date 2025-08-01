import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AntiAbuseService } from "@/lib/anti-abuse";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { clientId, departmentId, appointmentDate, slotNumber } = await request.json();

    // Validate required fields
    if (!clientId || !departmentId || !appointmentDate || !slotNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate booking eligibility
    const validation = await AntiAbuseService.validateBooking(
      parseInt(clientId),
      parseInt(departmentId),
      appointmentDate,
      parseInt(slotNumber)
    );

    return NextResponse.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error("Booking validation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate booking" },
      { status: 500 }
    );
  }
}

// Get client score endpoint
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Client ID is required" },
        { status: 400 }
      );
    }

    const clientScore = await AntiAbuseService.calculateClientScore(parseInt(clientId));

    return NextResponse.json({
      success: true,
      data: clientScore
    });
  } catch (error) {
    console.error("Client score error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get client score" },
      { status: 500 }
    );
  }
}
