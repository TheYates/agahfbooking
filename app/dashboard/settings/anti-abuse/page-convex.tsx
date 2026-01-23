"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle } from "lucide-react";

export default function AntiAbuseSettingsConvex() {
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState(3);
  const [penaltyEnabled, setPenaltyEnabled] = useState(true);
  const [penaltyDuration, setPenaltyDuration] = useState(7);

  // Convex queries
  const systemSettings = useQuery(api.queries.getSystemSettings, {});
  const updateSetting = useMutation(api.mutations.updateSystemSetting);

  const loading = systemSettings === undefined;
  const error = systemSettings === null;

  const handleSaveSettings = async () => {
    try {
      await updateSetting({
        setting_key: "max_bookings_per_day",
        setting_value: String(maxBookingsPerDay),
        description: "Maximum bookings per client per day",
      });

      await updateSetting({
        setting_key: "penalty_enabled",
        setting_value: String(penaltyEnabled),
        description: "Enable penalty system for no-shows",
      });

      await updateSetting({
        setting_key: "penalty_duration_days",
        setting_value: String(penaltyDuration),
        description: "Penalty duration in days",
      });

      toast.success("Anti-abuse settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Anti-Abuse Settings</h1>
        <p className="text-muted-foreground">
          Configure booking limits and penalty systems
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Booking Limits</CardTitle>
            </div>
            <CardDescription>
              Prevent clients from booking too many appointments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground">Loading settings...</p>
            ) : error ? (
              <p className="text-red-600">Error loading settings</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="max-bookings">
                    Maximum Bookings Per Day
                  </Label>
                  <Input
                    id="max-bookings"
                    type="number"
                    min="1"
                    max="10"
                    value={maxBookingsPerDay}
                    onChange={(e) => setMaxBookingsPerDay(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Clients can book up to {maxBookingsPerDay} appointment(s) per day
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle>Penalty System</CardTitle>
            </div>
            <CardDescription>
              Configure penalties for no-shows and cancellations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Penalty System</Label>
                <p className="text-sm text-muted-foreground">
                  Block clients who repeatedly miss appointments
                </p>
              </div>
              <Switch
                checked={penaltyEnabled}
                onCheckedChange={setPenaltyEnabled}
              />
            </div>

            {penaltyEnabled && (
              <div className="space-y-2">
                <Label htmlFor="penalty-duration">
                  Penalty Duration (Days)
                </Label>
                <Input
                  id="penalty-duration"
                  type="number"
                  min="1"
                  max="30"
                  value={penaltyDuration}
                  onChange={(e) => setPenaltyDuration(parseInt(e.target.value) || 7)}
                />
                <p className="text-sm text-muted-foreground">
                  Clients will be blocked for {penaltyDuration} days after a no-show
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penalty Rules</CardTitle>
            <CardDescription>
              Automatic enforcement rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">1 No-Show</p>
                  <p className="text-sm text-muted-foreground">Warning issued</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">2 No-Shows</p>
                  <p className="text-sm text-muted-foreground">
                    {penaltyDuration} day booking ban
                  </p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">3+ No-Shows</p>
                  <p className="text-sm text-muted-foreground">
                    Extended ban & manual review
                  </p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} size="lg">
            Save Anti-Abuse Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
