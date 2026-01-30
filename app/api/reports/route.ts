// 🚀 Reports API - Supabase Backend
// Migrated from Convex to Supabase (Phase 4)

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AppointmentRow = {
  id: number;
  appointment_date: string; // date or timestamp
  slot_number: number;
  status: string;
  client_id: number;
  department_id: number;
};

type ClientRow = {
  id: number;
  category: string | null;
  created_at: string | null;
};

type DepartmentRow = {
  id: number;
  name: string;
};

export async function GET(request: NextRequest) {
  const requestStart = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.max(1, parseInt(searchParams.get("days") || "30"));
    // `type` currently controls only UI presentation; we accept it for compatibility.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _type = searchParams.get("type") || "overview";

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const supabase = await createServerSupabaseClient();

    // Fetch required datasets.
    // Note: We keep this straightforward (JS aggregation) to avoid adding RPCs in Phase 4.
    const [appointmentsRes, clientsRes, departmentsRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("id,appointment_date,slot_number,status,client_id,department_id")
        .gte("appointment_date", startDateStr)
        .lte("appointment_date", endDateStr),
      supabase.from("clients").select("id,category,created_at"),
      supabase
        .from("departments")
        .select("id,name")
        .eq("is_active", true),
    ]);

    if (appointmentsRes.error) throw new Error(appointmentsRes.error.message);
    if (clientsRes.error) throw new Error(clientsRes.error.message);
    if (departmentsRes.error) throw new Error(departmentsRes.error.message);

    const appointments = (appointmentsRes.data || []) as AppointmentRow[];
    const clients = (clientsRes.data || []) as ClientRow[];
    const departments = (departmentsRes.data || []) as DepartmentRow[];

    // Appointment statistics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (a) => a.status === "completed"
    ).length;
    const cancelledAppointments = appointments.filter(
      (a) => a.status === "cancelled"
    ).length;
    const noShowAppointments = appointments.filter(
      (a) => a.status === "no_show"
    ).length;

    // Patient statistics
    const uniqueClientIds = new Set(appointments.map((a) => a.client_id));
    const totalPatients = uniqueClientIds.size;

    // New patients: created within date range
    const newPatients = clients.filter((c) => {
      if (!c.created_at) return false;
      const created = new Date(c.created_at);
      return created >= startDate;
    }).length;

    // Department statistics
    const departmentStatsMap = new Map<
      number,
      {
        name: string;
        appointments: number;
        completed: number;
        cancelled: number;
        noShow: number;
      }
    >();

    departments.forEach((dept) => {
      departmentStatsMap.set(dept.id, {
        name: dept.name,
        appointments: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
      });
    });

    appointments.forEach((apt) => {
      const deptStats = departmentStatsMap.get(apt.department_id);
      if (!deptStats) return;

      deptStats.appointments++;
      if (apt.status === "completed") deptStats.completed++;
      if (apt.status === "cancelled") deptStats.cancelled++;
      if (apt.status === "no_show") deptStats.noShow++;
    });

    const departmentStats = Array.from(departmentStatsMap.values())
      .filter((d) => d.appointments > 0)
      .map((d) => ({
        ...d,
        completionRate:
          d.appointments > 0
            ? Math.round((d.completed / d.appointments) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.appointments - a.appointments);

    // Category statistics
    const clientById = new Map<number, ClientRow>();
    clients.forEach((c) => clientById.set(c.id, c));

    const categoryMap = new Map<string, number>();
    appointments.forEach((apt) => {
      const client = clientById.get(apt.client_id);
      const category = client?.category || "Unknown";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const categoryStats = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage:
          totalAppointments > 0
            ? Math.round((count / totalAppointments) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Daily stats (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7DaysStr = last7Days.toISOString().split("T")[0];

    const dailyMap = new Map<string, { appointments: number; completed: number }>();
    appointments
      .filter((a) => {
        const d = a.appointment_date.includes("T")
          ? a.appointment_date.split("T")[0]
          : a.appointment_date;
        return d >= last7DaysStr;
      })
      .forEach((apt) => {
        const date = apt.appointment_date.includes("T")
          ? apt.appointment_date.split("T")[0]
          : apt.appointment_date;
        if (!dailyMap.has(date)) dailyMap.set(date, { appointments: 0, completed: 0 });
        const s = dailyMap.get(date)!;
        s.appointments++;
        if (apt.status === "completed") s.completed++;
      });

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    // Time slot utilization
    const slotMap = new Map<number, number>();
    appointments.forEach((apt) => {
      slotMap.set(apt.slot_number, (slotMap.get(apt.slot_number) || 0) + 1);
    });

    const timeSlotStats = Array.from(slotMap.entries())
      .map(([slot, bookings]) => ({
        slot,
        bookings,
        utilization:
          totalAppointments > 0
            ? Math.round((bookings / totalAppointments) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => a.slot - b.slot);

    const responseTime = Date.now() - requestStart;

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
        startDate: startDateStr,
        endDate: endDateStr,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error(`❌ Reports API error (${responseTime}ms):`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate reports",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
