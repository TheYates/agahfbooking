"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type AntiAbuseSettings = {
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
};

const defaults: AntiAbuseSettings = {
  bookingLimits: {
    maxFutureDays: 30,
    minAdvanceHours: 2,
    maxDailyAppointments: 1,
    maxPendingAppointments: 2,
    maxSameDeptPending: 1,
    allowSameDayBooking: true,
    sameDayBookingCutoffHour: 14,
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

export function AntiAbuseManagementTab() {
  const [settings, setSettings] = useState<AntiAbuseSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings/anti-abuse");
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to load settings");
        setSettings(json.data);
      } catch (e: any) {
        toast.error("Failed to load anti-abuse settings", { description: e?.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/anti-abuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");
      toast.success("Anti-abuse settings saved");
    } catch (e: any) {
      toast.error("Failed to save anti-abuse settings", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Booking limits</CardTitle>
          <CardDescription>Control how and when clients can book.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Max future days</Label>
            <Input
              type="number"
              min={7}
              max={90}
              value={settings.bookingLimits.maxFutureDays}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  bookingLimits: {
                    ...p.bookingLimits,
                    maxFutureDays: parseInt(e.target.value) || 7,
                  },
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Min advance hours</Label>
            <Input
              type="number"
              min={1}
              max={48}
              value={settings.bookingLimits.minAdvanceHours}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  bookingLimits: {
                    ...p.bookingLimits,
                    minAdvanceHours: parseInt(e.target.value) || 1,
                  },
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Max daily appointments</Label>
            <Input
              type="number"
              min={1}
              max={3}
              value={settings.bookingLimits.maxDailyAppointments}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  bookingLimits: {
                    ...p.bookingLimits,
                    maxDailyAppointments: parseInt(e.target.value) || 1,
                  },
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Max pending appointments</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={settings.bookingLimits.maxPendingAppointments}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  bookingLimits: {
                    ...p.bookingLimits,
                    maxPendingAppointments: parseInt(e.target.value) || 1,
                  },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
            <div>
              <div className="font-medium">Allow same-day booking</div>
              <div className="text-sm text-muted-foreground">
                Permit booking appointments on the same date.
              </div>
            </div>
            <Switch
              checked={settings.bookingLimits.allowSameDayBooking}
              onCheckedChange={(v) =>
                setSettings((p) => ({
                  ...p,
                  bookingLimits: { ...p.bookingLimits, allowSameDayBooking: v },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>No-show penalties</CardTitle>
          <CardDescription>Configure automatic penalty rules.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Max no-shows per month</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={settings.noShowPenalties.maxNoShowsMonth}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  noShowPenalties: {
                    ...p.noShowPenalties,
                    maxNoShowsMonth: parseInt(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Auto-apply penalties</div>
              <div className="text-sm text-muted-foreground">
                Automatically enforce penalties based on no-show behavior.
              </div>
            </div>
            <Switch
              checked={settings.noShowPenalties.autoApplyPenalties}
              onCheckedChange={(v) =>
                setSettings((p) => ({
                  ...p,
                  noShowPenalties: { ...p.noShowPenalties, autoApplyPenalties: v },
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>First offense (days)</Label>
            <Input
              type="number"
              min={1}
              max={7}
              value={settings.noShowPenalties.firstOffenseDays}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  noShowPenalties: {
                    ...p.noShowPenalties,
                    firstOffenseDays: parseInt(e.target.value) || 1,
                  },
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Second offense (days)</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={settings.noShowPenalties.secondOffenseDays}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  noShowPenalties: {
                    ...p.noShowPenalties,
                    secondOffenseDays: parseInt(e.target.value) || 1,
                  },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Anti-abuse Settings"}
        </Button>
      </div>
    </div>
  );
}
