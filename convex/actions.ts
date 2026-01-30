// @ts-nocheck

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// NOTE: This file is legacy Convex code and is intentionally excluded from the
// Supabase-migrated runtime path. It is kept for reference until Phase 5.

export const sendAppointmentReminderSMS = action({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    // Get appointment details
    const appointment = await ctx.runQuery(api.queries.getAppointmentById, {
      id: args.appointmentId,
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Get client details
    const client = await ctx.runQuery(api.queries.getClientById, {
      id: appointment.clientId,
    });

    if (!client) {
      throw new Error("Client not found");
    }

    // Send SMS reminder
    const result = await ctx.runAction(api.actions.sendSMS, {
      to: client.phone,
      message: `Reminder: You have an appointment on ${appointment.date} at slot ${appointment.slotNumber}.`,
    });

    return result;
  },
});

export const generateAppointmentReport = action({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const appointments = await ctx.runQuery(api.queries.getAppointmentsByDateRange, {
      startDate: args.startDate,
      endDate: args.endDate,
    });

    // Simple aggregation
    const reportData = appointments.reduce(
      (acc: any, apt: any) => {
        acc.total++;
        acc.byStatus[apt.status] = (acc.byStatus[apt.status] || 0) + 1;
        return acc;
      },
      { total: 0, byStatus: {} as Record<string, number> }
    );

    return reportData;
  },
});
