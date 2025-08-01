"use client";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield,
  Clock,
  Ban,
  TrendingUp,
  AlertTriangle,
  Save,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface AntiAbuseSettings {
  bookingLimits: {
    maxFutureDays: number;
    minAdvanceHours: number;
    maxDailyAppointments: number;
    maxPendingAppointments: number;
    maxSameDeptPending: number;
    allowSameDayBooking: boolean;
    sameDayBookingCutoffHour: number;
  };
  cancellationRules: {
    minCancelHours: number;
    maxCancellationsMonth: number;
    allowSameDayCancel: boolean;
    requireCancelReason: boolean;
  };
  noShowPenalties: {
    maxNoShowsMonth: number;
    firstOffenseDays: number;
    secondOffenseDays: number;
    thirdOffenseDays: number;
    chronicOffenderDays: number;
    autoApplyPenalties: boolean;
  };
  scoringSystem: {
    enabled: boolean;
    excellentThreshold: number;
    goodThreshold: number;
    averageThreshold: number;
    poorThreshold: number;
    showScoreToClients: boolean;
  };
  abuseDetection: {
    enabled: boolean;
    rapidBookingMinutes: number;
    crossDeptConflictCheck: boolean;
    proxyBookingDetection: boolean;
    alertAdminsOnAbuse: boolean;
  };
}

const defaultSettings: AntiAbuseSettings = {
  bookingLimits: {
    maxFutureDays: 30,
    minAdvanceHours: 2,
    maxDailyAppointments: 1,
    maxPendingAppointments: 2,
    maxSameDeptPending: 1,
    allowSameDayBooking: true,
    sameDayBookingCutoffHour: 14, // 2 PM
  },
  cancellationRules: {
    minCancelHours: 24,
    maxCancellationsMonth: 3,
    allowSameDayCancel: false,
    requireCancelReason: true,
  },
  noShowPenalties: {
    maxNoShowsMonth: 2,
    firstOffenseDays: 3,
    secondOffenseDays: 7,
    thirdOffenseDays: 14,
    chronicOffenderDays: 30,
    autoApplyPenalties: true,
  },
  scoringSystem: {
    enabled: true,
    excellentThreshold: 90,
    goodThreshold: 75,
    averageThreshold: 60,
    poorThreshold: 40,
    showScoreToClients: true,
  },
  abuseDetection: {
    enabled: true,
    rapidBookingMinutes: 5,
    crossDeptConflictCheck: true,
    proxyBookingDetection: false,
    alertAdminsOnAbuse: true,
  },
};

// Helper component for info tooltips
const InfoTooltip = ({ content }: { content: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p>{content}</p>
    </TooltipContent>
  </Tooltip>
);

export default function AntiAbuseSettingsPage() {
  const [settings, setSettings] = useState<AntiAbuseSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings/anti-abuse");
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/settings/anti-abuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Anti-abuse settings saved successfully!");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    category: keyof AntiAbuseSettings,
    key: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Anti-Abuse Settings</h1>
          <p className="text-muted-foreground">
            Configure appointment booking protection measures
          </p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Anti-Abuse Settings</h1>
            <p className="text-muted-foreground">
              Configure appointment booking protection measures and penalties
            </p>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Booking Limits
              </CardTitle>
              <CardDescription>
                Control when and how many appointments clients can book
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="maxFutureDays">Max Future Days</Label>
                    <InfoTooltip content="Maximum number of days in advance that clients can book appointments. Prevents hoarding of far-future slots." />
                  </div>
                  <Input
                    id="maxFutureDays"
                    type="number"
                    min="7"
                    max="90"
                    value={settings.bookingLimits.maxFutureDays}
                    onChange={(e) =>
                      updateSetting(
                        "bookingLimits",
                        "maxFutureDays",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 7-90 days
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="minAdvanceHours">Min Advance Hours</Label>
                    <InfoTooltip content="Minimum hours before appointment time that booking is allowed. Prevents last-minute bookings that may cause scheduling issues." />
                  </div>
                  <Input
                    id="minAdvanceHours"
                    type="number"
                    min="1"
                    max="48"
                    value={settings.bookingLimits.minAdvanceHours}
                    onChange={(e) =>
                      updateSetting(
                        "bookingLimits",
                        "minAdvanceHours",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 1-48 hours
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="maxDaily">Max Daily</Label>
                    <InfoTooltip content="Maximum appointments a client can book for the same day. Prevents monopolizing daily slots." />
                  </div>
                  <Input
                    id="maxDaily"
                    type="number"
                    min="1"
                    max="3"
                    value={settings.bookingLimits.maxDailyAppointments}
                    onChange={(e) =>
                      updateSetting(
                        "bookingLimits",
                        "maxDailyAppointments",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="maxPending">Max Pending</Label>
                    <InfoTooltip content="Maximum total pending appointments a client can have across all departments. Prevents booking hoarding." />
                  </div>
                  <Input
                    id="maxPending"
                    type="number"
                    min="1"
                    max="5"
                    value={settings.bookingLimits.maxPendingAppointments}
                    onChange={(e) =>
                      updateSetting(
                        "bookingLimits",
                        "maxPendingAppointments",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="maxSameDept">Same Dept</Label>
                    <InfoTooltip content="Maximum pending appointments per department. Prevents clients from booking multiple slots in the same department." />
                  </div>
                  <Input
                    id="maxSameDept"
                    type="number"
                    min="1"
                    max="2"
                    value={settings.bookingLimits.maxSameDeptPending}
                    onChange={(e) =>
                      updateSetting(
                        "bookingLimits",
                        "maxSameDeptPending",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              {/* Same-Day Booking Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm">Same-Day Booking</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="allowSameDayBooking">
                        Allow Same-Day Booking
                      </Label>
                      <InfoTooltip content="Whether clients can book appointments for the current day. Useful for urgent cases but may cause scheduling conflicts." />
                    </div>
                    <Switch
                      id="allowSameDayBooking"
                      checked={settings.bookingLimits.allowSameDayBooking}
                      onCheckedChange={(checked) =>
                        updateSetting(
                          "bookingLimits",
                          "allowSameDayBooking",
                          checked
                        )
                      }
                    />
                  </div>
                  {settings.bookingLimits.allowSameDayBooking && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="sameDayCutoff">Cutoff Hour (24h)</Label>
                        <InfoTooltip content="Hour after which same-day booking is disabled (0-23). For example, 14 means no same-day booking after 2 PM." />
                      </div>
                      <Input
                        id="sameDayCutoff"
                        type="number"
                        min="0"
                        max="23"
                        value={settings.bookingLimits.sameDayBookingCutoffHour}
                        onChange={(e) =>
                          updateSetting(
                            "bookingLimits",
                            "sameDayBookingCutoffHour",
                            parseInt(e.target.value)
                          )
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently:{" "}
                        {settings.bookingLimits.sameDayBookingCutoffHour}:00 (
                        {settings.bookingLimits.sameDayBookingCutoffHour > 12
                          ? `${
                              settings.bookingLimits.sameDayBookingCutoffHour -
                              12
                            } PM`
                          : `${settings.bookingLimits.sameDayBookingCutoffHour} AM`}
                        )
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Cancellation Rules
              </CardTitle>
              <CardDescription>
                Set policies for appointment cancellations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="minCancelHours">Min Cancel Hours</Label>
                    <InfoTooltip content="Minimum hours before appointment that cancellation is allowed without penalty. Helps with scheduling and reduces last-minute cancellations." />
                  </div>
                  <Input
                    id="minCancelHours"
                    type="number"
                    min="2"
                    max="72"
                    value={settings.cancellationRules.minCancelHours}
                    onChange={(e) =>
                      updateSetting(
                        "cancellationRules",
                        "minCancelHours",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 2-72 hours
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="maxCancellations">Max/Month</Label>
                    <InfoTooltip content="Maximum cancellations allowed per client per month. Prevents abuse of the cancellation system." />
                  </div>
                  <Input
                    id="maxCancellations"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.cancellationRules.maxCancellationsMonth}
                    onChange={(e) =>
                      updateSetting(
                        "cancellationRules",
                        "maxCancellationsMonth",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 1-10 cancellations
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="allowSameDay">Allow Same-Day Cancel</Label>
                    <InfoTooltip content="Whether clients can cancel appointments on the same day. May be useful for emergencies but can disrupt scheduling." />
                  </div>
                  <Switch
                    id="allowSameDay"
                    checked={settings.cancellationRules.allowSameDayCancel}
                    onCheckedChange={(checked) =>
                      updateSetting(
                        "cancellationRules",
                        "allowSameDayCancel",
                        checked
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="requireReason">Require Cancel Reason</Label>
                    <InfoTooltip content="Force clients to provide a reason when cancelling appointments. Helps track cancellation patterns and improve services." />
                  </div>
                  <Switch
                    id="requireReason"
                    checked={settings.cancellationRules.requireCancelReason}
                    onCheckedChange={(checked) =>
                      updateSetting(
                        "cancellationRules",
                        "requireCancelReason",
                        checked
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
