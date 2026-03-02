"use client";

import { CheckCheck, Info, AlertTriangle, AlertCircle, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  event_type: string;
  related_appointment_id: number | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationListInlineProps {
  notifications: Notification[];
  loading: boolean;
  onNotificationClick: (notificationId: number) => void;
  onMarkAllRead: () => void;
}

export function NotificationListInline({
  notifications,
  loading,
  onNotificationClick,
  onMarkAllRead,
}: NotificationListInlineProps) {
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      onNotificationClick(notification.id);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCheck className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Calendar className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="divide-y">
          {notifications.map((notification) => {
            const content = (
              <div
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex gap-4 p-4 hover:bg-muted/50 transition-colors",
                  !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/10",
                  notification.action_url && "cursor-pointer"
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    notification.type === "success" && "bg-green-100 dark:bg-green-900/30",
                    notification.type === "warning" && "bg-yellow-100 dark:bg-yellow-900/30",
                    notification.type === "error" && "bg-red-100 dark:bg-red-900/30",
                    notification.type === "info" && "bg-blue-100 dark:bg-blue-900/30"
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        !notification.is_read && "font-semibold"
                      )}
                    >
                      {notification.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  {notification.action_url && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                      <span>View details</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            );

            if (notification.action_url) {
              return (
                <Link key={notification.id} href={notification.action_url}>
                  {content}
                </Link>
              );
            }

            return <div key={notification.id}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}