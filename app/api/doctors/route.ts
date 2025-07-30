import { NextResponse } from "next/server";
import { DoctorService } from "@/lib/db-services";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    let doctors;

    if (departmentId) {
      // Get doctors for specific department
      doctors = await DoctorService.getByDepartment(parseInt(departmentId));
    } else {
      // Get all active doctors with department info
      doctors = await DoctorService.getAll();
    }

    return NextResponse.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch doctors",
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
    const { name, department_id } = body;

    if (!name || !department_id) {
      return NextResponse.json(
        { error: "Doctor name and department_id are required" },
        { status: 400 }
      );
    }

    const doctor = await DoctorService.create({
      name,
      department_id: parseInt(department_id),
    });

    return NextResponse.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      {
        error: "Failed to create doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
