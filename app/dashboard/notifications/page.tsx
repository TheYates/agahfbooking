"use client";

import { Bell } from "lucide-react";
import { useNotifications } from "@/components/notifications/notifications-provider";
import { NotificationListInline } from "@/components/notifications/notification-list-inline";

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <NotificationListInline
        notifications={notifications}
        loading={loading}
        onNotificationClick={markAsRead}
        onMarkAllRead={markAllAsRead}
      />
    </div>
  );
}