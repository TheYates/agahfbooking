import { query } from "./db";

export interface AntiAbuseSettings {
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

export interface BookingValidationResult {
  canBook: boolean;
  restrictions: string[];
  warnings: string[];
  clientScore?: number;
  penaltyEndDate?: string;
}

export interface ClientScore {
  score: number;
  totalAppointments: number;
  completedAppointments: number;
  noShows: number;
  lastMinuteCancellations: number;
  completionRate: number;
  tier: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR" | "RESTRICTED";
}

// Default settings
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

export class AntiAbuseService {
  private static settings: AntiAbuseSettings | null = null;

  // Get current anti-abuse settings
  static async getSettings(): Promise<AntiAbuseSettings> {
    if (this.settings) {
      return this.settings;
    }

    try {
      const result = await query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'anti_abuse_settings'"
      );

      if (result.rows.length > 0) {
        this.settings = JSON.parse(result.rows[0].setting_value);
      } else {
        this.settings = defaultSettings;
      }
    } catch (error) {
      console.error("Error loading anti-abuse settings:", error);
      this.settings = defaultSettings;
    }

    return this.settings;
  }

  // Clear cached settings (call after updating settings)
  static clearCache() {
    this.settings = null;
  }

  // Calculate client reliability score
  static async calculateClientScore(clientId: number): Promise<ClientScore> {
    const result = await query(
      `
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_shows,
        COUNT(CASE WHEN status = 'cancelled' AND cancelled_at > appointment_date - INTERVAL '24 hours' THEN 1 END) as last_minute_cancellations
      FROM appointments 
      WHERE client_id = $1 
      AND created_at >= NOW() - INTERVAL '6 months'
    `,
      [clientId]
    );

    const stats = result.rows[0];
    const totalAppointments = parseInt(stats.total_appointments) || 0;
    const completedAppointments = parseInt(stats.completed_appointments) || 0;
    const noShows = parseInt(stats.no_shows) || 0;
    const lastMinuteCancellations =
      parseInt(stats.last_minute_cancellations) || 0;

    let score = 100;
    const completionRate =
      totalAppointments > 0
        ? (completedAppointments / totalAppointments) * 100
        : 100;

    // Calculate score based on behavior
    if (totalAppointments > 0) {
      score = Math.max(
        0,
        Math.min(
          100,
          completionRate - noShows * 10 - lastMinuteCancellations * 5
        )
      );
    }

    const settings = await this.getSettings();
    let tier: ClientScore["tier"] = "RESTRICTED";

    if (score >= settings.scoringSystem.excellentThreshold) tier = "EXCELLENT";
    else if (score >= settings.scoringSystem.goodThreshold) tier = "GOOD";
    else if (score >= settings.scoringSystem.averageThreshold) tier = "AVERAGE";
    else if (score >= settings.scoringSystem.poorThreshold) tier = "POOR";

    return {
      score,
      totalAppointments,
      completedAppointments,
      noShows,
      lastMinuteCancellations,
      completionRate,
      tier,
    };
  }

  // Validate if client can book an appointment
  static async validateBooking(
    clientId: number,
    departmentId: number,
    appointmentDate: string,
    slotNumber: number
  ): Promise<BookingValidationResult> {
    const settings = await this.getSettings();
    const restrictions: string[] = [];
    const warnings: string[] = [];

    // Check active penalties
    const penaltyResult = await query(
      `
      SELECT penalty_type, penalty_date, penalty_duration_days 
      FROM client_penalties 
      WHERE client_id = $1 AND is_active = true 
      AND penalty_date + INTERVAL '1 day' * penalty_duration_days > CURRENT_DATE
    `,
      [clientId]
    );

    if (penaltyResult.rows.length > 0) {
      const penalty = penaltyResult.rows[0];
      const endDate = new Date(penalty.penalty_date);
      endDate.setDate(endDate.getDate() + penalty.penalty_duration_days);

      restrictions.push(
        `Account restricted until ${endDate.toLocaleDateString()} due to ${
          penalty.penalty_type
        }`
      );
      return {
        canBook: false,
        restrictions,
        warnings,
        penaltyEndDate: endDate.toISOString().split("T")[0],
      };
    }

    // Check booking time constraints
    const appointmentDateTime = new Date(appointmentDate);
    const now = new Date();
    const hoursUntilAppointment =
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilAppointment = Math.ceil(hoursUntilAppointment / 24);

    if (hoursUntilAppointment < settings.bookingLimits.minAdvanceHours) {
      restrictions.push(
        `Must book at least ${settings.bookingLimits.minAdvanceHours} hours in advance`
      );
    }

    if (daysUntilAppointment > settings.bookingLimits.maxFutureDays) {
      restrictions.push(
        `Cannot book more than ${settings.bookingLimits.maxFutureDays} days in advance`
      );
    }

    // Check same-day booking restrictions
    const isToday = appointmentDateTime.toDateString() === now.toDateString();
    if (isToday) {
      if (!settings.bookingLimits.allowSameDayBooking) {
        restrictions.push("Same-day booking is not allowed");
      } else {
        const currentHour = now.getHours();
        if (currentHour >= settings.bookingLimits.sameDayBookingCutoffHour) {
          const cutoffTime =
            settings.bookingLimits.sameDayBookingCutoffHour > 12
              ? `${settings.bookingLimits.sameDayBookingCutoffHour - 12} PM`
              : `${settings.bookingLimits.sameDayBookingCutoffHour} AM`;
          restrictions.push(
            `Same-day booking is not allowed after ${cutoffTime}`
          );
        }
      }
    }

    // Check existing appointments
    const existingAppointments = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments 
      WHERE client_id = $1 
      AND status NOT IN ('cancelled', 'completed', 'no_show')
    `,
      [clientId]
    );

    const pendingCount = parseInt(existingAppointments.rows[0].count);
    if (pendingCount >= settings.bookingLimits.maxPendingAppointments) {
      restrictions.push(
        `Maximum ${settings.bookingLimits.maxPendingAppointments} pending appointments allowed`
      );
    }

    // Check same-day appointments
    const sameDayAppointments = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments 
      WHERE client_id = $1 
      AND DATE(appointment_date) = DATE($2)
      AND status NOT IN ('cancelled', 'completed', 'no_show')
    `,
      [clientId, appointmentDate]
    );

    const sameDayCount = parseInt(sameDayAppointments.rows[0].count);
    if (sameDayCount >= settings.bookingLimits.maxDailyAppointments) {
      restrictions.push(
        `Maximum ${settings.bookingLimits.maxDailyAppointments} appointment(s) per day allowed`
      );
    }

    // Check same department appointments
    const sameDeptAppointments = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments 
      WHERE client_id = $1 
      AND department_id = $2
      AND status NOT IN ('cancelled', 'completed', 'no_show')
    `,
      [clientId, departmentId]
    );

    const sameDeptCount = parseInt(sameDeptAppointments.rows[0].count);
    if (sameDeptCount >= settings.bookingLimits.maxSameDeptPending) {
      restrictions.push(
        `Maximum ${settings.bookingLimits.maxSameDeptPending} pending appointment(s) per department allowed`
      );
    }

    // Get client score
    const clientScore = await this.calculateClientScore(clientId);

    // Add warnings based on client score
    if (clientScore.tier === "POOR") {
      warnings.push(
        "Your reliability score is low. Please attend scheduled appointments to improve it."
      );
    } else if (clientScore.tier === "AVERAGE") {
      warnings.push(
        "Consider improving your appointment attendance for better booking privileges."
      );
    }

    return {
      canBook: restrictions.length === 0,
      restrictions,
      warnings,
      clientScore: clientScore.score,
    };
  }

  // Apply penalty for no-show or abuse
  static async applyPenalty(
    clientId: number,
    penaltyType:
      | "no_show"
      | "late_cancel"
      | "multiple_booking"
      | "abuse_detected",
    reason?: string
  ): Promise<void> {
    const settings = await this.getSettings();

    if (
      !settings.noShowPenalties.autoApplyPenalties &&
      penaltyType === "no_show"
    ) {
      return; // Auto-penalties disabled
    }

    // Count recent penalties to determine escalation
    const recentPenalties = await query(
      `
      SELECT COUNT(*) as count
      FROM client_penalties 
      WHERE client_id = $1 
      AND penalty_type = $2
      AND penalty_date >= CURRENT_DATE - INTERVAL '30 days'
    `,
      [clientId, penaltyType]
    );

    const penaltyCount = parseInt(recentPenalties.rows[0].count);
    let penaltyDays = settings.noShowPenalties.firstOffenseDays;

    // Escalate penalty based on offense count
    if (penaltyCount >= 3) {
      penaltyDays = settings.noShowPenalties.chronicOffenderDays;
    } else if (penaltyCount === 2) {
      penaltyDays = settings.noShowPenalties.thirdOffenseDays;
    } else if (penaltyCount === 1) {
      penaltyDays = settings.noShowPenalties.secondOffenseDays;
    }

    // Apply penalty
    await query(
      `
      INSERT INTO client_penalties (client_id, penalty_type, penalty_date, penalty_duration_days, reason)
      VALUES ($1, $2, CURRENT_DATE, $3, $4)
    `,
      [
        clientId,
        penaltyType,
        penaltyDays,
        reason || `Automatic ${penaltyType} penalty`,
      ]
    );
  }
}
