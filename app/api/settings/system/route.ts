import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

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
  if (
    settings.maxAdvanceBookingDays < 1 ||
    settings.maxAdvanceBookingDays > 365
  ) {
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

  if (
    settings.sessionDurationHours < 1 ||
    settings.sessionDurationHours > 168
  ) {
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

export async function GET(request: NextRequest) {
  try {
    // Get current user without redirect (for API routes)
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only admin can access system settings
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get system settings from individual rows
    const result = await query(`
      SELECT setting_key, setting_value
      FROM system_settings
      WHERE setting_key IN (
        'max_advance_booking_days',
        'multiple_appointments_allowed',
        'same_day_booking_allowed',
        'default_slots_per_day',
        'session_duration_hours',
        'session_timeout_minutes',
        'recurring_appointments_enabled',
        'waitlist_enabled',
        'emergency_slots_enabled'
      )
    `);

    // Convert database rows to settings object
    let settings = { ...defaultSettings };

    for (const row of result.rows) {
      const key = row.setting_key;
      const value = row.setting_value;

      // Map database keys to camelCase and convert types
      switch (key) {
        case "max_advance_booking_days":
          settings.maxAdvanceBookingDays = parseInt(value);
          break;
        case "multiple_appointments_allowed":
          settings.multipleAppointmentsAllowed = value === "true";
          break;
        case "same_day_booking_allowed":
          settings.sameDayBookingAllowed = value === "true";
          break;
        case "default_slots_per_day":
          settings.defaultSlotsPerDay = parseInt(value);
          break;
        case "session_duration_hours":
          settings.sessionDurationHours = parseInt(value);
          break;
        case "session_timeout_minutes":
          settings.sessionTimeoutMinutes = parseInt(value);
          break;
        case "recurring_appointments_enabled":
          settings.recurringAppointmentsEnabled = value === "true";
          break;
        case "waitlist_enabled":
          settings.waitlistEnabled = value === "true";
          break;
        case "emergency_slots_enabled":
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
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user without redirect (for API routes)
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only admin can modify system settings
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const settings: SystemSettings = await request.json();

    // Validate settings
    const validation = validateSettings(settings);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Save each setting as individual row
    const settingsMap = [
      {
        key: "max_advance_booking_days",
        value: settings.maxAdvanceBookingDays.toString(),
        desc: "Maximum days in advance clients can book",
      },
      {
        key: "multiple_appointments_allowed",
        value: settings.multipleAppointmentsAllowed.toString(),
        desc: "Allow clients to have multiple future appointments",
      },
      {
        key: "same_day_booking_allowed",
        value: settings.sameDayBookingAllowed.toString(),
        desc: "Allow same-day appointment booking",
      },
      {
        key: "default_slots_per_day",
        value: settings.defaultSlotsPerDay.toString(),
        desc: "Default number of slots per day",
      },
      {
        key: "session_duration_hours",
        value: settings.sessionDurationHours.toString(),
        desc: "User session duration in hours",
      },
      {
        key: "session_timeout_minutes",
        value: settings.sessionTimeoutMinutes.toString(),
        desc: "Auto-logout timeout in minutes (5-480)",
      },
      {
        key: "recurring_appointments_enabled",
        value: settings.recurringAppointmentsEnabled.toString(),
        desc: "Enable recurring appointments feature",
      },
      {
        key: "waitlist_enabled",
        value: settings.waitlistEnabled.toString(),
        desc: "Enable waitlist feature",
      },
      {
        key: "emergency_slots_enabled",
        value: settings.emergencySlotsEnabled.toString(),
        desc: "Enable emergency slots feature",
      },
    ];

    // Update each setting individually
    for (const setting of settingsMap) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, description, updated_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (setting_key)
         DO UPDATE SET
           setting_value = $2,
           updated_by = $4,
           updated_at = CURRENT_TIMESTAMP`,
        [setting.key, setting.value, setting.desc, user.id]
      );
    }

    return NextResponse.json({
      success: true,
      message: "System settings updated successfully",
    });
  } catch (error) {
    console.error("System settings POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
