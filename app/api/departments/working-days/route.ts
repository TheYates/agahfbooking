import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function isWorkingDayFromArray(workingDays: string[] | null, date: string): boolean {
  if (!workingDays || workingDays.length === 0) return false;

  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) return false;

  const dayOfWeek = dateObj.getDay();
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return workingDays.includes(dayNames[dayOfWeek]);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const date = searchParams.get("date");

    if (!departmentId || !date) {
      return NextResponse.json(
        { error: "departmentId and date are required" },
        { status: 400 }
      );
    }

    const id = parseInt(departmentId);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid departmentId" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("departments")
      .select("id,working_days")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    const isWorkingDay = isWorkingDayFromArray(data.working_days ?? null, date);

    return NextResponse.json({
      success: true,
      data: {
        is_working_day: isWorkingDay,
        department_id: id,
        date,
      },
    });
  } catch (error) {
    console.error("Error checking working day:", error);
    return NextResponse.json(
      {
        error: "Failed to check working day",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
