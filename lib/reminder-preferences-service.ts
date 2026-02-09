import { createServerClient } from "@/lib/supabase/server";

export async function getUserReminderPreferences(userId: number) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("user_reminder_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching reminder preferences:", error);
  }

  // Return default preferences if none exist
  return data || {
    enabled: true,
    remind_24h: true,
    remind_1h: true,
    remind_30m: false,
    push_enabled: true,
    sms_enabled: false,
  };
}

export function getOffsetMinutesFromPreferences(preferences: {
  enabled: boolean;
  remind_24h: boolean;
  remind_1h: boolean;
  remind_30m: boolean;
}): number[] {
  if (!preferences.enabled) return [];

  const offsets: number[] = [];
  if (preferences.remind_24h) offsets.push(1440); // 24 hours
  if (preferences.remind_1h) offsets.push(60); // 1 hour
  if (preferences.remind_30m) offsets.push(30); // 30 minutes

  return offsets;
}
