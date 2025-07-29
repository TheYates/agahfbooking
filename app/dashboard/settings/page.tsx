"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Calendar, Bell, Palette, Plus, Trash2, CheckCircle } from "lucide-react"

interface SystemSettings {
  maxAdvanceBookingDays: number
  multipleAppointmentsAllowed: boolean
  sameDayBookingAllowed: boolean
  defaultSlotsPerDay: number
  sessionDurationHours: number
  recurringAppointmentsEnabled: boolean
  waitlistEnabled: boolean
  emergencySlotsEnabled: boolean
}

interface AppointmentStatus {
  id: number
  name: string
  color: string
  isActive: boolean
}

interface Doctor {
  id: number
  name: string
  specialization: string
  isActive: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [statuses, setStatuses] = useState<AppointmentStatus[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

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
    }

    const mockStatuses: AppointmentStatus[] = [
      { id: 1, name: "booked", color: "#3B82F6", isActive: true },
      { id: 2, name: "confirmed", color: "#8B5CF6", isActive: true },
      { id: 3, name: "arrived", color: "#10B981", isActive: true },
      { id: 4, name: "waiting", color: "#F59E0B", isActive: true },
      { id: 5, name: "in_progress", color: "#06B6D4", isActive: true },
      { id: 6, name: "completed", color: "#059669", isActive: true },
      { id: 7, name: "no_show", color: "#EF4444", isActive: true },
      { id: 8, name: "cancelled", color: "#6B7280", isActive: true },
    ]

    const mockDoctors: Doctor[] = [
      { id: 1, name: "Dr. Sarah Wilson", specialization: "General Medicine", isActive: true },
      { id: 2, name: "Dr. Michael Brown", specialization: "Cardiology", isActive: true },
      { id: 3, name: "Dr. Emily Davis", specialization: "Pediatrics", isActive: true },
      { id: 4, name: "Dr. James Miller", specialization: "Orthopedics", isActive: true },
      { id: 5, name: "Dr. Lisa Anderson", specialization: "Dermatology", isActive: false },
    ]

    setSettings(mockSettings)
    setStatuses(mockStatuses)
    setDoctors(mockDoctors)
  }, [])

  const handleSaveSettings = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSuccess("Settings saved successfully!")
    } catch (err) {
      setError("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const handleAddStatus = () => {
    const newStatus: AppointmentStatus = {
      id: Date.now(),
      name: "new_status",
      color: "#3B82F6",
      isActive: true,
    }
    setStatuses([...statuses, newStatus])
  }

  const handleUpdateStatus = (id: number, updates: Partial<AppointmentStatus>) => {
    setStatuses(statuses.map((status) => (status.id === id ? { ...status, ...updates } : status)))
  }

  const handleDeleteStatus = (id: number) => {
    setStatuses(statuses.filter((status) => status.id !== id))
  }

  const handleAddDoctor = () => {
    const newDoctor: Doctor = {
      id: Date.now(),
      name: "New Doctor",
      specialization: "General Medicine",
      isActive: true,
    }
    setDoctors([...doctors, newDoctor])
  }

  const handleUpdateDoctor = (id: number, updates: Partial<Doctor>) => {
    setDoctors(doctors.map((doctor) => (doctor.id === id ? { ...doctor, ...updates } : doctor)))
  }

  const handleDeleteDoctor = (id: number) => {
    setDoctors(doctors.filter((doctor) => doctor.id !== id))
  }

  if (!settings) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure system preferences and manage hospital data</p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="statuses" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Statuses
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
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
                  <Label htmlFor="sessionDuration">Session Duration (hours)</Label>
                  <Input
                    id="sessionDuration"
                    type="number"
                    value={settings.sessionDurationHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sessionDurationHours: Number.parseInt(e.target.value) || 24,
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
                        defaultSlotsPerDay: Number.parseInt(e.target.value) || 10,
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
              <CardTitle>Appointment Rules</CardTitle>
              <CardDescription>Configure booking rules and restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="maxAdvance">Maximum Advance Booking (days)</Label>
                <Input
                  id="maxAdvance"
                  type="number"
                  value={settings.maxAdvanceBookingDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxAdvanceBookingDays: Number.parseInt(e.target.value) || 14,
                    })
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Multiple Appointments</Label>
                    <p className="text-sm text-muted-foreground">Allow clients to have multiple future appointments</p>
                  </div>
                  <Switch
                    checked={settings.multipleAppointmentsAllowed}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        multipleAppointmentsAllowed: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Same Day Booking</Label>
                    <p className="text-sm text-muted-foreground">Allow booking appointments for the same day</p>
                  </div>
                  <Switch
                    checked={settings.sameDayBookingAllowed}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        sameDayBookingAllowed: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Recurring Appointments</Label>
                    <p className="text-sm text-muted-foreground">Enable recurring appointment feature</p>
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
                    <p className="text-sm text-muted-foreground">Enable waitlist for fully booked slots</p>
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
                    <p className="text-sm text-muted-foreground">Reserve slots for emergency appointments</p>
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

        <TabsContent value="statuses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Appointment Statuses</CardTitle>
                  <CardDescription>Manage appointment status types and colors</CardDescription>
                </div>
                <Button onClick={handleAddStatus}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Status
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statuses.map((status) => (
                  <div key={status.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: status.color }} />
                      <div className="flex-1">
                        <Input
                          value={status.name}
                          onChange={(e) => handleUpdateStatus(status.id, { name: e.target.value })}
                          className="font-medium"
                        />
                      </div>
                      <Input
                        type="color"
                        value={status.color}
                        onChange={(e) => handleUpdateStatus(status.id, { color: e.target.value })}
                        className="w-16"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={status.isActive}
                        onCheckedChange={(checked) => handleUpdateStatus(status.id, { isActive: checked })}
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteStatus(status.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>Configure SMS settings and templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications Enabled</Label>
                  <p className="text-sm text-muted-foreground">Send SMS for OTP and appointment reminders</p>
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
                <Textarea id="otpTemplate" placeholder="Your OTP code is: {otp}. Valid for 10 minutes." rows={3} />
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

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Tabs>
    </div>
  )
}
