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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const reportType = searchParams.get("type") || "overview";
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get basic appointment statistics
    const appointmentStats = await query(
      `SELECT
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_appointments
      FROM appointments
      WHERE appointment_date >= $1`,
      [startDate.toISOString().split("T")[0]]
    );

    // Get patient statistics
    const patientStats = await query(
      `SELECT
        COUNT(DISTINCT a.client_id) as total_patients,
        COUNT(DISTINCT CASE WHEN c.created_at >= $1 THEN a.client_id END) as new_patients
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      WHERE a.appointment_date >= $1`,
      [startDate.toISOString().split("T")[0]]
    );

    // Get department performance
    const departmentStats = await query(
      `SELECT
        d.name,
        COUNT(a.id) as appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_show,
        ROUND((COUNT(CASE WHEN a.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)), 1) as completion_rate
      FROM departments d
      LEFT JOIN appointments a ON d.id = a.department_id
        AND a.appointment_date >= $1
      WHERE d.is_active = true
      GROUP BY d.id, d.name
      HAVING COUNT(a.id) > 0
      ORDER BY appointments DESC`,
      [startDate.toISOString().split("T")[0]]
    );

    // Get category statistics
    const categoryStats = await query(
      `SELECT
        c.category,
        COUNT(a.id) as count,
        ROUND((COUNT(a.id) * 100.0 / (SELECT COUNT(*) FROM appointments WHERE appointment_date >= $1)), 1) as percentage
      FROM clients c
      JOIN appointments a ON c.id = a.client_id
      WHERE a.appointment_date >= $1
      GROUP BY c.category
      ORDER BY count DESC`,
      [startDate.toISOString().split("T")[0]]
    );

    // Get daily statistics for the last 7 days
    const dailyStats = await query(
      `SELECT 
        appointment_date::date as date,
        COUNT(*) as appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM appointments 
      WHERE appointment_date >= $1
      GROUP BY appointment_date::date
      ORDER BY date DESC
      LIMIT 7`,
      [
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      ]
    );

    // Get time slot utilization
    const timeSlotStats = await query(
      `SELECT 
        slot_number as slot,
        COUNT(*) as bookings,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM appointments WHERE appointment_date >= $1)), 1) as utilization
      FROM appointments 
      WHERE appointment_date >= $1
      GROUP BY slot_number
      ORDER BY slot_number`,
      [startDate.toISOString().split("T")[0]]
    );

    const stats = appointmentStats.rows[0];
    const patients = patientStats.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        totalAppointments: parseInt(stats.total_appointments) || 0,
        completedAppointments: parseInt(stats.completed_appointments) || 0,
        cancelledAppointments: parseInt(stats.cancelled_appointments) || 0,
        noShowAppointments: parseInt(stats.no_show_appointments) || 0,
        totalPatients: parseInt(patients.total_patients) || 0,
        newPatients: parseInt(patients.new_patients) || 0,
        departmentStats: departmentStats.rows.map((row) => ({
          name: row.name,
          appointments: parseInt(row.appointments),
          completed: parseInt(row.completed),
          cancelled: parseInt(row.cancelled),
          noShow: parseInt(row.no_show),
          completionRate: parseFloat(row.completion_rate) || 0,
        })),
        categoryStats: categoryStats.rows.map((row) => ({
          category: row.category,
          count: parseInt(row.count),
          percentage: parseFloat(row.percentage),
        })),
        dailyStats: dailyStats.rows.map((row) => ({
          date: row.date,
          appointments: parseInt(row.appointments),
          completed: parseInt(row.completed),
        })),
        timeSlotStats: timeSlotStats.rows.map((row) => ({
          slot: parseInt(row.slot),
          bookings: parseInt(row.bookings),
          utilization: parseFloat(row.utilization),
        })),
      },
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}
