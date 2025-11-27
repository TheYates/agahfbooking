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

    // Optimized: Combine multiple queries into a single query using CTEs and window functions
    const combinedStatsResult = await query(
      `
      WITH appointment_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE appointment_date >= $2 AND status NOT IN ('cancelled', 'completed', 'no_show')) as upcoming_count,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', $2::date)) as total_month_count,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
          MIN(appointment_date) FILTER (WHERE appointment_date >= $2 AND status NOT IN ('cancelled', 'completed', 'no_show')) as next_appointment_date
        FROM appointments
        WHERE client_id = $1
      ),
      recent_appointments AS (
        SELECT
          a.id,
          a.appointment_date,
          a.slot_number,
          a.status,
          d.name as doctor_name,
          dept.name as department_name,
          dept.color as department_color,
          ROW_NUMBER() OVER (ORDER BY a.appointment_date DESC, a.slot_number DESC) as rn
        FROM appointments a
        JOIN departments dept ON a.department_id = dept.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        WHERE a.client_id = $1
      ),
      week_slots AS (
        SELECT
          COALESCE(SUM(dept.slots_per_day * 7), 0) as total_weekly_slots,
          COALESCE(COUNT(a.id), 0) as booked_weekly_slots
        FROM departments dept
        LEFT JOIN appointments a ON a.department_id = dept.id
          AND a.appointment_date BETWEEN $3 AND $4
          AND a.status NOT IN ('cancelled')
        WHERE dept.is_active = true
      )
      SELECT
        ast.upcoming_count,
        ast.total_month_count,
        ast.completed_count,
        ast.next_appointment_date,
        ws.total_weekly_slots,
        ws.booked_weekly_slots,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ra.id,
              'date', ra.appointment_date,
              'slotNumber', ra.slot_number,
              'status', ra.status,
              'doctorName', ra.doctor_name,
              'departmentName', ra.department_name,
              'departmentColor', ra.department_color
            ) ORDER BY ra.appointment_date DESC, ra.slot_number DESC
          ) FILTER (WHERE ra.rn <= 5),
          '[]'::json
        ) as recent_appointments
      FROM appointment_stats ast
      CROSS JOIN week_slots ws
      LEFT JOIN recent_appointments ra ON ra.rn <= 5
      GROUP BY ast.upcoming_count, ast.total_month_count, ast.completed_count,
               ast.next_appointment_date, ws.total_weekly_slots, ws.booked_weekly_slots
    `,
      [
        clientId,
        today,
        // Week start and end for available slots calculation
        (() => {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          return weekStart.toISOString().split("T")[0];
        })(),
        (() => {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return weekEnd.toISOString().split("T")[0];
        })(),
      ]
    );

    // Process the combined result
    const result = combinedStatsResult.rows[0];

    // Calculate days until next appointment
    let daysUntilNext = null;
    if (result.next_appointment_date) {
      const nextDate = new Date(result.next_appointment_date);
      const todayDate = new Date(today);
      daysUntilNext = Math.ceil(
        (nextDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Calculate available slots
    const totalSlots = parseInt(result.total_weekly_slots || "0");
    const bookedSlots = parseInt(result.booked_weekly_slots || "0");
    const availableSlots = Math.max(0, totalSlots - bookedSlots);

    // Parse recent appointments from JSON
    const recentAppointments = result.recent_appointments || [];

    const stats = {
      upcomingAppointments: parseInt(result.upcoming_count || "0"),
      totalAppointments: parseInt(result.total_month_count || "0"),
      completedAppointments: parseInt(result.completed_count || "0"),
      availableSlots,
      daysUntilNext,
      recentAppointments: recentAppointments.map((appointment: any) => ({
        id: appointment.id,
        date: new Date(appointment.date).toISOString().split("T")[0],
        slotNumber: appointment.slotNumber,
        status: appointment.status,
        doctorName: appointment.doctorName,
        departmentName: appointment.departmentName,
        departmentColor: appointment.departmentColor,
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
