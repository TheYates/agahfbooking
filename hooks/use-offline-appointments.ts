"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOnlineStatus } from "@/hooks/use-pwa";
import {
  cacheAppointments,
  getCachedAppointments,
  processSyncQueue,
  clearExpiredCache,
} from "@/lib/offline-storage";
import { toast } from "sonner";

interface UseOfflineAppointmentsOptions {
  userId?: string;
  enabled?: boolean;
}

/**
 * Hook that provides offline-capable appointment fetching
 * Automatically caches appointments and serves from cache when offline
 */
export function useOfflineAppointments({
  userId,
  enabled = true,
}: UseOfflineAppointmentsOptions = {}) {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  // Fetch appointments with offline fallback
  const {
    data: appointments,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["appointments", "offline", userId],
    queryFn: async () => {
      if (isOnline) {
        // Fetch fresh data when online
        try {
          const response = await fetch(
            `/api/appointments${userId ? `?userId=${userId}` : ""}`
          );
          if (!response.ok) throw new Error("Failed to fetch appointments");

          const result = await response.json();
          const appointmentData = result.data || result.appointments || [];

          // Cache the fresh data
          await cacheAppointments(appointmentData, 120); // 2 hour TTL

          return appointmentData;
        } catch (error) {
          // If online fetch fails, try cache
          console.warn("Online fetch failed, trying cache:", error);
          const cached = await getCachedAppointments();
          if (cached.length > 0) {
            return cached;
          }
          throw error;
        }
      } else {
        // Return cached data when offline
        const cached = await getCachedAppointments();
        return cached;
      }
    },
    enabled: enabled,
    staleTime: isOnline ? 5 * 60 * 1000 : Infinity, // 5 min when online, never stale offline
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
  });

  // Process sync queue when coming back online
  useEffect(() => {
    if (isOnline) {
      processSyncQueue().then(({ success, failed }) => {
        if (success > 0) {
          toast.success(`Synced ${success} offline changes`);
          // Refetch to get fresh data
          refetch();
        }
        if (failed > 0) {
          toast.error(`Failed to sync ${failed} changes`);
        }
      });

      // Clear expired cache entries
      clearExpiredCache();
    }
  }, [isOnline, refetch]);

  // Prefetch and cache appointments for offline use
  const prefetchForOffline = useCallback(async () => {
    if (!isOnline) return;

    try {
      const response = await fetch(
        `/api/appointments${userId ? `?userId=${userId}` : ""}`
      );
      if (response.ok) {
        const result = await response.json();
        const appointmentData = result.data || result.appointments || [];
        await cacheAppointments(appointmentData, 120);
        toast.success("Appointments cached for offline use");
      }
    } catch (error) {
      console.error("Failed to prefetch appointments:", error);
    }
  }, [isOnline, userId]);

  return {
    appointments: appointments || [],
    isLoading,
    error,
    isOnline,
    isFromCache: !isOnline,
    refetch,
    prefetchForOffline,
  };
}

/**
 * Hook to sync offline changes when back online
 */
export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  const syncNow = useCallback(async () => {
    if (!isOnline) {
      toast.error("Cannot sync while offline");
      return { success: 0, failed: 0 };
    }

    const result = await processSyncQueue();

    if (result.success > 0) {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }

    return result;
  }, [isOnline, queryClient]);

  return {
    isOnline,
    syncNow,
  };
}
