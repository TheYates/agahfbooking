"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseServerRealtimeOptions {
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
   * Filter to apply (uses Supabase filter syntax)
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
   * Auto-reconnect on connection loss
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Reconnect delay in milliseconds
   * @default 5000
   */
  reconnectDelay?: number;

  /**
   * Maximum number of reconnection attempts
   * @default 10
   */
  maxReconnectAttempts?: number;
}

interface ConnectionState {
  status: "connecting" | "connected" | "disconnected" | "error";
  reconnectAttempts: number;
  lastEventAt?: Date;
}

/**
 * Client-side hook for server-sent events (SSE) realtime subscriptions.
 *
 * This hook connects to the server-side SSE endpoint which uses the service role key
 * to subscribe to Supabase realtime, bypassing RLS policies. This allows for:
 * - Complex server-side filtering
 * - Enhanced privacy (sensitive data filtered on server)
 * - Better performance for large datasets
 * - Role-based access control
 *
 * @example
 * // Listen to appointments for a specific client
 * useServerRealtime({
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
 * // Listen to all departments
 * useServerRealtime({
 *   table: 'departments',
 *   queryKey: ['departments', 'all'],
 *   onUpdate: (payload) => {
 *     console.log('Department changed:', payload)
 *   },
 * })
 */
export function useServerRealtime(options: UseServerRealtimeOptions) {
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
    autoReconnect = true,
    reconnectDelay = 5000,
    maxReconnectAttempts = 10,
  } = options;

  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: "disconnected",
    reconnectAttempts: 0,
  });

  const connect = useCallback(() => {
    if (!enabled) return;

    // Build URL with query parameters
    const params = new URLSearchParams();
    params.set("table", table);
    if (filter) params.set("filter", filter);
    if (event !== "*") params.set("event", event);

    const url = `/api/realtime?${params.toString()}`;

    if (debug) {
      console.log(`[SSE] Connecting to ${url}`);
    }

    setConnectionState((prev) => ({
      ...prev,
      status: "connecting",
    }));

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      if (debug) {
        console.log(`[SSE] Connection opened for ${table}`);
      }
      setConnectionState({
        status: "connected",
        reconnectAttempts: 0,
      });
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (debug) {
          console.log(`[SSE] Received event:`, data);
        }

        // Handle connection events
        if (data.type === "connected") {
          if (debug) {
            console.log(`[SSE] Connected with ID: ${data.connectionId}`);
          }
          return;
        }

        if (data.type === "subscribed") {
          if (debug) {
            console.log(`[SSE] Subscribed to ${data.table}`);
          }
          return;
        }

        if (data.type === "error") {
          console.error(`[SSE] Server error:`, data.message);
          setConnectionState((prev) => ({
            ...prev,
            status: "error",
          }));
          return;
        }

        // Handle data changes
        if (data.type === "change") {
          setConnectionState((prev) => ({
            ...prev,
            lastEventAt: new Date(),
          }));

          // Invalidate React Query cache to trigger refetch
          queryClient.invalidateQueries({ queryKey });

          // Call custom callback if provided
          if (optionsRef.current.onUpdate) {
            optionsRef.current.onUpdate(data);
          }

          // Show toast notifications if enabled
          if (showToasts) {
            const messages = toastMessages || {
              insert: "New record added",
              update: "Record updated",
              delete: "Record deleted",
            };

            if (data.eventType === "INSERT" && messages.insert) {
              toast.success(messages.insert);
            } else if (data.eventType === "UPDATE" && messages.update) {
              toast.info(messages.update);
            } else if (data.eventType === "DELETE" && messages.delete) {
              toast.info(messages.delete);
            }
          }
        }
      } catch (error) {
        console.error("[SSE] Error parsing message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error(`[SSE] Connection error for ${table}:`, error);

      setConnectionState((prev) => ({
        ...prev,
        status: "error",
      }));

      eventSource.close();

      // Attempt reconnection if enabled
      if (autoReconnect && connectionState.reconnectAttempts < maxReconnectAttempts) {
        const nextAttempt = connectionState.reconnectAttempts + 1;
        
        if (debug) {
          console.log(`[SSE] Reconnecting in ${reconnectDelay}ms (attempt ${nextAttempt}/${maxReconnectAttempts})`);
        }

        setConnectionState((prev) => ({
          ...prev,
          reconnectAttempts: nextAttempt,
        }));

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      } else if (connectionState.reconnectAttempts >= maxReconnectAttempts) {
        console.error(`[SSE] Max reconnection attempts reached for ${table}`);
        setConnectionState((prev) => ({
          ...prev,
          status: "disconnected",
        }));
        
        if (showToasts) {
          toast.error("Realtime connection failed", {
            description: "Falling back to periodic polling.",
          });
        }
      }
    };
  }, [
    table,
    filter,
    event,
    enabled,
    debug,
    autoReconnect,
    reconnectDelay,
    maxReconnectAttempts,
    showToasts,
    toastMessages,
    queryKey,
    queryClient,
    showToasts,
    connectionState.reconnectAttempts,
  ]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnectionState((prev) => ({
      ...prev,
      status: "disconnected",
    }));
  }, []);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    disconnect();
    setConnectionState((prev) => ({
      ...prev,
      reconnectAttempts: 0,
    }));
    connect();
  }, [disconnect, connect]);

  return {
    connectionState,
    reconnect,
    disconnect,
    connect,
    isConnected: connectionState.status === "connected",
    isConnecting: connectionState.status === "connecting",
    isError: connectionState.status === "error",
  };
}

/**
 * Hook specifically for appointments using server-side realtime
 */
export function useAppointmentsServerRealtime(options: {
  clientId?: number;
  queryKey: any[];
  enabled?: boolean;
  showToasts?: boolean;
  onUpdate?: (payload: any) => void;
}) {
  return useServerRealtime({
    table: "appointments",
    filter: options.clientId ? `client_id=eq.${options.clientId}` : undefined,
    queryKey: options.queryKey,
    enabled: options.enabled,
    showToasts: options.showToasts ?? true,
    onUpdate: options.onUpdate,
    toastMessages: {
      insert: "New appointment booked!",
      update: "Appointment updated!",
      delete: "Appointment cancelled!",
    },
  });
}

/**
 * Hook specifically for notifications using server-side realtime
 */
export function useNotificationsServerRealtime(options: {
  userId?: number;
  queryKey: any[];
  enabled?: boolean;
  showToasts?: boolean;
  onUpdate?: (payload: any) => void;
}) {
  return useServerRealtime({
    table: "in_app_notifications",
    filter: options.userId ? `user_id=eq.${options.userId}` : undefined,
    queryKey: options.queryKey,
    enabled: options.enabled,
    showToasts: options.showToasts ?? true,
    onUpdate: options.onUpdate,
    toastMessages: {
      insert: "New notification!",
    },
  });
}

/**
 * Hook specifically for departments using server-side realtime
 */
export function useDepartmentsServerRealtime(options: {
  queryKey: any[];
  enabled?: boolean;
  showToasts?: boolean;
  onUpdate?: (payload: any) => void;
}) {
  return useServerRealtime({
    table: "departments",
    queryKey: options.queryKey,
    enabled: options.enabled,
    showToasts: options.showToasts ?? false,
    onUpdate: options.onUpdate,
    toastMessages: {
      insert: "New department created!",
      update: "Department updated!",
      delete: "Department deleted!",
    },
  });
}
