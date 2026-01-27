"use client";

import { useState, useEffect, useCallback } from "react";

// VAPID public key - you need to generate this and set in env
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Convert URL-safe base64 to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    subscription: null,
    isLoading: false,
    error: null,
  });

  // Check support and current permission on mount
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

      if (!isSupported) {
        setState((prev) => ({ ...prev, isSupported: false }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission,
      }));

      // Get existing subscription
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setState((prev) => ({ ...prev, subscription }));
      } catch (error) {
        console.error("Failed to get push subscription:", error);
      }
    };

    checkSupport();
  }, []);

  /**
   * Request permission and subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    if (!state.isSupported || !VAPID_PUBLIC_KEY) {
      setState((prev) => ({
        ...prev,
        error: !VAPID_PUBLIC_KEY
          ? "Push notifications not configured"
          : "Push notifications not supported",
      }));
      return null;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Notification permission denied",
        }));
        return null;
      }

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription on server");
      }

      setState((prev) => ({ ...prev, subscription, isLoading: false }));
      return subscription;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to subscribe";
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return null;
    }
  }, [state.isSupported]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return true;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Unsubscribe from push manager
      await state.subscription.unsubscribe();

      // Remove subscription from server
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: state.subscription.endpoint }),
      });

      setState((prev) => ({
        ...prev,
        subscription: null,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to unsubscribe";
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return false;
    }
  }, [state.subscription]);

  /**
   * Send a local notification (for testing)
   */
  const sendLocalNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (state.permission !== "granted") {
        console.warn("Notification permission not granted");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          ...options,
        });
      } catch (error) {
        console.error("Failed to show notification:", error);
      }
    },
    [state.permission]
  );

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  };
}

/**
 * Schedule a notification for an appointment reminder
 */
export async function scheduleAppointmentReminder(
  appointmentId: string,
  title: string,
  body: string,
  scheduledTime: Date
) {
  try {
    const response = await fetch("/api/push/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId,
        title,
        body,
        scheduledTime: scheduledTime.toISOString(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to schedule reminder:", error);
    return false;
  }
}
