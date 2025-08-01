import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only admin and receptionist can access reports
    if (user.role !== "admin" && user.role !== "receptionist") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Check what data we have
    const appointmentCount = await query(
      "SELECT COUNT(*) as count FROM appointments"
    );
    const clientCount = await query("SELECT COUNT(*) as count FROM clients");
    const doctorCount = await query("SELECT COUNT(*) as count FROM doctors");
    const departmentCount = await query(
      "SELECT COUNT(*) as count FROM departments"
    );

    // Get sample appointments
    const sampleAppointments = await query(`
      SELECT 
        a.id,
        a.appointment_date,
        a.status,
        a.created_at,
        c.name as client_name,
        d.name as department_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    // Get status distribution
    const statusStats = await query(`
      SELECT status, COUNT(*) as count
      FROM appointments
      GROUP BY status
      ORDER BY count DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          appointments: parseInt(appointmentCount.rows[0].count),
          clients: parseInt(clientCount.rows[0].count),
          doctors: parseInt(doctorCount.rows[0].count),
          departments: parseInt(departmentCount.rows[0].count),
        },
        sampleAppointments: sampleAppointments.rows,
        statusDistribution: statusStats.rows.map((row) => ({
          status: row.status,
          count: parseInt(row.count),
        })),
      },
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch debug data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
