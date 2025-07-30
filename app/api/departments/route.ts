import { NextResponse } from "next/server";
import { DepartmentService } from "@/lib/db-services";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    let departments;

    if (date) {
      // Get departments with availability for specific date
      departments = await DepartmentService.getDepartmentsWithAvailability(
        date
      );
    } else {
      // Get all active departments
      departments = await DepartmentService.getAll();
    }

    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch departments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const department = await DepartmentService.create({
      name,
      description: body.description,
      slots_per_day: body.slots_per_day,
      working_days: body.working_days,
      working_hours: body.working_hours,
      color: body.color,
    });

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      {
        error: "Failed to create department",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
