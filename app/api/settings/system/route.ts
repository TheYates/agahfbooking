import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface SystemSettings {
  maxAdvanceBookingDays: number;
  multipleAppointmentsAllowed: boolean;
  sameDayBookingAllowed: boolean;
  defaultSlotsPerDay: number;
  sessionDurationHours: number;
  sessionTimeoutMinutes: number;
  recurringAppointmentsEnabled: boolean;
  waitlistEnabled: boolean;
  emergencySlotsEnabled: boolean;
}

const defaultSettings: SystemSettings = {
  maxAdvanceBookingDays: 14,
  multipleAppointmentsAllowed: false,
  sameDayBookingAllowed: false,
  defaultSlotsPerDay: 10,
  sessionDurationHours: 24,
  sessionTimeoutMinutes: 60,
  recurringAppointmentsEnabled: false,
  waitlistEnabled: false,
  emergencySlotsEnabled: false,
};

function validateSettings(settings: SystemSettings): {
  isValid: boolean;
  error?: string;
} {
  if (settings.maxAdvanceBookingDays < 1 || settings.maxAdvanceBookingDays > 365) {
    return {
      isValid: false,
      error: "Max advance booking days must be between 1 and 365",
    };
  }

  if (settings.defaultSlotsPerDay < 1 || settings.defaultSlotsPerDay > 50) {
    return {
      isValid: false,
      error: "Default slots per day must be between 1 and 50",
    };
  }

  if (settings.sessionDurationHours < 1 || settings.sessionDurationHours > 168) {
    return {
      isValid: false,
      error: "Session duration must be between 1 and 168 hours",
    };
  }

  if (
    settings.sessionTimeoutMinutes < 5 ||
    settings.sessionTimeoutMinutes > 480
  ) {
    return {
      isValid: false,
      error: "Session timeout must be between 5 and 480 minutes",
    };
  }

  return { isValid: true };
}

const SETTINGS_KEYS = {
  maxAdvanceBookingDays: "max_advance_booking_days",
  multipleAppointmentsAllowed: "multiple_appointments_allowed",
  sameDayBookingAllowed: "same_day_booking_allowed",
  defaultSlotsPerDay: "default_slots_per_day",
  sessionDurationHours: "session_duration_hours",
  sessionTimeoutMinutes: "session_timeout_minutes",
  recurringAppointmentsEnabled: "recurring_appointments_enabled",
  waitlistEnabled: "waitlist_enabled",
  emergencySlotsEnabled: "emergency_slots_enabled",
} as const;

export async function GET(_request: NextRequest) {
  try {
    // Get current user without redirect (for API routes)
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_key,setting_value")
      .in("setting_key", Object.values(SETTINGS_KEYS));

    if (error) throw new Error(error.message);

    const settings: SystemSettings = { ...defaultSettings };

    for (const row of data || []) {
      const key = row.setting_key as string;
      const value = (row as any).setting_value as string;

      switch (key) {
        case SETTINGS_KEYS.maxAdvanceBookingDays:
          settings.maxAdvanceBookingDays = parseInt(value);
          break;
        case SETTINGS_KEYS.multipleAppointmentsAllowed:
          settings.multipleAppointmentsAllowed = value === "true";
          break;
        case SETTINGS_KEYS.sameDayBookingAllowed:
          settings.sameDayBookingAllowed = value === "true";
          break;
        case SETTINGS_KEYS.defaultSlotsPerDay:
          settings.defaultSlotsPerDay = parseInt(value);
          break;
        case SETTINGS_KEYS.sessionDurationHours:
          settings.sessionDurationHours = parseInt(value);
          break;
        case SETTINGS_KEYS.sessionTimeoutMinutes:
          settings.sessionTimeoutMinutes = parseInt(value);
          break;
        case SETTINGS_KEYS.recurringAppointmentsEnabled:
          settings.recurringAppointmentsEnabled = value === "true";
          break;
        case SETTINGS_KEYS.waitlistEnabled:
          settings.waitlistEnabled = value === "true";
          break;
        case SETTINGS_KEYS.emergencySlotsEnabled:
          settings.emergencySlotsEnabled = value === "true";
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("System settings GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const settings: SystemSettings = await request.json();

    const validation = validateSettings(settings);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const updatedBy = typeof user.id === "number" ? user.id : null;

    const upserts = [
      {
        setting_key: SETTINGS_KEYS.maxAdvanceBookingDays,
        setting_value: settings.maxAdvanceBookingDays.toString(),
        description: "Maximum days in advance clients can book",
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      {
        setting_key: SETTINGS_KEYS.multipleAppointmentsAllowed,
        setting_value: settings.multipleAppointmentsAllowed.toString(),
        description: "Allow clients to have multiple future appointments",
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      {
        setting_key: SETTINGS_KEYS.sameDayBookingAllowed,
        setting_value: settings.sameDayBookingAllowed.toString(),
        description: "Allow same-day appointment booking",
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      {
        setting_key: SETTINGS_KEYS.defaultSlotsPerDay,
        setting_value: settings.defaultSlotsPerDay.toString(),
        description: "Default number of slots per day",
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      {
        setting_key: SETTINGS_KEYS.sessionDurationHours,
        setting_value: settings.sessionDurationHours.toString(),
        description: "User session duration in hours",
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      {
        setting_key: SETTINGS_KEYS.sessionTimeoutMinutes,
        setting_value: settings.sessionTimeoutMinutes.toString(),
        description: "Auto-logout timeout in minutes (5-480)",
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      {
        setting_key: SETTINGS_KEYS.recurringAppointmentsEnabled,
        setting_value: settings.recurringAppointmentsEnabled.toString(),
        description: "Enable recurring appointments feature",
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      {
        setting_key: SETTINGS_KEYS.waitlistEnabled,
        setting_value: settings.waitlistEnabled.toString(),
        description: "Enable waitlist feature",
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      {
        setting_key: SETTINGS_KEYS.emergencySlotsEnabled,
        setting_value: settings.emergencySlotsEnabled.toString(),
        description: "Enable emergency slots feature",
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
    ];

    const { error } = await supabase
      .from("system_settings")
      .upsert(upserts as any, { onConflict: "setting_key" });

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "System settings updated successfully",
    });
  } catch (error) {
    console.error("System settings POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
