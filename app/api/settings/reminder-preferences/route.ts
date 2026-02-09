import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("user_reminder_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // Return default preferences if none exist
    const preferences = data || {
      enabled: true,
      remind_24h: true,
      remind_1h: true,
      remind_30m: false,
      push_enabled: true,
      sms_enabled: false,
    };

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error("Error fetching reminder preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, remind_24h, remind_1h, remind_30m, push_enabled, sms_enabled } = body;

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("user_reminder_preferences")
      .upsert(
        {
          user_id: user.id,
          enabled,
          remind_24h,
          remind_1h,
          remind_30m,
          push_enabled,
          sms_enabled,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error saving reminder preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
