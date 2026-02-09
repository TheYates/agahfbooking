/**
 * Unified Notification Service
 *
 * Sends notifications via multiple channels (SMS + Push) and logs all attempts.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hubtelSMS } from "@/lib/hubtel-sms";
import {
  sendPushNotification,
  isPushConfigured,
  NotificationTemplates,
  type PushNotificationPayload,
} from "@/lib/push-notification-service";
import { formatSlotTimeRange } from "@/lib/slot-time-utils";
import type { NotificationEventType } from "@/lib/db-types";

export interface NotificationResult {
  sms: { sent: boolean; error?: string };
  push: { sent: number; failed: number };
  logged: boolean;
}

interface AppointmentDetails {
  id: number;
  client_id: number;
  department_id: number;
  appointment_date: string;
  slot_number: number;
  slot_start_time: string | null;
  slot_end_time: string | null;
  clients?: {
    id: number;
    name: string;
    phone: string;
    x_number: string;
  };
  departments?: {
    id: number;
    name: string;
  };
}

/**
 * Log notification attempt to database
 */
async function logNotification(
  appointmentId: number | null,
  clientId: number,
  notificationType: "sms" | "push",
  eventType: NotificationEventType,
  recipientContact: string,
  status: "sent" | "failed",
  messageContent?: string,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();

    await supabase.from("notification_log").insert({
      appointment_id: appointmentId,
      client_id: clientId,
      notification_type: notificationType,
      event_type: eventType,
      recipient_contact: recipientContact,
      message_content: messageContent,
      status,
      error_message: errorMessage,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error("Failed to log notification:", error);
  }
}

/**
 * Create in-app notification for user
 */
async function createInAppNotification(
  userId: number,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error",
  eventType: NotificationEventType,
  appointmentId?: number | null,
  actionUrl?: string
): Promise<void> {
  try {
    console.log('[createInAppNotification] Creating notification for userId:', userId);
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.from("in_app_notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      event_type: eventType,
      related_appointment_id: appointmentId ?? null,
      action_url: actionUrl ?? null,
    }).select();

    if (error) {
      console.error('[createInAppNotification] Database error:', error);
      throw error;
    }

    console.log('[createInAppNotification] Successfully created notification:', data);
  } catch (error) {
    console.error("Failed to create in-app notification:", error);
  }
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get slot time display
 */
function getSlotTimeDisplay(appointment: AppointmentDetails): string {
  if (appointment.slot_start_time && appointment.slot_end_time) {
    return formatSlotTimeRange(appointment.slot_start_time, appointment.slot_end_time);
  }
  return `Slot ${appointment.slot_number}`;
}

/**
 * Send booking confirmation notification (when appointment is confirmed/booked)
 */
export async function sendBookingConfirmation(
  appointment: AppointmentDetails
): Promise<NotificationResult> {
  const result: NotificationResult = {
    sms: { sent: false },
    push: { sent: 0, failed: 0 },
    logged: false,
  };

  if (!appointment.clients || !appointment.departments) {
    console.error("Missing client or department info for notification");
    return result;
  }

  const clientPhone = appointment.clients.phone;
  const clientId = appointment.client_id;
  const departmentName = appointment.departments.name;
  const date = formatDate(appointment.appointment_date);
  const time = getSlotTimeDisplay(appointment);

  // Create in-app notification
  await createInAppNotification(
    clientId,
    "Appointment Confirmed! 🎉",
    `Your ${departmentName} appointment is confirmed for ${date} at ${time}.`,
    "success",
    "booking_confirmation",
    appointment.id,
    "/dashboard/my-appointments"
  );

  // Send SMS
  try {
    const smsResult = await hubtelSMS.sendAppointmentConfirmation(clientPhone, {
      date,
      time,
      department: departmentName,
    });

    result.sms.sent = smsResult.status === "success";
    if (!result.sms.sent) {
      result.sms.error = smsResult.message;
    }

    await logNotification(
      appointment.id,
      clientId,
      "sms",
      "booking_confirmation",
      clientPhone,
      result.sms.sent ? "sent" : "failed",
      `Appointment confirmed for ${date} at ${time} in ${departmentName}`,
      result.sms.error
    );
  } catch (error) {
    result.sms.error = error instanceof Error ? error.message : "SMS failed";
    await logNotification(
      appointment.id,
      clientId,
      "sms",
      "booking_confirmation",
      clientPhone,
      "failed",
      undefined,
      result.sms.error
    );
  }

  // Send Push notification
  if (isPushConfigured()) {
    try {
      const pushPayload = NotificationTemplates.appointmentConfirmed(
        departmentName,
        date,
        time
      );
      const pushResult = await sendPushNotification(clientId, pushPayload);
      result.push = pushResult;

      if (pushResult.sent > 0) {
        await logNotification(
          appointment.id,
          clientId,
          "push",
          "booking_confirmation",
          `${pushResult.sent} devices`,
          "sent",
          pushPayload.body
        );
      }
    } catch (error) {
      console.error("Push notification failed:", error);
    }
  }

  result.logged = true;
  return result;
}

/**
 * Send reschedule request notification (when reviewer asks client to reschedule)
 */
export async function sendRescheduleRequestNotification(
  appointment: AppointmentDetails,
  reason: string
): Promise<NotificationResult> {
  const result: NotificationResult = {
    sms: { sent: false },
    push: { sent: 0, failed: 0 },
    logged: false,
  };

  if (!appointment.clients || !appointment.departments) {
    console.error("Missing client or department info for notification");
    return result;
  }

  const clientPhone = appointment.clients.phone;
  const clientId = appointment.client_id;
  const departmentName = appointment.departments.name;
  const date = formatDate(appointment.appointment_date);

  const smsMessage = `AGAHF Hospital: Please reschedule your ${departmentName} appointment on ${date}. Reason: ${reason}. Log in to the booking system to select a new time.`;

  // Create in-app notification
  await createInAppNotification(
    clientId,
    "Reschedule Request",
    `Your ${departmentName} appointment for ${date} needs to be rescheduled. Reason: ${reason}`,
    "warning",
    "reschedule_request",
    appointment.id,
    "/dashboard/my-appointments"
  );

  // Send SMS
  try {
    const smsResult = await hubtelSMS.sendSMS({
      to: clientPhone,
      message: smsMessage,
    });

    result.sms.sent = smsResult.status === "success";
    if (!result.sms.sent) {
      result.sms.error = smsResult.message;
    }

    await logNotification(
      appointment.id,
      clientId,
      "sms",
      "reschedule_request",
      clientPhone,
      result.sms.sent ? "sent" : "failed",
      smsMessage,
      result.sms.error
    );
  } catch (error) {
    result.sms.error = error instanceof Error ? error.message : "SMS failed";
  }

  // Send Push notification
  if (isPushConfigured()) {
    try {
      const pushPayload = NotificationTemplates.rescheduleRequested(departmentName, reason);
      const pushResult = await sendPushNotification(clientId, pushPayload);
      result.push = pushResult;

      if (pushResult.sent > 0) {
        await logNotification(
          appointment.id,
          clientId,
          "push",
          "reschedule_request",
          `${pushResult.sent} devices`,
          "sent",
          pushPayload.body
        );
      }
    } catch (error) {
      console.error("Push notification failed:", error);
    }
  }

  result.logged = true;
  return result;
}

/**
 * Send notification when appointment is rescheduled
 */
export async function sendRescheduleCompletedNotification(
  oldAppointment: AppointmentDetails,
  newAppointment: AppointmentDetails
): Promise<NotificationResult> {
  const result: NotificationResult = {
    sms: { sent: false },
    push: { sent: 0, failed: 0 },
    logged: false,
  };

  if (!newAppointment.clients || !newAppointment.departments) {
    console.error("Missing client or department info for notification");
    return result;
  }

  const clientPhone = newAppointment.clients.phone;
  const clientId = newAppointment.client_id;
  const departmentName = newAppointment.departments.name;
  const oldDate = formatDate(oldAppointment.appointment_date);
  const newDate = formatDate(newAppointment.appointment_date);
  const newTime = getSlotTimeDisplay(newAppointment);

  const smsMessage = `AGAHF Hospital: Your ${departmentName} appointment has been rescheduled from ${oldDate} to ${newDate} at ${newTime}. Please arrive 15 minutes early.`;

  // Create in-app notification
  await createInAppNotification(
    clientId,
    "Appointment Rescheduled",
    `Your ${departmentName} appointment has been rescheduled to ${newDate} at ${newTime}.`,
    "info",
    "rescheduled",
    newAppointment.id,
    "/dashboard/my-appointments"
  );

  // Send SMS
  try {
    const smsResult = await hubtelSMS.sendSMS({
      to: clientPhone,
      message: smsMessage,
    });

    result.sms.sent = smsResult.status === "success";
    if (!result.sms.sent) {
      result.sms.error = smsResult.message;
    }

    await logNotification(
      newAppointment.id,
      clientId,
      "sms",
      "reschedule_completed",
      clientPhone,
      result.sms.sent ? "sent" : "failed",
      smsMessage,
      result.sms.error
    );
  } catch (error) {
    result.sms.error = error instanceof Error ? error.message : "SMS failed";
  }

  // Send Push notification
  if (isPushConfigured()) {
    try {
      const pushPayload = NotificationTemplates.appointmentRescheduled(
        departmentName,
        oldDate,
        newDate,
        newTime
      );
      const pushResult = await sendPushNotification(clientId, pushPayload);
      result.push = pushResult;

      if (pushResult.sent > 0) {
        await logNotification(
          newAppointment.id,
          clientId,
          "push",
          "reschedule_completed",
          `${pushResult.sent} devices`,
          "sent",
          pushPayload.body
        );
      }
    } catch (error) {
      console.error("Push notification failed:", error);
    }
  }

  result.logged = true;
  return result;
}

/**
 * Send review confirmed notification (when pending_review becomes booked)
 */
export async function sendReviewConfirmedNotification(
  appointment: AppointmentDetails
): Promise<NotificationResult> {
  // Use the same as booking confirmation
  return sendBookingConfirmation(appointment);
}

/**
 * Fetch appointment with client and department details for notifications
 */
export async function fetchAppointmentForNotification(
  appointmentId: number
): Promise<AppointmentDetails | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      clients (id, name, phone, x_number),
      departments (id, name)
    `)
    .eq("id", appointmentId)
    .single();

  if (error || !data) {
    console.error("Failed to fetch appointment for notification:", error);
    return null;
  }

  return data as AppointmentDetails;
}
