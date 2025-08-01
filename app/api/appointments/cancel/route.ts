import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const date = searchParams.get("date");
    const slotNumber = searchParams.get("slotNumber");
    const clientId = searchParams.get("clientId");

    if (!departmentId || !date || !slotNumber || !clientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Department ID, date, slot number, and client ID are required",
        },
        { status: 400 }
      );
    }

    // First, find the appointment to ensure it exists and belongs to the client
    const findAppointmentResult = await query(
      `
      SELECT id, client_id, status 
      FROM appointments 
      WHERE department_id = $1 
      AND DATE(appointment_date) = DATE($2)
      AND slot_number = $3
      AND client_id = $4
      AND status != 'cancelled'
    `,
      [departmentId, date, slotNumber, clientId]
    );

    if (findAppointmentResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Appointment not found or already cancelled",
        },
        { status: 404 }
      );
    }

    const appointment = findAppointmentResult.rows[0];

    // Check if the appointment belongs to the requesting client
    if (appointment.client_id !== parseInt(clientId)) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only cancel your own appointments",
        },
        { status: 403 }
      );
    }

    // Check if the appointment is in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot cancel past appointments",
        },
        { status: 400 }
      );
    }

    // Update the appointment status to 'cancelled'
    const cancelResult = await query(
      `
      UPDATE appointments 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
      [appointment.id]
    );

    if (cancelResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to cancel appointment",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: {
        id: appointment.id,
        status: "cancelled",
      },
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
