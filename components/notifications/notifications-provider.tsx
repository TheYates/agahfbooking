"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useNotificationsRealtime } from "@/hooks/use-notifications-realtime";
import { useSessionUser } from "@/hooks/use-session-user";
import { toast } from "sonner";

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  event_type: string;
  related_appointment_id: number | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useSessionUser();

  const handleNewNotification = useCallback((notification: any) => {
    // Show toast for new notification
    toast(notification.title, {
      description: notification.message,
      duration: 5000,
    });
  }, []);

  const notificationsData = useNotificationsRealtime({
    userId: user?.id,
    enabled: !!user?.id,
    onNewNotification: handleNewNotification,
  });

  return (
    <NotificationsContext.Provider value={notificationsData}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
