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

    const isWorkingDay = await AppointmentService.isWorkingDay(
      parseInt(departmentId),
      date
    );

    return NextResponse.json({
      success: true,
      data: {
        is_working_day: isWorkingDay,
        department_id: parseInt(departmentId),
        date: date,
      },
    });
  } catch (error) {
    console.error("Error checking working day:", error);
    return NextResponse.json(
      {
        error: "Failed to check working day",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
