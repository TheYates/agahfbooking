"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Settings, Shield, Bell, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { CalendarConfigurationTab } from "@/components/settings/calendar-configuration-tab";
import { AntiAbuseManagementTab } from "@/components/settings/anti-abuse-management-tab";
import { ReminderPreferencesTab } from "@/components/settings/reminder-preferences-tab";
import { ReschedulePresetsTab } from "@/components/settings/reschedule-presets-tab";
import {
  useSystemSettings,
  useUpdateSystemSettings,
} from "@/hooks/use-hospital-queries";
import { useSessionUser } from "@/hooks/use-session-user";

export default function SettingsPageSupabase() {
  const { data: systemSettings, isLoading } = useSystemSettings(true);
  const updateSystemSettings = useUpdateSystemSettings();
  const { user } = useSessionUser();

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role && ["admin", "receptionist", "reviewer"].includes(user.role);

  const [form, setForm] = useState({
    maxAdvanceBookingDays: 14,
    multipleAppointmentsAllowed: false,
    sameDayBookingAllowed: false,
    defaultSlotsPerDay: 10,
    sessionDurationHours: 24,
    sessionTimeoutMinutes: 60,
    recurringAppointmentsEnabled: false,
    waitlistEnabled: false,
    emergencySlotsEnabled: false,
  });

  useEffect(() => {
    if (systemSettings) setForm(systemSettings);
  }, [systemSettings]);

  const onSaveSystem = async () => {
    try {
      await updateSystemSettings.mutateAsync(form);
      toast.success("System settings updated");
    } catch (e: any) {
      toast.error("Failed to update system settings", {
        description: e?.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure system behavior and administrative controls
        </p>
      </div>

      <Tabs defaultValue={isStaff && !isAdmin ? "presets" : "system"} className="space-y-4">
        <TabsList>
          {isAdmin && (
            <TabsTrigger value="system" className="gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          )}
          <TabsTrigger value="reminders" className="gap-2">
            <Bell className="h-4 w-4" />
            Reminders
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="antiabuse" className="gap-2">
              <Shield className="h-4 w-4" />
              Anti-abuse
            </TabsTrigger>
          )}
          {isStaff && (
            <TabsTrigger value="presets" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Presets
            </TabsTrigger>
          )}
        </TabsList>

        {isAdmin && (
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  These settings affect booking rules and session behavior.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Max advance booking days</Label>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={form.maxAdvanceBookingDays}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              maxAdvanceBookingDays: parseInt(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Default slots per day</Label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={form.defaultSlotsPerDay}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              defaultSlotsPerDay: parseInt(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Session duration (hours)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={168}
                          value={form.sessionDurationHours}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              sessionDurationHours: parseInt(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Session timeout (minutes)</Label>
                        <Input
                          type="number"
                          min={5}
                          max={480}
                          value={form.sessionTimeoutMinutes}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              sessionTimeoutMinutes: parseInt(e.target.value) || 5,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <div className="font-medium">Same-day booking</div>
                          <div className="text-sm text-muted-foreground">
                            Allow booking appointments on the same date.
                          </div>
                        </div>
                        <Switch
                          checked={form.sameDayBookingAllowed}
                          onCheckedChange={(v) =>
                            setForm((p) => ({ ...p, sameDayBookingAllowed: v }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <div className="font-medium">Multiple appointments</div>
                          <div className="text-sm text-muted-foreground">
                            Allow clients to hold multiple upcoming appointments.
                          </div>
                        </div>
                        <Switch
                          checked={form.multipleAppointmentsAllowed}
                          onCheckedChange={(v) =>
                            setForm((p) => ({
                              ...p,
                              multipleAppointmentsAllowed: v,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={onSaveSystem}
                        disabled={updateSystemSettings.isPending}
                      >
                        {updateSystemSettings.isPending ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="calendar">
            <CalendarConfigurationTab />
          </TabsContent>
        )}

        <TabsContent value="reminders">
          {user && <ReminderPreferencesTab userId={user.id} />}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="antiabuse">
            <AntiAbuseManagementTab />
          </TabsContent>
        )}

        {isStaff && (
          <TabsContent value="presets">
            <ReschedulePresetsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
