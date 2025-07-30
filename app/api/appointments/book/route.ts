import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { departmentId, clientId, date, slotNumber } = body;

    if (!departmentId || !date || !slotNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Department ID, date, and slot number are required",
        },
        { status: 400 }
      );
    }

    let finalClientId = clientId;

    // If no clientId provided, get from session (for client self-booking)
    if (!clientId) {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("session_token");

      if (!sessionToken) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required or client ID must be provided",
          },
          { status: 401 }
        );
      }

      try {
        const sessionData = JSON.parse(sessionToken.value);
        finalClientId = sessionData.id;
      } catch (parseError) {
        return NextResponse.json(
          { success: false, error: "Invalid session" },
          { status: 401 }
        );
      }
    }

    // Check if slot is still available
    const existingAppointment = await query(
      `
      SELECT id FROM appointments 
      WHERE department_id = $1 
      AND DATE(appointment_date) = DATE($2)
      AND slot_number = $3
      AND status != 'cancelled'
    `,
      [departmentId, date, slotNumber]
    );

    if (existingAppointment.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Create the appointment
    const appointmentResult = await query(
      `
      INSERT INTO appointments (
        client_id, 
        department_id, 
        appointment_date, 
        slot_number, 
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, 'scheduled', NOW())
      RETURNING *
    `,
      [finalClientId, departmentId, date, slotNumber]
    );

    const appointment = appointmentResult.rows[0];

    return NextResponse.json({
      success: true,
      data: appointment,
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to book appointment" },
      { status: 500 }
    );
  }
}
