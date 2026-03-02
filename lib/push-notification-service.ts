/**
 * Push Notification Service
 *
 * Sends web push notifications to subscribed clients using the web-push library.
 */

import webpush from "web-push";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Configure VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@agahfhospital.com";

// Initialize web-push with VAPID details
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string }>;
}

export interface PushResult {
  success: boolean;
  endpoint: string;
  error?: string;
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(vapidPublicKey && vapidPrivateKey);
}

/**
 * Send push notification to a specific subscription
 */
async function sendToSubscription(
  subscription: webpush.PushSubscription,
  payload: PushNotificationPayload
): Promise<PushResult> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true, endpoint: subscription.endpoint };
  } catch (error: any) {
    // Handle expired/invalid subscriptions (410 Gone)
    if (error.statusCode === 410 || error.statusCode === 404) {
      return {
        success: false,
        endpoint: subscription.endpoint,
        error: "subscription_expired",
      };
    }
    return {
      success: false,
      endpoint: subscription.endpoint,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Send push notification to a user (client) by their ID
 * Sends to all their subscribed devices
 */
export async function sendPushNotification(
  userId: string | number,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; expired: string[] }> {
  if (!isPushConfigured()) {
    console.warn("Push notifications not configured. Skipping.");
    return { sent: 0, failed: 0, expired: [] };
  }

  const supabase = await createServerSupabaseClient();

  // Fetch all subscriptions for this user
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, subscription")
    .eq("user_id", userId.toString());

  if (error) {
    console.error("Error fetching push subscriptions:", error);
    return { sent: 0, failed: 1, expired: [] };
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log(`No push subscriptions found for user ${userId}`);
    return { sent: 0, failed: 0, expired: [] };
  }

  let sent = 0;
  let failed = 0;
  const expired: string[] = [];

  // Send to all subscriptions
  for (const sub of subscriptions) {
    try {
      const subscription = sub.subscription as webpush.PushSubscription;
      const result = await sendToSubscription(subscription, payload);

      if (result.success) {
        sent++;
      } else if (result.error === "subscription_expired") {
        expired.push(sub.endpoint);
        // Remove expired subscription
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        failed++;
        console.error(`Push failed for endpoint ${sub.endpoint}:`, result.error);
      }
    } catch (error) {
      failed++;
      console.error("Error sending push notification:", error);
    }
  }

  if (expired.length > 0) {
    console.log(`Removed ${expired.length} expired push subscriptions for user ${userId}`);
  }

  return { sent, failed, expired };
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationBulk(
  userIds: (string | number)[],
  payload: PushNotificationPayload
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { totalSent, totalFailed };
}

/**
 * Create standard notification payloads for common events
 */
export const NotificationTemplates = {
  appointmentConfirmed: (
    departmentName: string,
    date: string,
    time: string
  ): PushNotificationPayload => ({
    title: "Appointment Confirmed",
    body: `Your ${departmentName} appointment on ${date} at ${time} has been confirmed.`,
    icon: "/icons/icon-192x192.png",
    tag: "appointment-confirmed",
    data: { type: "appointment_confirmed" },
  }),

  rescheduleRequested: (
    departmentName: string,
    reason: string
  ): PushNotificationPayload => ({
    title: "Reschedule Requested",
    body: `Please reschedule your ${departmentName} appointment. Reason: ${reason}`,
    icon: "/icons/icon-192x192.png",
    tag: "reschedule-requested",
    data: { type: "reschedule_requested" },
    actions: [{ action: "reschedule", title: "Reschedule Now" }],
  }),

  appointmentRescheduled: (
    departmentName: string,
    oldDate: string,
    newDate: string,
    newTime: string
  ): PushNotificationPayload => ({
    title: "Appointment Rescheduled",
    body: `Your ${departmentName} appointment has been moved from ${oldDate} to ${newDate} at ${newTime}.`,
    icon: "/icons/icon-192x192.png",
    tag: "appointment-rescheduled",
    data: { type: "appointment_rescheduled" },
  }),

  appointmentReminder: (
    departmentName: string,
    date: string,
    time: string
  ): PushNotificationPayload => ({
    title: "Appointment Reminder",
    body: `Reminder: You have a ${departmentName} appointment tomorrow (${date}) at ${time}.`,
    icon: "/icons/icon-192x192.png",
    tag: "appointment-reminder",
    data: { type: "appointment_reminder" },
  }),

  bookingReceived: (
    departmentName: string,
    date: string,
    time: string
  ): PushNotificationPayload => ({
    title: "Booking Received",
    body: `Your ${departmentName} appointment request for ${date} at ${time} is pending review.`,
    icon: "/icons/icon-192x192.png",
    tag: "booking-received",
    data: { type: "booking_received" },
  }),
};
