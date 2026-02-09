import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = JSON.parse(sessionToken.value);
    const userId = userData.id;

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    const supabase = await createServerSupabaseClient();

    if (markAllAsRead) {
      // Mark all unread notifications as read
      const { error } = await supabase
        .from("in_app_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
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
        .eq("user_id", userId);

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
