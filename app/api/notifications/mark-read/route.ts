import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session-service";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    const supabase = await createServerSupabaseClient();

if (markAllAsRead) {
      // Mark all unread notifications as read
      const { error } = await supabase
        .from("in_app_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", session.userId)
        .eq("is_read", false);

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

if (notificationId) {
      // Mark specific notification as read
      const { error } = await supabase
        .from("in_app_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", session.userId);

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Missing notificationId or markAllAsRead" }, { status: 400 });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
