"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

interface UseSupabaseRealtimeOptions {
  /**
   * The database table to listen to
   * @example 'appointments'
   */
  table: string;

  /**
   * The query key to invalidate when changes occur
   * @example ['appointments', 'client', 123]
   */
  queryKey: any[];

  /**
   * Supabase filter to apply
   * @example 'client_id=eq.123'
   */
  filter?: string;

  /**
   * Which events to listen for
   * @default '*' (all events: INSERT, UPDATE, DELETE)
   */
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";

  /**
   * Enable/disable the subscription
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when an event is received
   */
  onUpdate?: (payload: any) => void;

  /**
   * Show toast notifications for events
   * @default false
   */
  showToasts?: boolean;

  /**
   * Custom toast messages
   */
  toastMessages?: {
    insert?: string;
    update?: string;
    delete?: string;
  };

  /**
   * Debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Custom channel name (auto-generated if not provided)
   */
  channelName?: string;
}

/**
 * Reusable hook for Supabase Realtime subscriptions
 *
 * This hook automatically subscribes to database changes and invalidates React Query cache,
 * providing instant updates across your application.
 *
 * @example
 * // Listen to all appointments for a specific client
 * useSupabaseRealtime({
 *   table: 'appointments',
 *   filter: 'client_id=eq.123',
 *   queryKey: ['appointments', 'client', 123],
 *   showToasts: true,
 *   toastMessages: {
 *     insert: 'New appointment booked!',
 *     update: 'Appointment updated!',
 *   },
 * })
 *
 * @example
 * // Listen to all department changes
 * useSupabaseRealtime({
 *   table: 'departments',
 *   queryKey: ['departments', 'all'],
 *   onUpdate: (payload) => {
 *     console.log('Department changed:', payload)
 *   },
 * })
 *
 * @example
 * // Listen with custom logic
 * useSupabaseRealtime({
 *   table: 'appointments',
 *   filter: 'status=eq.scheduled',
 *   queryKey: ['appointments', 'scheduled'],
 *   event: 'UPDATE',
 *   onUpdate: (payload) => {
 *     playNotificationSound()
 *     sendPushNotification()
 *   },
 * })
 */
export function useSupabaseRealtime(options: UseSupabaseRealtimeOptions) {
  const {
    table,
    queryKey,
    filter,
    event = "*",
    enabled = true,
    onUpdate,
    showToasts = false,
    toastMessages,
    debug = false,
    channelName,
  } = options;

  const queryClient = useQueryClient();
  const supabase = createBrowserSupabaseClient();

  // Use ref to avoid recreating subscription on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!enabled) return;

    // Generate channel name if not provided
    const channel =
      channelName || `realtime-${table}-${filter || "all"}-${Date.now()}`;

    const subscription = supabase
      .channel(channel)
      .on(
        "postgres_changes",
        {
          event,
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          if (debug) {
            console.log(
              `🔥 [Realtime] ${table} ${payload.eventType}:`,
              payload,
            );
          }

          // Invalidate React Query cache to trigger refetch
          queryClient.invalidateQueries({ queryKey });

          // Call custom callback if provided
          if (optionsRef.current.onUpdate) {
            optionsRef.current.onUpdate(payload);
          }

          // Show toast notifications if enabled
          if (showToasts) {
            const messages = toastMessages || {
              insert: "New record added",
              update: "Record updated",
              delete: "Record deleted",
            };

            if (payload.eventType === "INSERT" && messages.insert) {
              toast.success(messages.insert);
            } else if (payload.eventType === "UPDATE" && messages.update) {
              toast.info(messages.update);
            } else if (payload.eventType === "DELETE" && messages.delete) {
              toast.info(messages.delete);
            }
          }
        },
      )
      .subscribe((status) => {
        if (debug) {
          console.log(`📡 [Realtime] ${table} subscription status:`, status);
        }

        if (status === "SUBSCRIBED") {
          if (debug) {
            console.log(`✅ [Realtime] ${table} subscription active`);
          }
} else if (status === "CHANNEL_ERROR") {
          console.warn(`⚠️ [Realtime] ${table} subscription failed - using polling fallback`);
} else if (status === "TIMED_OUT") {
          console.warn(`⏱️ [Realtime] ${table} subscription timed out`);
        }
      });

    // Cleanup on unmount or when dependencies change
    return () => {
      if (debug) {
        console.log(`🧹 [Realtime] Cleaning up ${table} subscription`);
      }
      supabase.removeChannel(subscription);
    };
  }, [
    enabled,
    table,
    filter,
    event,
    queryKey.join("-"), // Serialize array to string for dependency
    debug,
    channelName,
    showToasts,
    queryClient,
    supabase,
  ]);

  // Could be extended to return connection status, error state, etc.
  return {
    // Future: isConnected, connectionStatus, error, retry, etc.
  };
}

/**
 * Hook specifically for appointments realtime with sensible defaults
 *
 * @example
 * useAppointmentsRealtime({
 *   clientId: 123,
 *   queryKey: ['appointments', 'client', 123],
 * })
 */
export function useAppointmentsRealtime(options: {
  clientId?: number;
  queryKey: any[];
  enabled?: boolean;
  showToasts?: boolean;
}) {
  return useSupabaseRealtime({
    table: "appointments",
    filter: options.clientId ? `client_id=eq.${options.clientId}` : undefined,
    queryKey: options.queryKey,
    enabled: options.enabled,
    showToasts: options.showToasts ?? true,
    toastMessages: {
      insert: "New appointment booked!",
      update: "Appointment updated!",
      delete: "Appointment cancelled!",
    },
  });
}

/**
 * Hook specifically for departments realtime with sensible defaults
 */
export function useDepartmentsRealtime(options: {
  queryKey: any[];
  enabled?: boolean;
  showToasts?: boolean;
}) {
  return useSupabaseRealtime({
    table: "departments",
    queryKey: options.queryKey,
    enabled: options.enabled,
    showToasts: options.showToasts ?? false,
    toastMessages: {
      insert: "New department created!",
      update: "Department updated!",
      delete: "Department deleted!",
    },
  });
}

/**
 * Hook specifically for users realtime with sensible defaults
 */
export function useUsersRealtime(options: {
  queryKey: any[];
  enabled?: boolean;
  showToasts?: boolean;
}) {
  return useSupabaseRealtime({
    table: "users",
    queryKey: options.queryKey,
    enabled: options.enabled,
    showToasts: options.showToasts ?? false,
    toastMessages: {
      insert: "New user created!",
      update: "User updated!",
      delete: "User deleted!",
    },
  });
}
