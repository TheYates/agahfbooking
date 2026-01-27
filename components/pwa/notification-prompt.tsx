"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationPromptProps {
  className?: string;
  variant?: "banner" | "card" | "inline";
}

export function NotificationPrompt({
  className,
  variant = "banner",
}: NotificationPromptProps) {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed
    const dismissed = localStorage.getItem("notification-prompt-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 30 days
      if (Date.now() - dismissedTime < 30 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        return;
      }
    }

    // Delay showing for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10000); // Show after 10 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(
      "notification-prompt-dismissed",
      Date.now().toString()
    );
  };

  const handleEnable = async () => {
    const result = await subscribe();
    if (result) {
      toast.success("Notifications enabled!", {
        description: "You'll receive reminders for your appointments.",
      });
      handleDismiss();
    } else if (error) {
      toast.error("Failed to enable notifications", {
        description: error,
      });
    }
  };

  const handleDisable = async () => {
    const success = await unsubscribe();
    if (success) {
      toast.success("Notifications disabled");
    }
  };

  // Don't show if not supported, already subscribed, permission denied, or dismissed
  if (
    !isSupported ||
    subscription ||
    permission === "denied" ||
    isDismissed ||
    !isVisible
  ) {
    return null;
  }

  if (variant === "card") {
    return (
      <Card className={cn("border-primary/20", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" />
            Enable Notifications
          </CardTitle>
          <CardDescription>
            Get reminders for your upcoming appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={handleEnable}
              disabled={isLoading}
              size="sm"
              className="gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              Enable
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-lg border p-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">Appointment Reminders</p>
            <p className="text-xs text-muted-foreground">
              Never miss an appointment
            </p>
          </div>
        </div>
        <Button
          onClick={handleEnable}
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Enable"
          )}
        </Button>
      </div>
    );
  }

  // Default banner variant
  return (
    <div
      className={cn(
        "fixed bottom-16 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm",
        "animate-in slide-in-from-bottom-5 duration-300",
        className
      )}
    >
      <Card className="shadow-lg border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-semibold text-sm">
                  Enable Appointment Reminders
                </p>
                <p className="text-xs text-muted-foreground">
                  Get notified about your upcoming appointments so you never
                  miss one.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleEnable}
                  disabled={isLoading}
                  size="sm"
                  className="gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  Enable
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDismiss}>
                  Later
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Toggle button for notification settings
 */
export function NotificationToggle({ className }: { className?: string }) {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Push notifications are not supported on this device
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Notifications are blocked. Please enable them in your browser settings.
      </div>
    );
  }

  const handleToggle = async () => {
    if (subscription) {
      await unsubscribe();
      toast.success("Notifications disabled");
    } else {
      const result = await subscribe();
      if (result) {
        toast.success("Notifications enabled!");
      }
    }
  };

  return (
    <Button
      variant={subscription ? "default" : "outline"}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn("gap-2", className)}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : subscription ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {subscription ? "Notifications On" : "Enable Notifications"}
    </Button>
  );
}
