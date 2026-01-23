import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Convex Actions
 * For operations that need to call external services (SMS, email, etc.)
 */

// ============= SMS ACTIONS =============

/**
 * Send SMS via Hubtel
 */
export const sendSMS = action({
  args: {
    to: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const hubtelClientId = process.env.HUBTEL_CLIENT_ID ?? "";
    const hubtelClientSecret = process.env.HUBTEL_CLIENT_SECRET ?? "";
    const hubtelSenderId = process.env.HUBTEL_SENDER_ID ?? "AGAHF";

    if (!hubtelClientId || !hubtelClientSecret) {
      console.warn("Hubtel credentials not configured, SMS not sent");
      return { success: false, message: "SMS service not configured" };
    }

    try {
      const response = await fetch("https://devapi.hubtel.com/v2/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(`${hubtelClientId}:${hubtelClientSecret}`).toString("base64"),
        },
        body: JSON.stringify({
          From: hubtelSenderId,
          To: args.to,
          Content: args.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Hubtel API error: ${JSON.stringify(data)}`);
      }

      return { success: true, data };
    } catch (error: any) {
      console.error("Failed to send SMS:", error);
      return { success: false, message: error.message };
    }
  },
});

/**
 * Send OTP via SMS
 */
export const sendOTPSMS = action({
  args: {
    identifier: v.string(),
    type: v.union(v.literal("client"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    // Call the mutation to generate and store OTP
    const result = await ctx.runMutation(api.auth.sendOTP, {
      identifier: args.identifier,
      type: args.type,
    });

    // In production, send SMS via Hubtel
    if (process.env.NODE_ENV === "production" && result.success) {
      // Get OTP from database (in production, we don't return it)
      const otpRecord = await ctx.runQuery(api.queries.getLatestOTP, {
        identifier: args.identifier,
      });

      if (otpRecord) {
        const message = `Your AGAHF verification code is: ${otpRecord.otp_code}. Valid for 10 minutes.`;
        
        // Get phone number based on type
        let phone = args.identifier;
        if (args.type === "client") {
          const client = await ctx.runQuery(api.queries.getClientByXNumber, {
            x_number: args.identifier,
          });
          phone = client?.phone || args.identifier;
        }

        await ctx.runAction(api.actions.sendSMS, {
          to: phone,
          message,
        });
      }
    }

    return result;
  },
});

/**
 * Send appointment confirmation SMS
 */
export const sendAppointmentConfirmationSMS = action({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const appointment = await ctx.runQuery(api.queries.getAppointmentWithDetails, {
      id: args.appointmentId,
    });

    if (!appointment || !appointment.client) {
      throw new Error("Appointment not found");
    }

    const message = `Your appointment at ${appointment.department?.name} on ${appointment.appointment_date} (Slot ${appointment.slot_number}) has been confirmed. AGAHF Hospital.`;

    const result = await ctx.runAction(api.actions.sendSMS, {
      to: appointment.client.phone,
      message,
    });

    return result;
  },
});

/**
 * Send appointment reminder SMS
 */
export const sendAppointmentReminderSMS = action({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const appointment = await ctx.runQuery(api.queries.getAppointmentWithDetails, {
      id: args.appointmentId,
    });

    if (!appointment || !appointment.client) {
      throw new Error("Appointment not found");
    }

    const message = `Reminder: You have an appointment at ${appointment.department?.name} tomorrow (Slot ${appointment.slot_number}). Please arrive 15 minutes early. AGAHF Hospital.`;

    const result = await ctx.runAction(api.actions.sendSMS, {
      to: appointment.client.phone,
      message,
    });

    return result;
  },
});

// ============= REPORT GENERATION ACTIONS =============

/**
 * Generate appointment report
 */
export const generateAppointmentReport = action({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const appointments = await ctx.runQuery(api.queries.getAppointments, {
      date: undefined,
      department_id: args.departmentId,
    });

    const filteredAppointments = appointments.filter(
      (apt) =>
        apt.appointment_date >= args.startDate && apt.appointment_date <= args.endDate
    );

    const reportData = {
      total: filteredAppointments.length,
      by_status: filteredAppointments.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_date: filteredAppointments.reduce((acc, apt) => {
        acc[apt.appointment_date] = (acc[apt.appointment_date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      appointments: filteredAppointments,
    };

    return reportData;
  },
});

// ============= DATA MIGRATION ACTIONS =============

/**
 * Seed initial data (for testing/setup)
 */
export const seedInitialData = action({
  args: {},
  handler: async (ctx, args) => {
    // Create default system settings
    const defaultSettings = [
      { key: "max_advance_booking_days", value: "14", description: "Maximum days in advance clients can book" },
      { key: "multiple_appointments_allowed", value: "false", description: "Allow clients to have multiple future appointments" },
      { key: "same_day_booking_allowed", value: "false", description: "Allow same-day appointment booking" },
      { key: "default_slots_per_day", value: "10", description: "Default number of slots per day" },
      { key: "session_duration_hours", value: "24", description: "User session duration in hours" },
    ];

    for (const setting of defaultSettings) {
      await ctx.runMutation(api.mutations.updateSystemSetting, {
        setting_key: setting.key,
        setting_value: setting.value,
        description: setting.description,
      });
    }

    // Create default appointment statuses
    const defaultStatuses = [
      { name: "booked", color: "#3B82F6" },
      { name: "arrived", color: "#10B981" },
      { name: "waiting", color: "#F59E0B" },
      { name: "completed", color: "#059669" },
      { name: "no_show", color: "#EF4444" },
      { name: "cancelled", color: "#6B7280" },
      { name: "rescheduled", color: "#8B5CF6" },
    ];

    for (const status of defaultStatuses) {
      await ctx.runMutation(api.mutations.createAppointmentStatus, {
        status_name: status.name,
        status_color: status.color,
      });
    }

    return { success: true, message: "Initial data seeded successfully" };
  },
});
