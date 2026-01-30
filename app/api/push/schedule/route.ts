import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const h = await headers();
    const session = await auth.api.getSession({
      headers: h,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { appointmentId, title, body, scheduledTime } = await request.json();

    if (!appointmentId || !title || !scheduledTime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const scheduled = new Date(scheduledTime);
    if (Number.isNaN(scheduled.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid scheduledTime" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { error } = await supabase.from("push_reminders").upsert(
      {
        appointment_id: appointmentId,
        user_id: session.user.id,
        title,
        body: body || "",
        scheduled_time: scheduled.toISOString(),
        status: "scheduled",
      } as any,
      {
        onConflict: "appointment_id",
      }
    );

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Reminder scheduled",
      scheduledTime: scheduled,
    });
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to schedule reminder",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const h = await headers();
    const session = await auth.api.getSession({
      headers: h,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "Missing appointment ID" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from("push_reminders")
      .delete()
      .eq("appointment_id", appointmentId)
      .eq("user_id", session.user.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Reminder cancelled",
    });
  } catch (error) {
    console.error("Error cancelling reminder:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel reminder",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
