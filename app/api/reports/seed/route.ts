import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only admin can seed data
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Add some sample clients if they don't exist
    const clientsResult = await query(`
      INSERT INTO clients (x_number, name, phone, category) VALUES
      ('X12345/67', 'John Doe', '+1234567890', 'PRIVATE CASH'),
      ('X23456/78', 'Jane Smith', '+1234567891', 'PUBLIC SPONSORED(NHIA)'),
      ('X34567/89', 'Bob Johnson', '+1234567892', 'PRIVATE SPONSORED'),
      ('X45678/90', 'Alice Brown', '+1234567893', 'PRIVATE DEPENDENT'),
      ('X56789/01', 'Charlie Wilson', '+1234567894', 'PRIVATE CASH')
      ON CONFLICT (x_number) DO NOTHING
      RETURNING id
    `);

    // Get existing clients
    const clients = await query("SELECT id FROM clients LIMIT 5");
    const departments = await query("SELECT id FROM departments LIMIT 3");
    const doctors = await query("SELECT id FROM doctors LIMIT 3");

    if (clients.rows.length === 0 || departments.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error:
          "No clients or departments found. Please ensure the database is properly seeded.",
      });
    }

    // Add sample appointments for the last 30 days
    const appointments = [];
    const statuses = ["booked", "completed", "cancelled", "no_show", "arrived"];

    for (let i = 0; i < 50; i++) {
      const randomDays = Math.floor(Math.random() * 30);
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() - randomDays);

      const clientId =
        clients.rows[Math.floor(Math.random() * clients.rows.length)].id;
      const departmentId =
        departments.rows[Math.floor(Math.random() * departments.rows.length)]
          .id;
      const doctorId =
        doctors.rows.length > 0
          ? doctors.rows[Math.floor(Math.random() * doctors.rows.length)].id
          : null;
      const slotNumber = Math.floor(Math.random() * 10) + 1;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      try {
        await query(
          `
          INSERT INTO appointments (client_id, department_id, doctor_id, appointment_date, slot_number, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (department_id, appointment_date, slot_number) DO NOTHING
        `,
          [
            clientId,
            departmentId,
            doctorId,
            appointmentDate.toISOString().split("T")[0],
            slotNumber,
            status,
            appointmentDate,
          ]
        );
        appointments.push({
          clientId,
          departmentId,
          appointmentDate: appointmentDate.toISOString().split("T")[0],
          status,
        });
      } catch (error) {
        // Ignore conflicts (slot already taken)
        console.log("Skipping conflicting appointment:", error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sample data seeded successfully",
      data: {
        clientsAdded: clientsResult.rows.length,
        appointmentsAttempted: 50,
        appointmentsCreated: appointments.length,
      },
    });
  } catch (error) {
    console.error("Seed API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed data", details: error.message },
      { status: 500 }
    );
  }
}
