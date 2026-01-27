"use client";

import { useEffect } from "react";
import { InstallPromptBanner } from "./install-prompt-banner";
import { OfflineIndicator } from "./offline-indicator";
import { NotificationPrompt } from "./notification-prompt";
import { useOnlineStatus } from "@/hooks/use-pwa";
import { processSyncQueue, clearExpiredCache } from "@/lib/offline-storage";
import { toast } from "sonner";

interface PWAProviderProps {
  children: React.ReactNode;
  enableInstallPrompt?: boolean;
  enableNotificationPrompt?: boolean;
  enableOfflineIndicator?: boolean;
}

/**
 * PWA Provider Component
 * Wraps the app with PWA features like install prompts, offline indicators, and notifications
 */
export function PWAProvider({
  children,
  enableInstallPrompt = true,
  enableNotificationPrompt = true,
  enableOfflineIndicator = true,
}: PWAProviderProps) {
  const isOnline = useOnlineStatus();

  // Handle coming back online - sync queued changes
  useEffect(() => {
    if (isOnline) {
      // Process any queued offline changes
      processSyncQueue().then(({ success, failed }) => {
        if (success > 0) {
          toast.success(`Synced ${success} offline change${success > 1 ? "s" : ""}`);
        }
        if (failed > 0) {
          toast.error(`Failed to sync ${failed} change${failed > 1 ? "s" : ""}`);
        }
      });

      // Clear expired cache entries periodically
      clearExpiredCache();
    }
  }, [isOnline]);

  // Register for periodic background sync if supported
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "periodicSync" in ServiceWorkerRegistration.prototype
    ) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          // Request permission for periodic background sync
          const status = await (navigator as any).permissions.query({
            name: "periodic-background-sync",
          });

          if (status.state === "granted") {
            await (registration as any).periodicSync.register("sync-appointments", {
              minInterval: 24 * 60 * 60 * 1000, // Once per day
            });
          }
        } catch (error) {
          // Periodic sync not supported or permission denied
          console.log("Periodic background sync not available");
        }
      });
    }
  }, []);

  return (
    <>
      {children}
      
      {/* Offline Status Indicator */}
      {enableOfflineIndicator && <OfflineIndicator />}
      
      {/* Install App Banner */}
      {enableInstallPrompt && <InstallPromptBanner />}
      
      {/* Notification Permission Prompt */}
      {enableNotificationPrompt && <NotificationPrompt />}
    </>
  );
}
