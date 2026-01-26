// 🚀 Reports API - Convex Backend
// Migrated from PostgreSQL to Convex

import { NextRequest, NextResponse } from "next/server";
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("@/convex/_generated/api");

// Helper to get Convex client
function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Convex URL not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

export async function GET(request: NextRequest) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const convexClient = getConvexClient();

    // Fetch all required data from Convex
    const [appointments, clients, departments] = await Promise.all([
      convexClient.query(api.queries.getAppointmentsByDateRange, {
        startDate: startDateStr,
        endDate: new Date().toISOString().split("T")[0],
      }),
      convexClient.query(api.queries.getClients, {}),
      convexClient.query(api.queries.getDepartments, { isActive: true }),
    ]);

    // Calculate appointment statistics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter((a: any) => a.status === "completed").length;
    const cancelledAppointments = appointments.filter((a: any) => a.status === "cancelled").length;
    const noShowAppointments = appointments.filter((a: any) => a.status === "no_show").length;

    // Calculate patient statistics
    const uniqueClientIds = new Set(appointments.map((a: any) => a.client_id));
    const totalPatients = uniqueClientIds.size;
    
    // New patients - clients created within the date range
    const newPatients = clients.filter((c: any) => {
      if (!c._creationTime) return false;
      const createdDate = new Date(c._creationTime);
      return createdDate >= startDate;
    }).length;

    // Calculate department statistics
    const departmentStatsMap = new Map<string, {
      name: string;
      appointments: number;
      completed: number;
      cancelled: number;
      noShow: number;
    }>();

    departments.forEach((dept: any) => {
      departmentStatsMap.set(dept._id, {
        name: dept.name,
        appointments: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
      });
    });

    appointments.forEach((apt: any) => {
      const deptStats = departmentStatsMap.get(apt.department_id);
      if (deptStats) {
        deptStats.appointments++;
        if (apt.status === "completed") deptStats.completed++;
        if (apt.status === "cancelled") deptStats.cancelled++;
        if (apt.status === "no_show") deptStats.noShow++;
      }
    });

    const departmentStats = Array.from(departmentStatsMap.values())
      .filter((d) => d.appointments > 0)
      .map((d) => ({
        ...d,
        completionRate: d.appointments > 0 
          ? Math.round((d.completed / d.appointments) * 1000) / 10 
          : 0,
      }))
      .sort((a, b) => b.appointments - a.appointments);

    // Calculate category statistics
    const categoryMap = new Map<string, number>();
    const clientMap = new Map(clients.map((c: any) => [c._id, c]));

    appointments.forEach((apt: any) => {
      const client: any = clientMap.get(apt.client_id);
      if (client) {
        const category = client.category || "Unknown";
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    });

    const categoryStats = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalAppointments > 0 
          ? Math.round((count / totalAppointments) * 1000) / 10 
          : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate daily statistics for the last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7DaysStr = last7Days.toISOString().split("T")[0];

    const dailyMap = new Map<string, { appointments: number; completed: number }>();
    
    appointments
      .filter((a: any) => a.appointment_date >= last7DaysStr)
      .forEach((apt: any) => {
        const date = apt.appointment_date;
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { appointments: 0, completed: 0 });
        }
        const stats = dailyMap.get(date)!;
        stats.appointments++;
        if (apt.status === "completed") stats.completed++;
      });

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        appointments: stats.appointments,
        completed: stats.completed,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    // Calculate time slot utilization
    const slotMap = new Map<number, number>();
    
    appointments.forEach((apt: any) => {
      const slot = apt.slot_number;
      slotMap.set(slot, (slotMap.get(slot) || 0) + 1);
    });

    const timeSlotStats = Array.from(slotMap.entries())
      .map(([slot, bookings]) => ({
        slot,
        bookings,
        utilization: totalAppointments > 0 
          ? Math.round((bookings / totalAppointments) * 1000) / 10 
          : 0,
      }))
      .sort((a, b) => a.slot - b.slot);

    const responseTime = Date.now() - requestStart;
    console.log(`⚡ Reports API: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        totalPatients,
        newPatients,
        departmentStats,
        categoryStats,
        dailyStats,
        timeSlotStats,
      },
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Reports API error (${responseTime}ms):`, error);
    return NextResponse.json(
      { success: false, error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}
