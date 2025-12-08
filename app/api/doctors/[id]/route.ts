import { NextResponse } from "next/server";
import { DoctorService } from "@/lib/db-services";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const doctorId = parseInt(id);

    const { name, department_id } = body;

    if (!name || !department_id) {
      return NextResponse.json(
        { error: "Doctor name and department_id are required" },
        { status: 400 }
      );
    }

    const doctor = await DoctorService.update(doctorId, {
      name,
      department_id: parseInt(department_id),
    });

    return NextResponse.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      {
        error: "Failed to update doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doctorId = parseInt(id);

    await DoctorService.delete(doctorId);

    return NextResponse.json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      {
        error: "Failed to delete doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
