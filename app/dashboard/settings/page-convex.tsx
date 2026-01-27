"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusManagementTab } from "@/components/settings/status-management-tab";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Calendar,
  Bell,
  Palette,
  Plus,
  Trash2,
  CheckCircle,
  Shield,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { CalendarManagementTab } from "@/components/settings/calendar-management-tab";
import { AntiAbuseManagementTab } from "@/components/settings/anti-abuse-management-tab";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useInstallPrompt, useOnlineStatus } from "@/hooks/use-pwa";
import { Smartphone, Download, WifiOff } from "lucide-react";

interface SystemSettings {
  maxAdvanceBookingDays: number;
  multipleAppointmentsAllowed: boolean;
  sameDayBookingAllowed: boolean;
  defaultSlotsPerDay: number;
  sessionDurationHours: number;
  sessionTimeoutMinutes: number;
  recurringAppointmentsEnabled: boolean;
  waitlistEnabled: boolean;
  emergencySlotsEnabled: boolean;
}

interface AppointmentStatus {
  id: number;
  name: string;
  color: string;
  isActive: boolean;
}

const defaultSettings: SystemSettings = {
  maxAdvanceBookingDays: 30,
  multipleAppointmentsAllowed: true,
  sameDayBookingAllowed: true,
  defaultSlotsPerDay: 10,
  sessionDurationHours: 24,
  sessionTimeoutMinutes: 60,
  recurringAppointmentsEnabled: false,
  waitlistEnabled: false,
  emergencySlotsEnabled: false,
};

export default function SettingsPageConvex() {
  // Convex queries
  const systemSettings = useQuery(api.queries.getSystemSettings, {});
  const updateSetting = useMutation(api.mutations.updateSystemSetting);

  const loading = systemSettings === undefined;
  const settingsError = systemSettings === null;

  // Local state for UI updates
  const [localSettings, setLocalSettings] = useState<SystemSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateSetting({
        setting_key: "session_duration_hours",
        setting_value: String(localSettings.sessionDurationHours),
      });
      await updateSetting({
        setting_key: "session_timeout_minutes",
        setting_value: String(localSettings.sessionTimeoutMinutes),
      });
      await updateSetting({
        setting_key: "default_slots_per_day",
        setting_value: String(localSettings.defaultSlotsPerDay),
      });
      await updateSetting({
        setting_key: "recurring_appointments_enabled",
        setting_value: String(localSettings.recurringAppointmentsEnabled),
      });
      await updateSetting({
        setting_key: "waitlist_enabled",
        setting_value: String(localSettings.waitlistEnabled),
      });
      await updateSetting({
        setting_key: "emergency_slots_enabled",
        setting_value: String(localSettings.emergencySlotsEnabled),
      });
      
      setSaveSuccess(true);
      toast.success("Settings saved successfully!");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure system preferences and manage hospital data
        </p>
      </div>

      {settingsError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load settings</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="anti-abuse" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Anti-Abuse
          </TabsTrigger>
          <TabsTrigger value="statuses" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Statuses
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="otp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            OTP
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionDuration">Session Duration (hours)</Label>
                  <Input
                    id="sessionDuration"
                    type="number"
                    value={localSettings.sessionDurationHours}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        sessionDurationHours: Number.parseInt(e.target.value) || 24,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Auto-Logout Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="480"
                    value={localSettings.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        sessionTimeoutMinutes: Number.parseInt(e.target.value) || 60,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Users will be automatically logged out after this period of inactivity (5-480 minutes)
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultSlots">Default Slots Per Day</Label>
                  <Input
                    id="defaultSlots"
                    type="number"
                    value={localSettings.defaultSlotsPerDay}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        defaultSlotsPerDay: Number.parseInt(e.target.value) || 10,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Features</CardTitle>
              <CardDescription>
                Configure operational appointment features and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Booking Limits & Restrictions
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Booking limits, advance booking rules, and anti-abuse measures are now configured in the{" "}
                      <strong>Anti-Abuse</strong> tab for better organization.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Recurring Appointments</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable recurring appointment feature
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.recurringAppointmentsEnabled}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        recurringAppointmentsEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Waitlist</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable waitlist for fully booked slots
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.waitlistEnabled}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        waitlistEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Emergency Slots</Label>
                    <p className="text-sm text-muted-foreground">
                      Reserve slots for emergency appointments
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.emergencySlotsEnabled}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        emergencySlotsEnabled: checked,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <CalendarManagementTab />
        </TabsContent>

        {/* Anti-Abuse Tab */}
        <TabsContent value="anti-abuse" className="space-y-6">
          <AntiAbuseManagementTab />
        </TabsContent>

        {/* Statuses Tab */}
        <TabsContent value="statuses" className="space-y-6">
          <StatusManagementTab />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Push Notifications Card */}
          <PushNotificationsCard />

          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>Configure SMS settings and templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Send SMS for OTP and appointment reminders
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div>
                <Label htmlFor="smsProvider">SMS Provider</Label>
                <Select defaultValue="mock">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mock">Mock Provider (Development)</SelectItem>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="aws">AWS SNS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="otpTemplate">OTP SMS Template</Label>
                <Textarea
                  id="otpTemplate"
                  placeholder="Your OTP code is: {otp}. Valid for 10 minutes."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="reminderTemplate">Appointment Reminder Template</Label>
                <Textarea
                  id="reminderTemplate"
                  placeholder="Reminder: You have an appointment with {doctor} on {date} at slot {slot}."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OTP Tab */}
        <TabsContent value="otp" className="space-y-6">
          <OTPConfigurationTab />
        </TabsContent>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </Tabs>
    </div>
  );
}

// OTP Configuration Component
function PushNotificationsCard() {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  } = usePushNotifications();
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const isOnline = useOnlineStatus();

  const handleToggleNotifications = async () => {
    if (subscription) {
      const success = await unsubscribe();
      if (success) {
        toast.success("Push notifications disabled");
      } else {
        toast.error("Failed to disable notifications");
      }
    } else {
      const result = await subscribe();
      if (result) {
        toast.success("Push notifications enabled!", {
          description: "You'll receive reminders for your appointments.",
        });
      } else if (error) {
        toast.error("Failed to enable notifications", {
          description: error,
        });
      }
    }
  };

  const handleTestNotification = () => {
    sendLocalNotification("Test Notification", {
      body: "Push notifications are working correctly!",
      tag: "test",
    });
    toast.success("Test notification sent!");
  };

  const handleInstallApp = async () => {
    const success = await promptInstall();
    if (success) {
      toast.success("App installed successfully!");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive browser notifications for appointment reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Online Status */}
        {!isOnline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You're currently offline. Some features may be unavailable.
            </AlertDescription>
          </Alert>
        )}

        {/* PWA Install Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label>App Installation</Label>
              <p className="text-sm text-muted-foreground">
                {isInstalled
                  ? "App is installed on your device"
                  : isInstallable
                    ? "Install app for the best experience"
                    : "App installation not available"}
              </p>
            </div>
          </div>
          {isInstallable && !isInstalled && (
            <Button variant="outline" size="sm" onClick={handleInstallApp}>
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          )}
          {isInstalled && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Installed
            </span>
          )}
        </div>

        {/* Push Notification Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label>Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              {!isSupported
                ? "Not supported on this browser"
                : permission === "denied"
                  ? "Blocked - Enable in browser settings"
                  : subscription
                    ? "Receiving appointment reminders"
                    : "Enable to receive reminders"}
            </p>
          </div>
          <Switch
            checked={!!subscription}
            onCheckedChange={handleToggleNotifications}
            disabled={!isSupported || permission === "denied" || isLoading}
          />
        </div>

        {/* Test Notification */}
        {subscription && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <Label>Test Notification</Label>
              <p className="text-sm text-muted-foreground">
                Send a test notification to verify setup
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleTestNotification}>
              Send Test
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function OTPConfigurationTab() {
  const [testPhone, setTestPhone] = useState("");
  const [currentMode, setCurrentMode] = useState<"hubtel" | "mock">("mock");
  const [testing, setTesting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const updateMode = async (newMode: "hubtel" | "mock") => {
    setUpdating(true);
    try {
      const response = await fetch("/api/settings/otp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      if (response.ok) {
        setCurrentMode(newMode);
        toast.success(`OTP mode changed to ${newMode.toUpperCase()}`);
      } else {
        toast.error("Failed to update OTP mode");
      }
    } catch (error) {
      toast.error("Failed to update OTP mode");
    } finally {
      setUpdating(false);
    }
  };

  const testService = async () => {
    if (!testPhone.trim()) return;
    setTesting(true);
    try {
      const response = await fetch("/api/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone }),
      });
      if (response.ok) {
        toast.success("Test SMS sent successfully!");
      } else {
        toast.error("Failed to send test SMS");
      }
    } catch (error) {
      toast.error("Failed to send test SMS");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>OTP Configuration</CardTitle>
        <CardDescription>Configure how OTP messages are sent to users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Mode */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">Current Mode: {currentMode.toUpperCase()}</p>
            <p className="text-sm text-muted-foreground">
              {currentMode === "hubtel" ? "Real SMS via Hubtel" : "Mock SMS (Console)"}
            </p>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>Hubtel SMS (Real)</Label>
              <p className="text-sm text-muted-foreground">Send real SMS messages</p>
            </div>
            <Switch
              checked={currentMode === "hubtel"}
              onCheckedChange={(checked) => checked && updateMode("hubtel")}
              disabled={updating}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>Mock SMS (Development)</Label>
              <p className="text-sm text-muted-foreground">Log messages to console</p>
            </div>
            <Switch
              checked={currentMode === "mock"}
              onCheckedChange={(checked) => checked && updateMode("mock")}
              disabled={updating}
            />
          </div>
        </div>

        {/* Test Service */}
        <div className="space-y-4">
          <Label>Test Current Service</Label>
          <div className="flex gap-2">
            <Input
              placeholder="+233240000000"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Button onClick={testService} disabled={testing || !testPhone.trim()}>
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
