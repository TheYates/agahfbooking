import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session-service";

export async function GET(request: NextRequest) {
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

    const supabase = await createServerSupabaseClient();
const { count, error } = await supabase
      .from("in_app_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.userId)
      .eq("is_read", false);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("Unread count fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}
