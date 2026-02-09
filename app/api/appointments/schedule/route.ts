import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSlotTimeInfo, parseTimeString, type WorkingHours } from "@/lib/slot-time-utils";
import { MemoryCache } from "@/lib/memory-cache";

const dayNamesLong = [
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

const dayNamesShort = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function isWorkingDayFromArray(workingDays: string[] | null, date: string): boolean {
  if (!workingDays || workingDays.length === 0) return false;
  const dateObj = new Date(date);
  const dayName = dayNamesShort[dateObj.getDay()];
  return workingDays.includes(dayName);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentIdRaw = searchParams.get("departmentId");
    const startDateRaw = searchParams.get("startDate");

    if (!departmentIdRaw) {
      return NextResponse.json(
        { success: false, error: "Department ID is required" },
        { status: 400 }
      );
    }

    const departmentId = parseInt(departmentIdRaw, 10);
    if (Number.isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Department ID" },
        { status: 400 }
      );
    }

    // Parse start date or use today
    const start = startDateRaw ? new Date(startDateRaw) : new Date();
    const startDate = start.toISOString().split("T")[0];

    // Create cache key for this week's schedule
    const cacheKey = `week_schedule_${departmentId}_${startDate}`;

    const scheduleData = await MemoryCache.get(
      cacheKey,
      async () => {
        return await generateScheduleForWeek(departmentId, start);
      },
      'weekSchedule' // 30 second cache
    );

    return NextResponse.json(
      scheduleData,
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

async function generateScheduleForWeek(departmentId: number, start: Date) {
    const schedule: any[] = [];

    // Determine how many days to generate based on week type
    const today = new Date();
    const isCurrentWeek =
      Math.abs(start.getTime() - today.getTime()) < 24 * 60 * 60 * 1000; // Within 1 day

    let daysToGenerate = 7;
    if (isCurrentWeek) {
      const todayOfWeek = today.getDay();
      if (todayOfWeek === 0) {
        daysToGenerate = 7;
      } else {
        daysToGenerate = 7 - todayOfWeek;
      }
    }

    const startDate = start.toISOString().split("T")[0];
    const endDateObj = new Date(start);
    endDateObj.setDate(start.getDate() + daysToGenerate - 1);
    const endDate = endDateObj.toISOString().split("T")[0];

    const supabase = await createServerSupabaseClient();

    // Fetch department config once
    const { data: dept, error: deptErr } = await supabase
      .from("departments")
      .select("slots_per_day,working_days,working_hours,slot_duration_minutes")
      .eq("id", departmentId)
      .single();

    if (deptErr || !dept) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    const slotsPerDay = (dept as any).slots_per_day || 10;
    const workingDays = ((dept as any).working_days || []) as string[];
    const workingHours = (dept as any).working_hours as WorkingHours | null;
    const slotDuration = (dept as any).slot_duration_minutes || 30;

    // Calculate actual number of slots that fit within working hours
    const maxSlotsWithinHours = workingHours 
      ? Math.floor(
          ((parseTimeString(workingHours.end).hours * 60 + parseTimeString(workingHours.end).minutes) - 
           (parseTimeString(workingHours.start).hours * 60 + parseTimeString(workingHours.start).minutes)) / 
          slotDuration
        )
      : slotsPerDay;
    
    const actualSlotsPerDay = Math.min(slotsPerDay, maxSlotsWithinHours);

    // Fetch all appointments for the week in one query
    const { data: appts, error: apptsErr } = await supabase
      .from("appointments")
      .select("id,slot_number,client_id,appointment_date,clients(x_number)")
      .eq("department_id", departmentId)
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)
      .neq("status", "cancelled")
      .order("appointment_date", { ascending: true })
      .order("slot_number", { ascending: true });

    if (apptsErr) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch schedule" },
        { status: 500 }
      );
    }

    // Group appointments by date
    const appointmentsByDate = new Map<string, Map<number, any>>();
    (appts || []).forEach((apt: any) => {
      const dateKey = apt.appointment_date.toString().split("T")[0];
      if (!appointmentsByDate.has(dateKey)) {
        appointmentsByDate.set(dateKey, new Map());
      }
      appointmentsByDate.get(dateKey)!.set(apt.slot_number, {
        clientXNumber: apt.clients?.x_number,
        clientId: apt.client_id,
      });
    });

    for (let i = 0; i < daysToGenerate; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);

      const today2 = new Date();
      const isToday =
        currentDate.getFullYear() === today2.getFullYear() &&
        currentDate.getMonth() === today2.getMonth() &&
        currentDate.getDate() === today2.getDate();

      const dayName = isToday ? "Today" : dayNamesLong[currentDate.getDay()];
      const dateString = `${months[currentDate.getMonth()]} ${currentDate.getDate()}`;

      const fullDate = currentDate.toISOString().split("T")[0];
      const isWorkingDay = isWorkingDayFromArray(workingDays, fullDate);

      const bookedSlots = appointmentsByDate.get(fullDate) || new Map();

      const slots: any[] = [];
      if (isWorkingDay) {
        for (let slotNum = 1; slotNum <= actualSlotsPerDay; slotNum++) {
          const isBooked = bookedSlots.has(slotNum);
          const slotData = isBooked ? bookedSlots.get(slotNum) : null;

          // Calculate slot time info
          const slotTimeInfo = workingHours
            ? getSlotTimeInfo(workingHours, slotNum, slotDuration)
            : null;

          slots.push({
            slotNumber: slotNum,
            time: slotTimeInfo?.displayTime || `Slot ${slotNum}`,
            startTime: slotTimeInfo?.startTime || null,
            endTime: slotTimeInfo?.endTime || null,
            startTimeFormatted: slotTimeInfo?.startTimeFormatted || null,
            endTimeFormatted: slotTimeInfo?.endTimeFormatted || null,
            available: !isBooked,
            clientXNumber: slotData?.clientXNumber,
            clientId: slotData?.clientId,
          });
        }
      } else {
        for (let slotNum = 1; slotNum <= actualSlotsPerDay; slotNum++) {
          // Calculate slot time info even for non-working days
          const slotTimeInfo = workingHours
            ? getSlotTimeInfo(workingHours, slotNum, slotDuration)
            : null;

          slots.push({
            slotNumber: slotNum,
            time: slotTimeInfo?.displayTime || `Slot ${slotNum}`,
            startTime: slotTimeInfo?.startTime || null,
            endTime: slotTimeInfo?.endTime || null,
            startTimeFormatted: slotTimeInfo?.startTimeFormatted || null,
            endTimeFormatted: slotTimeInfo?.endTimeFormatted || null,
            available: false,
            clientXNumber: null,
            clientId: null,
            isNonWorkingDay: true,
          });
        }
      }

      schedule.push({
        date: dateString,
        fullDate,
        dayName,
        dayNumber: currentDate.getDate(),
        slots,
        hasAvailability: isWorkingDay && slots.some((slot) => slot.available),
        isWorkingDay,
      });
    }

    return {
      success: true,
      data: schedule,
    };
}
