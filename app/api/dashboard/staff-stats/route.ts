import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // Get current date for calculations
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get today's appointments count
    const todayAppointmentsResult = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE DATE(a.appointment_date) = $1
      AND a.status NOT IN ('cancelled')
    `,
      [today]
    );

    // Get total appointments this month
    const totalThisMonthResult = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE DATE_TRUNC('month', a.appointment_date) = DATE_TRUNC('month', $1::date)
    `,
      [today]
    );

    // Get completed appointments today
    const completedTodayResult = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE DATE(a.appointment_date) = $1
      AND a.status = 'completed'
    `,
      [today]
    );

    // Get available slots for today
    const availableSlotsResult = await query(
      `
      SELECT 
        SUM(dept.slots_per_day) as total_slots,
        COUNT(a.id) as booked_slots
      FROM departments dept
      LEFT JOIN appointments a ON a.department_id = dept.id 
        AND DATE(a.appointment_date) = $1
        AND a.status NOT IN ('cancelled')
      WHERE dept.is_active = true
    `,
      [today]
    );

    // Get recent appointments (last 5 for today)
    const recentAppointmentsResult = await query(
      `
      SELECT
        a.id,
        a.appointment_date,
        a.slot_number,
        a.status,
        c.name as client_name,
        c.x_number as client_x_number,
        d.name as doctor_name,
        dept.name as department_name,
        dept.color as department_color
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN departments dept ON a.department_id = dept.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE DATE(a.appointment_date) = $1
      ORDER BY a.appointment_date DESC, a.slot_number DESC
      LIMIT 5
    `,
      [today]
    );

    // Get upcoming appointments for next few days
    const upcomingAppointmentsResult = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE a.appointment_date > $1
      AND a.appointment_date <= $2
      AND a.status NOT IN ('cancelled', 'completed', 'no_show')
    `,
      [today, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]]
    );

    const totalSlots = parseInt(availableSlotsResult.rows[0]?.total_slots || "0");
    const bookedSlots = parseInt(availableSlotsResult.rows[0]?.booked_slots || "0");
    const availableSlots = Math.max(0, totalSlots - bookedSlots);

    const stats = {
      upcomingAppointments: parseInt(upcomingAppointmentsResult.rows[0]?.count || "0"),
      totalAppointments: parseInt(totalThisMonthResult.rows[0]?.count || "0"),
      completedAppointments: parseInt(completedTodayResult.rows[0]?.count || "0"),
      availableSlots: availableSlots,
      daysUntilNext: null, // Not applicable for staff
      recentAppointments: recentAppointmentsResult.rows.map((row: any) => ({
        id: row.id,
        date: row.appointment_date.toISOString().split("T")[0],
        slotNumber: row.slot_number,
        status: row.status,
        doctorName: row.doctor_name,
        departmentName: row.department_name,
        departmentColor: row.department_color,
        clientName: row.client_name,
        clientXNumber: row.client_x_number,
      })),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching staff dashboard stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
