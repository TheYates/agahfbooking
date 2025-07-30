import { NextResponse } from "next/server";
import { AppointmentService } from "@/lib/db-services";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const date = searchParams.get("date");

    if (!departmentId || !date) {
      return NextResponse.json(
        { error: "departmentId and date are required" },
        { status: 400 }
      );
    }

    const availableSlots = await AppointmentService.getAvailableSlots(
      parseInt(departmentId),
      date
    );

    return NextResponse.json({
      success: true,
      data: {
        available_slots: availableSlots,
        total_available: availableSlots.length,
      },
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch available slots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
