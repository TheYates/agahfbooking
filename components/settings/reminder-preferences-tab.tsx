"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Clock } from "lucide-react";
import { toast } from "sonner";

interface ReminderPreferencesTabProps {
  userId: number;
}

export function ReminderPreferencesTab({ userId }: ReminderPreferencesTabProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [preferences, setPreferences] = useState({
    enabled: true,
    remind24h: true,
    remind1h: true,
    remind30m: false,
    pushEnabled: true,
    smsEnabled: false,
  });

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/settings/reminder-preferences");
      const result = await response.json();
      
      if (result.success && result.data) {
        setPreferences({
          enabled: result.data.enabled ?? true,
          remind24h: result.data.remind_24h ?? true,
          remind1h: result.data.remind_1h ?? true,
          remind30m: result.data.remind_30m ?? false,
          pushEnabled: result.data.push_enabled ?? true,
          smsEnabled: result.data.sms_enabled ?? false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings/reminder-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: preferences.enabled,
          remind_24h: preferences.remind24h,
          remind_1h: preferences.remind1h,
          remind_30m: preferences.remind30m,
          push_enabled: preferences.pushEnabled,
          sms_enabled: preferences.smsEnabled,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Reminder preferences saved");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Appointment Reminders</CardTitle>
          </div>
          <CardDescription>
            Configure when and how you want to receive appointment reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable All Reminders */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminders-enabled">Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications before your appointments
              </p>
            </div>
            <Switch
              id="reminders-enabled"
              checked={preferences.enabled}
              onCheckedChange={(enabled) =>
                setPreferences({ ...preferences, enabled })
              }
            />
          </div>

          <div className="h-px bg-border" />

          {/* Reminder Timing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base">Reminder Timing</Label>
            </div>

            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="remind-24h">24 hours before</Label>
                  <p className="text-xs text-muted-foreground">
                    Day-before reminder
                  </p>
                </div>
                <Switch
                  id="remind-24h"
                  checked={preferences.remind24h}
                  disabled={!preferences.enabled}
                  onCheckedChange={(remind24h) =>
                    setPreferences({ ...preferences, remind24h })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="remind-1h">1 hour before</Label>
                  <p className="text-xs text-muted-foreground">
                    Last-minute reminder
                  </p>
                </div>
                <Switch
                  id="remind-1h"
                  checked={preferences.remind1h}
                  disabled={!preferences.enabled}
                  onCheckedChange={(remind1h) =>
                    setPreferences({ ...preferences, remind1h })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="remind-30m">30 minutes before</Label>
                  <p className="text-xs text-muted-foreground">
                    Extra early reminder
                  </p>
                </div>
                <Switch
                  id="remind-30m"
                  checked={preferences.remind30m}
                  disabled={!preferences.enabled}
                  onCheckedChange={(remind30m) =>
                    setPreferences({ ...preferences, remind30m })
                  }
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Notification Channels */}
          <div className="space-y-4">
            <Label className="text-base">Notification Channels</Label>

            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="push-enabled">Push Notifications</Label>
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    In-app and browser notifications
                  </p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={preferences.pushEnabled}
                  disabled={!preferences.enabled}
                  onCheckedChange={(pushEnabled) =>
                    setPreferences({ ...preferences, pushEnabled })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sms-enabled">SMS Notifications</Label>
                    <Badge variant="outline" className="text-xs">
                      Optional
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Text message reminders
                  </p>
                </div>
                <Switch
                  id="sms-enabled"
                  checked={preferences.smsEnabled}
                  disabled={!preferences.enabled}
                  onCheckedChange={(smsEnabled) =>
                    setPreferences({ ...preferences, smsEnabled })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                How reminders work
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Push notifications work even when you're offline (delivered when you reconnect).
                For the best experience, allow notifications in your browser settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
