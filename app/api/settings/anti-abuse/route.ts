import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface AntiAbuseSettings {
  bookingLimits: {
    maxFutureDays: number;
    minAdvanceHours: number;
    maxDailyAppointments: number;
    maxPendingAppointments: number;
    maxSameDeptPending: number;
    allowSameDayBooking: boolean;
    sameDayBookingCutoffHour: number;
  };
  cancellationRules: {
    minCancelHours: number;
    maxCancellationsMonth: number;
    allowSameDayCancel: boolean;
    requireCancelReason: boolean;
  };
  noShowPenalties: {
    maxNoShowsMonth: number;
    firstOffenseDays: number;
    secondOffenseDays: number;
    thirdOffenseDays: number;
    chronicOffenderDays: number;
    autoApplyPenalties: boolean;
  };
  scoringSystem: {
    enabled: boolean;
    excellentThreshold: number;
    goodThreshold: number;
    averageThreshold: number;
    poorThreshold: number;
    showScoreToClients: boolean;
  };
  abuseDetection: {
    enabled: boolean;
    rapidBookingMinutes: number;
    crossDeptConflictCheck: boolean;
    proxyBookingDetection: boolean;
    alertAdminsOnAbuse: boolean;
  };
}

const defaultSettings: AntiAbuseSettings = {
  bookingLimits: {
    maxFutureDays: 30,
    minAdvanceHours: 2,
    maxDailyAppointments: 1,
    maxPendingAppointments: 2,
    maxSameDeptPending: 1,
    allowSameDayBooking: true,
    sameDayBookingCutoffHour: 14,
  },
  cancellationRules: {
    minCancelHours: 24,
    maxCancellationsMonth: 3,
    allowSameDayCancel: false,
    requireCancelReason: true,
  },
  noShowPenalties: {
    maxNoShowsMonth: 2,
    firstOffenseDays: 3,
    secondOffenseDays: 7,
    thirdOffenseDays: 14,
    chronicOffenderDays: 30,
    autoApplyPenalties: true,
  },
  scoringSystem: {
    enabled: true,
    excellentThreshold: 90,
    goodThreshold: 75,
    averageThreshold: 60,
    poorThreshold: 40,
    showScoreToClients: true,
  },
  abuseDetection: {
    enabled: true,
    rapidBookingMinutes: 5,
    crossDeptConflictCheck: true,
    proxyBookingDetection: false,
    alertAdminsOnAbuse: true,
  },
};

const SETTING_KEY = "anti_abuse_settings";

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", SETTING_KEY)
      .maybeSingle();

    if (error) throw new Error(error.message);

    let settings = defaultSettings;

    const raw = (data as any)?.setting_value;
    if (raw) {
      try {
        settings = JSON.parse(raw);
      } catch (e) {
        console.error("Error parsing anti-abuse settings:", e);
      }
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Anti-abuse settings GET error:", error);
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
    const user = await requireAuth();

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const settings: AntiAbuseSettings = await request.json();

    const validation = validateSettings(settings);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const updatedBy = typeof user.id === "number" ? user.id : null;

    const { error } = await supabase
      .from("system_settings")
      .upsert(
        {
          setting_key: SETTING_KEY,
          setting_value: JSON.stringify(settings),
          description: "Anti-abuse protection settings",
          updated_by: updatedBy,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "setting_key" }
      );

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Anti-abuse settings updated successfully",
    });
  } catch (error) {
    console.error("Anti-abuse settings POST error:", error);
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

function validateSettings(settings: AntiAbuseSettings): {
  isValid: boolean;
  error?: string;
} {
  if (settings.bookingLimits.maxFutureDays < 7 || settings.bookingLimits.maxFutureDays > 90) {
    return { isValid: false, error: "Max future days must be between 7 and 90" };
  }

  if (settings.bookingLimits.minAdvanceHours < 1 || settings.bookingLimits.minAdvanceHours > 48) {
    return { isValid: false, error: "Min advance hours must be between 1 and 48" };
  }

  if (settings.bookingLimits.maxDailyAppointments < 1 || settings.bookingLimits.maxDailyAppointments > 3) {
    return { isValid: false, error: "Max daily appointments must be between 1 and 3" };
  }

  if (settings.cancellationRules.minCancelHours < 2 || settings.cancellationRules.minCancelHours > 72) {
    return { isValid: false, error: "Min cancel hours must be between 2 and 72" };
  }

  if (settings.noShowPenalties.firstOffenseDays < 1 || settings.noShowPenalties.firstOffenseDays > 7) {
    return { isValid: false, error: "First offense penalty must be between 1 and 7 days" };
  }

  if (settings.scoringSystem.excellentThreshold <= settings.scoringSystem.goodThreshold) {
    return { isValid: false, error: "Excellent threshold must be higher than good threshold" };
  }

  if (settings.scoringSystem.goodThreshold <= settings.scoringSystem.averageThreshold) {
    return { isValid: false, error: "Good threshold must be higher than average threshold" };
  }

  if (settings.scoringSystem.averageThreshold <= settings.scoringSystem.poorThreshold) {
    return { isValid: false, error: "Average threshold must be higher than poor threshold" };
  }

  return { isValid: true };
}
