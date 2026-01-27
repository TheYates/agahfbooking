import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// In production, use a job scheduler like BullMQ, Agenda, or a cloud service
// This is a placeholder for the scheduling logic

interface ScheduledReminder {
  appointmentId: string;
  userId: string;
  title: string;
  body: string;
  scheduledTime: Date;
}

const scheduledReminders = new Map<string, ScheduledReminder>();

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
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

    const reminder: ScheduledReminder = {
      appointmentId,
      userId: session.user.id,
      title,
      body: body || "",
      scheduledTime: new Date(scheduledTime),
    };

    // In production, schedule with a job queue:
    // await reminderQueue.add('send-reminder', reminder, {
    //   delay: reminder.scheduledTime.getTime() - Date.now()
    // });

    scheduledReminders.set(appointmentId, reminder);

    console.log(
      `Reminder scheduled for appointment ${appointmentId} at ${reminder.scheduledTime}`
    );

    return NextResponse.json({
      success: true,
      message: "Reminder scheduled",
      scheduledTime: reminder.scheduledTime,
    });
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    return NextResponse.json(
      { success: false, error: "Failed to schedule reminder" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
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

    // Remove scheduled reminder
    scheduledReminders.delete(appointmentId);

    return NextResponse.json({
      success: true,
      message: "Reminder cancelled",
    });
  } catch (error) {
    console.error("Error cancelling reminder:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel reminder" },
      { status: 500 }
    );
  }
}
