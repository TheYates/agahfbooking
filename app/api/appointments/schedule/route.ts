import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { AppointmentService } from "@/lib/db-services";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const startDate = searchParams.get("startDate");

    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: "Department ID is required" },
        { status: 400 }
      );
    }

    // Parse start date or use today
    const start = startDate ? new Date(startDate) : new Date();
    const schedule = [];

    // Determine how many days to generate based on week type
    const today = new Date();
    const isCurrentWeek = Math.abs(start.getTime() - today.getTime()) < 24 * 60 * 60 * 1000; // Within 1 day

    let daysToGenerate = 7; // Default: full week

    if (isCurrentWeek) {
      // Current week: from today until Saturday (since Sunday starts next week)
      const todayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      if (todayOfWeek === 0) {
        // If today is Sunday, show full week (Sunday to Saturday)
        daysToGenerate = 7;
      } else {
        // Show from today until Saturday
        daysToGenerate = 7 - todayOfWeek;
      }
    }

    // Fetch department info ONCE before the loop (performance optimization)
    const deptResult = await query(
      "SELECT slots_per_day, working_days FROM departments WHERE id = $1",
      [departmentId]
    );
    const slotsPerDay = deptResult.rows[0]?.slots_per_day || 10;
    const workingDays = deptResult.rows[0]?.working_days || [];

    // 🚀 Fetch ALL appointments for the entire week in ONE query
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + daysToGenerate - 1);

    const allAppointmentsResult = await query(
      `
      SELECT
        a.id,
        a.slot_number,
        a.client_id,
        DATE(a.appointment_date) as appointment_date,
        c.x_number as client_x_number
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      WHERE a.department_id = $1
      AND DATE(a.appointment_date) >= DATE($2)
      AND DATE(a.appointment_date) <= DATE($3)
      AND a.status != 'cancelled'
      ORDER BY a.appointment_date, a.slot_number
    `,
      [departmentId, start.toISOString().split("T")[0], endDate.toISOString().split("T")[0]]
    );

    // Group appointments by date for fast lookup
    const appointmentsByDate = new Map();
    allAppointmentsResult.rows.forEach((apt: any) => {
      const dateKey = apt.appointment_date;
      if (!appointmentsByDate.has(dateKey)) {
        appointmentsByDate.set(dateKey, new Map());
      }
      appointmentsByDate.get(dateKey).set(apt.slot_number, {
        clientXNumber: apt.client_x_number,
        clientId: apt.client_id,
      });
    });

    // Generate days
    for (let i = 0; i < daysToGenerate; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Only show "Today" if it's actually today
      const today = new Date();
      const isToday = currentDate.getFullYear() === today.getFullYear() && 
                     currentDate.getMonth() === today.getMonth() && 
                     currentDate.getDate() === today.getDate();
      const dayName = isToday ? "Today" : dayNames[currentDate.getDay()];
      const dateString = `${
        months[currentDate.getMonth()]
      } ${currentDate.getDate()}`;

      // 🚀 Check if this date is a working day (using cached working_days array)
      const isWorkingDay = AppointmentService.isWorkingDayFromArray(
        workingDays,
        currentDate.toISOString().split("T")[0]
      );

      // 🚀 Get booked slots from pre-fetched data (no database query!)
      const dateKey = currentDate.toISOString().split("T")[0];
      const bookedSlots = appointmentsByDate.get(dateKey) || new Map();

      // Generate time slots
      const slots = [];
      if (isWorkingDay) {
        for (let slotNum = 1; slotNum <= slotsPerDay; slotNum++) {
          const isBooked = bookedSlots.has(slotNum);
          const slotData = isBooked ? bookedSlots.get(slotNum) : null;
          slots.push({
            time: `Slot ${slotNum}`,
            available: !isBooked,
            clientXNumber: slotData?.clientXNumber,
            clientId: slotData?.clientId,
          });
        }
      } else {
        // For non-working days, create slots but mark them as unavailable
        for (let slotNum = 1; slotNum <= slotsPerDay; slotNum++) {
          slots.push({
            time: `Slot ${slotNum}`,
            available: false,
            clientXNumber: null,
            clientId: null,
            isNonWorkingDay: true,
          });
        }
      }

      schedule.push({
        date: dateString,
        fullDate: currentDate.toISOString().split("T")[0], // Add full date in YYYY-MM-DD format
        dayName,
        dayNumber: currentDate.getDate(),
        slots,
        hasAvailability: isWorkingDay && slots.some((slot) => slot.available),
        isWorkingDay,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: schedule,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
