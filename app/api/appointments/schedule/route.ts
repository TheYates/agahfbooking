import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

    // Generate 7 days starting from the start date
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      const dayName = i === 0 ? "Today" : dayNames[currentDate.getDay()];
      const dateString = `${months[currentDate.getMonth()]} ${currentDate.getDate()}`;
      
      // Get department info to determine slots per day
      const deptResult = await query(
        "SELECT slots_per_day FROM departments WHERE id = $1",
        [departmentId]
      );
      
      const slotsPerDay = deptResult.rows[0]?.slots_per_day || 10;
      
      // Get existing appointments for this date and department
      const appointmentsResult = await query(`
        SELECT 
          a.id,
          a.slot_number,
          c.x_number as client_x_number
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        WHERE a.department_id = $1 
        AND DATE(a.appointment_date) = DATE($2)
        AND a.status != 'cancelled'
        ORDER BY a.slot_number
      `, [departmentId, currentDate.toISOString().split('T')[0]]);

      const bookedSlots = new Map();
      appointmentsResult.rows.forEach((apt: any) => {
        bookedSlots.set(apt.slot_number, apt.client_x_number);
      });

      // Generate time slots
      const slots = [];
      for (let slotNum = 1; slotNum <= slotsPerDay; slotNum++) {
        const isBooked = bookedSlots.has(slotNum);
        slots.push({
          time: `Slot ${slotNum}`,
          available: !isBooked,
          clientXNumber: isBooked ? bookedSlots.get(slotNum) : undefined,
        });
      }

      schedule.push({
        date: dateString,
        dayName,
        dayNumber: currentDate.getDate(),
        slots,
        hasAvailability: slots.some(slot => slot.available),
      });
    }

    return NextResponse.json({
      success: true,
      data: schedule,
    });

  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
