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
import {
  Settings,
  Calendar,
  Bell,
  Palette,
  Plus,
  Trash2,
  CheckCircle,
  Shield,
} from "lucide-react";

interface SystemSettings {
  maxAdvanceBookingDays: number;
  multipleAppointmentsAllowed: boolean;
  sameDayBookingAllowed: boolean;
  defaultSlotsPerDay: number;
  sessionDurationHours: number;
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

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [statuses, setStatuses] = useState<AppointmentStatus[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Mock data
  useEffect(() => {
    const mockSettings: SystemSettings = {
      maxAdvanceBookingDays: 14,
      multipleAppointmentsAllowed: false,
      sameDayBookingAllowed: false,
      defaultSlotsPerDay: 10,
      sessionDurationHours: 24,
      recurringAppointmentsEnabled: false,
      waitlistEnabled: false,
      emergencySlotsEnabled: false,
    };

    const mockStatuses: AppointmentStatus[] = [
      { id: 1, name: "booked", color: "#3B82F6", isActive: true },
      { id: 2, name: "confirmed", color: "#8B5CF6", isActive: true },
      { id: 3, name: "arrived", color: "#10B981", isActive: true },
      { id: 4, name: "waiting", color: "#F59E0B", isActive: true },
      { id: 5, name: "in_progress", color: "#06B6D4", isActive: true },
      { id: 6, name: "completed", color: "#059669", isActive: true },
      { id: 7, name: "no_show", color: "#EF4444", isActive: true },
      { id: 8, name: "cancelled", color: "#6B7280", isActive: true },
    ];

    const mockDoctors: Doctor[] = [
      {
        id: 1,
        name: "Dr. Sarah Wilson",
        specialization: "General Medicine",
        isActive: true,
      },
      {
        id: 2,
        name: "Dr. Michael Brown",
        specialization: "Cardiology",
        isActive: true,
      },
      {
        id: 3,
        name: "Dr. Emily Davis",
        specialization: "Pediatrics",
        isActive: true,
      },
      {
        id: 4,
        name: "Dr. James Miller",
        specialization: "Orthopedics",
        isActive: true,
      },
      {
        id: 5,
        name: "Dr. Lisa Anderson",
        specialization: "Dermatology",
        isActive: false,
      },
    ];

    setSettings(mockSettings);
    setStatuses(mockStatuses);
    setDoctors(mockDoctors);
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess("Settings saved successfully!");
    } catch (err) {
      setError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = () => {
    const newStatus: AppointmentStatus = {
      id: Date.now(),
      name: "new_status",
      color: "#3B82F6",
      isActive: true,
    };
    setStatuses([...statuses, newStatus]);
  };

  const handleUpdateStatus = (
    id: number,
    updates: Partial<AppointmentStatus>
  ) => {
    setStatuses(
      statuses.map((status) =>
        status.id === id ? { ...status, ...updates } : status
      )
    );
  };

  const handleDeleteStatus = (id: number) => {
    setStatuses(statuses.filter((status) => status.id !== id));
  };

  const handleAddDoctor = () => {
    const newDoctor: Doctor = {
      id: Date.now(),
      name: "New Doctor",
      specialization: "General Medicine",
      isActive: true,
    };
    setDoctors([...doctors, newDoctor]);
  };

  const handleUpdateDoctor = (id: number, updates: Partial<Doctor>) => {
    setDoctors(
      doctors.map((doctor) =>
        doctor.id === id ? { ...doctor, ...updates } : doctor
      )
    );
  };

  const handleDeleteDoctor = (id: number) => {
    setDoctors(doctors.filter((doctor) => doctor.id !== id));
  };

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure system preferences and manage hospital data
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="anti-abuse" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Anti-Abuse
          </TabsTrigger>
          <TabsTrigger value="statuses" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Statuses
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionDuration">
                    Session Duration (hours)
                  </Label>
                  <Input
                    id="sessionDuration"
                    type="number"
                    value={settings.sessionDurationHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sessionDurationHours:
                          Number.parseInt(e.target.value) || 24,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="defaultSlots">Default Slots Per Day</Label>
                  <Input
                    id="defaultSlots"
                    type="number"
                    value={settings.defaultSlotsPerDay}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultSlotsPerDay:
                          Number.parseInt(e.target.value) || 10,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                      Booking limits, advance booking rules, and anti-abuse
                      measures are now configured in the{" "}
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
                    checked={settings.recurringAppointmentsEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
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
                    checked={settings.waitlistEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
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
                    checked={settings.emergencySlotsEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        emergencySlotsEnabled: checked,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anti-abuse" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Anti-Abuse Protection</CardTitle>
              <CardDescription>
                Configure appointment booking protection measures and penalties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Advanced Anti-Abuse Settings
                </h3>
                <p className="text-muted-foreground mb-4">
                  Configure comprehensive protection against appointment booking
                  abuse, no-shows, and system gaming.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Features include:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                      Booking Limits
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                      No-Show Penalties
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                      Client Scoring
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                      Abuse Detection
                    </span>
                  </div>
                </div>
                <Button
                  className="mt-6"
                  onClick={() =>
                    window.open("/dashboard/settings/anti-abuse", "_blank")
                  }
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Open Anti-Abuse Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses" className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Appointment Statuses</h2>
              <p className="text-muted-foreground">
                Manage status types, colors, and workflow for appointments
              </p>
            </div>
            <Button onClick={handleAddStatus} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Status
            </Button>
          </div>

          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statuses.map((status) => (
              <Card
                key={status.id}
                className="group hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-gray-900 shadow-sm"
                        style={{ backgroundColor: status.color }}
                      />
                      <div className="flex-1">
                        <Input
                          value={status.name}
                          onChange={(e) =>
                            handleUpdateStatus(status.id, {
                              name: e.target.value,
                            })
                          }
                          className="font-semibold text-base border-none p-0 h-auto focus-visible:ring-1 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStatus(status.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Color Picker */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Color
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={status.color}
                          onChange={(e) =>
                            handleUpdateStatus(status.id, {
                              color: e.target.value,
                            })
                          }
                          className="w-12 h-8 p-1 border-2"
                        />
                        <Input
                          value={status.color}
                          onChange={(e) =>
                            handleUpdateStatus(status.id, {
                              color: e.target.value,
                            })
                          }
                          className="font-mono text-xs"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <Label className="text-sm font-medium">
                          Active Status
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {status.isActive
                            ? "Available for use"
                            : "Hidden from selection"}
                        </p>
                      </div>
                      <Switch
                        checked={status.isActive}
                        onCheckedChange={(checked) =>
                          handleUpdateStatus(status.id, { isActive: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Status Card */}
            <Card
              className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={handleAddStatus}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-medium text-sm mb-1">Add New Status</h3>
                <p className="text-xs text-muted-foreground">
                  Create a custom appointment status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Usage Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Status Management Tips
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
                    <div>
                      <strong>• Standard Statuses:</strong> Keep core statuses
                      like "Booked", "Completed", "Cancelled"
                    </div>
                    <div>
                      <strong>• Color Coding:</strong> Use consistent colors
                      (green=good, red=cancelled, blue=pending)
                    </div>
                    <div>
                      <strong>• Active Toggle:</strong> Disable unused statuses
                      instead of deleting them
                    </div>
                    <div>
                      <strong>• Workflow:</strong> Consider your appointment
                      lifecycle when creating statuses
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>
                Configure SMS settings and templates
              </CardDescription>
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
                    <SelectItem value="mock">
                      Mock Provider (Development)
                    </SelectItem>
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
                <Label htmlFor="reminderTemplate">
                  Appointment Reminder Template
                </Label>
                <Textarea
                  id="reminderTemplate"
                  placeholder="Reminder: You have an appointment with {doctor} on {date} at slot {slot}."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
