import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Public settings endpoint - returns only non-sensitive settings
 * that are safe to expose to all users (authenticated or not)
 */

interface PublicSettings {
  sessionTimeoutMinutes: number;
  maxAdvanceBookingDays: number;
  sameDayBookingAllowed: boolean;
}

const defaultPublicSettings: PublicSettings = {
  sessionTimeoutMinutes: 60,
  maxAdvanceBookingDays: 14,
  sameDayBookingAllowed: false,
};

const PUBLIC_SETTINGS_KEYS = {
  sessionTimeoutMinutes: "session_timeout_minutes",
  maxAdvanceBookingDays: "max_advance_booking_days",
  sameDayBookingAllowed: "same_day_booking_allowed",
} as const;

export async function GET(_request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_key,setting_value")
      .in("setting_key", Object.values(PUBLIC_SETTINGS_KEYS));

    if (error) {
      console.error("Public settings fetch error:", error);
      // Return defaults on error
      return NextResponse.json({
        success: true,
        data: defaultPublicSettings,
      });
    }

    const settings: PublicSettings = { ...defaultPublicSettings };

    for (const row of data || []) {
      const key = row.setting_key as string;
      const value = (row as any).setting_value as string;

      switch (key) {
        case PUBLIC_SETTINGS_KEYS.sessionTimeoutMinutes:
          settings.sessionTimeoutMinutes = parseInt(value) || defaultPublicSettings.sessionTimeoutMinutes;
          break;
        case PUBLIC_SETTINGS_KEYS.maxAdvanceBookingDays:
          settings.maxAdvanceBookingDays = parseInt(value) || defaultPublicSettings.maxAdvanceBookingDays;
          break;
        case PUBLIC_SETTINGS_KEYS.sameDayBookingAllowed:
          settings.sameDayBookingAllowed = value === "true";
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Public settings error:", error);
    // Return defaults on any error - don't expose error details
    return NextResponse.json({
      success: true,
      data: defaultPublicSettings,
    });
  }
}
