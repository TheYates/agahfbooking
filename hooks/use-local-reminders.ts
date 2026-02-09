"use client";

import { useCallback } from "react";
import {
  LocalReminder,
  storeLocalReminders,
  getLocalReminders,
  clearLocalReminders,
} from "@/lib/offline-storage";

interface ScheduleReminderInput {
  appointmentId: string | number;
  title: string;
  body: string;
  scheduledAt: Date;
}

const isNotificationSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

const isServiceWorkerSupported = () =>
  typeof navigator !== "undefined" && "serviceWorker" in navigator;

export function useLocalReminders() {
  const scheduleLocalReminder = useCallback(
    async ({ appointmentId, title, body, scheduledAt }: ScheduleReminderInput) => {
      if (!isNotificationSupported() || !isServiceWorkerSupported()) return false;

      const registration = await navigator.serviceWorker.ready;
      const timeUntil = scheduledAt.getTime() - Date.now();

      const reminder: LocalReminder = {
        id: `${appointmentId}-${scheduledAt.getTime()}`,
        appointmentId,
        title,
        body,
        scheduledAt: scheduledAt.getTime(),
        createdAt: Date.now(),
      };

      await storeLocalReminders([reminder]);

      if (timeUntil <= 0) {
        await registration.showNotification(title, {
          body,
          tag: `appointment-${appointmentId}`,
          data: { appointmentId, type: "appointment_reminder" },
        });
        return true;
      }

      setTimeout(() => {
        registration.showNotification(title, {
          body,
          tag: `appointment-${appointmentId}`,
          data: { appointmentId, type: "appointment_reminder" },
        });
      }, timeUntil);

      return true;
    },
    []
  );

  const scheduleMultipleLocalReminders = useCallback(
    async (reminders: ScheduleReminderInput[]) => {
      for (const reminder of reminders) {
        await scheduleLocalReminder(reminder);
      }
    },
    [scheduleLocalReminder]
  );

  const getScheduledReminders = useCallback(
    async (appointmentId?: string | number) => {
      return getLocalReminders(appointmentId);
    },
    []
  );

  const clearScheduledReminders = useCallback(
    async (appointmentId?: string | number) => {
      await clearLocalReminders(appointmentId);
    },
    []
  );

  return {
    scheduleLocalReminder,
    scheduleMultipleLocalReminders,
    getScheduledReminders,
    clearScheduledReminders,
  };
}
