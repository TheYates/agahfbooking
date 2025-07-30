import { NextResponse } from "next/server";
import { AppointmentService } from "@/lib/db-services";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId");
    const date = searchParams.get("date");

    let appointments;

    if (departmentId && date) {
      // Get appointments for specific department and date
      appointments = await AppointmentService.getByDepartmentAndDate(
        parseInt(departmentId),
        date
      );
    } else if (startDate && endDate) {
      // Get appointments for date range
      appointments = await AppointmentService.getByDateRange(
        startDate,
        endDate
      );
    } else {
      // Default: get appointments for today
      const today = new Date().toISOString().split("T")[0];
      appointments = await AppointmentService.getByDateRange(today, today);
    }

    return NextResponse.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch appointments",
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
    const {
      client_id,
      department_id,
      appointment_date,
      slot_number,
      booked_by,
    } = body;

    if (
      !client_id ||
      !department_id ||
      !appointment_date ||
      !slot_number ||
      !booked_by
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: client_id, department_id, appointment_date, slot_number, booked_by",
        },
        { status: 400 }
      );
    }

    // Validate appointment date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(appointment_date);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return NextResponse.json(
        { error: "Cannot book appointments in the past" },
        { status: 400 }
      );
    }

    const appointment = await AppointmentService.create({
      client_id,
      department_id,
      doctor_id: body.doctor_id, // optional specific doctor
      appointment_date,
      slot_number,
      notes: body.notes,
      booked_by,
    });

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      {
        error: "Failed to create appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    const appointment = await AppointmentService.update(id, {
      status,
      notes,
    });

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      {
        error: "Failed to update appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    await AppointmentService.delete(parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      {
        error: "Failed to delete appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
