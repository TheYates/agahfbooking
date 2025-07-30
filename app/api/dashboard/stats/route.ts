import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Get current date for calculations
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get upcoming appointments count
    const upcomingResult = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE a.client_id = $1 
      AND a.appointment_date >= $2
      AND a.status NOT IN ('cancelled', 'completed', 'no_show')
    `,
      [clientId, today]
    );

    // Get total appointments this month
    const totalThisMonthResult = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE a.client_id = $1 
      AND DATE_TRUNC('month', a.appointment_date) = DATE_TRUNC('month', $2::date)
    `,
      [clientId, today]
    );

    // Get completed appointments count
    const completedResult = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE a.client_id = $1 
      AND a.status = 'completed'
    `,
      [clientId]
    );

    // Get next appointment date
    const nextAppointmentResult = await query(
      `
      SELECT appointment_date
      FROM appointments a
      WHERE a.client_id = $1 
      AND a.appointment_date >= $2
      AND a.status NOT IN ('cancelled', 'completed', 'no_show')
      ORDER BY a.appointment_date ASC
      LIMIT 1
    `,
      [clientId, today]
    );

    // Get recent appointments (last 5)
    const recentAppointmentsResult = await query(
      `
      SELECT
        a.id,
        a.appointment_date,
        a.slot_number,
        a.status,
        d.name as doctor_name,
        dept.name as department_name,
        dept.color as department_color
      FROM appointments a
      JOIN departments dept ON a.department_id = dept.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.client_id = $1
      ORDER BY a.appointment_date DESC, a.slot_number DESC
      LIMIT 5
    `,
      [clientId]
    );

    // Calculate days until next appointment
    let daysUntilNext = null;
    if (nextAppointmentResult.rows.length > 0) {
      const nextDate = new Date(nextAppointmentResult.rows[0].appointment_date);
      const todayDate = new Date(today);
      daysUntilNext = Math.ceil((nextDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Get available slots for this week (approximate)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week

    const availableSlotsResult = await query(
      `
      SELECT 
        SUM(dept.slots_per_day) as total_slots,
        COUNT(a.id) as booked_slots
      FROM departments dept
      CROSS JOIN generate_series($1::date, $2::date, '1 day'::interval) AS date_series
      LEFT JOIN appointments a ON a.department_id = dept.id 
        AND DATE(a.appointment_date) = DATE(date_series)
        AND a.status NOT IN ('cancelled')
      WHERE dept.is_active = true
    `,
      [weekStart.toISOString().split("T")[0], weekEnd.toISOString().split("T")[0]]
    );

    const totalSlots = parseInt(availableSlotsResult.rows[0]?.total_slots || "0");
    const bookedSlots = parseInt(availableSlotsResult.rows[0]?.booked_slots || "0");
    const availableSlots = totalSlots - bookedSlots;

    const stats = {
      upcomingAppointments: parseInt(upcomingResult.rows[0]?.count || "0"),
      totalAppointments: parseInt(totalThisMonthResult.rows[0]?.count || "0"),
      completedAppointments: parseInt(completedResult.rows[0]?.count || "0"),
      availableSlots: Math.max(0, availableSlots),
      daysUntilNext,
      recentAppointments: recentAppointmentsResult.rows.map((row: any) => ({
        id: row.id,
        date: row.appointment_date.toISOString().split("T")[0],
        slotNumber: row.slot_number,
        status: row.status,
        doctorName: row.doctor_name,
        departmentName: row.department_name,
        departmentColor: row.department_color,
      })),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
