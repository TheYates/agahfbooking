"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import Link from "next/link";
import { QuickBookingDialog } from "@/components/ui/quick-booking-dialog";
import type { User } from "@/lib/types";

interface DashboardClientProps {
  user: User;
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);

  // Mock data - in real app, fetch from database
  const stats = {
    upcomingAppointments: 2,
    totalAppointments: 15,
    completedAppointments: 12,
    availableSlots: 8,
  };

  const handleTimeSlotSelect = (
    day: string,
    time: string,
    doctorId: number
  ) => {
    console.log(`Booking: ${day} at ${time} with doctor ${doctorId}`);
    // Handle booking logic here
  };

  const handleDoctorChange = (doctorId: number) => {
    console.log(`Doctor changed to: ${doctorId}`);
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    console.log(`Week navigation: ${direction}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your appointments today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Appointments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.upcomingAppointments}
            </div>
            <p className="text-xs text-muted-foreground">
              Next appointment in 2 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedAppointments}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Slots
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableSlots}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>Your latest appointment activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dr. Sarah Wilson</p>
                  <p className="text-sm text-muted-foreground">
                    Dec 28, 2024 - Slot 3
                  </p>
                </div>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Completed
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dr. Michael Brown</p>
                  <p className="text-sm text-muted-foreground">
                    Dec 30, 2024 - Slot 5
                  </p>
                </div>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Booked
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button
                onClick={() => setIsQuickBookingOpen(true)}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium">Quick Booking</p>
                <p className="text-sm text-muted-foreground">
                  Fast appointment scheduling
                </p>
              </button>
              <Link href="/dashboard/calendar" className="block">
                <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <p className="font-medium">View Calendar</p>
                  <p className="text-sm text-muted-foreground">
                    See all your appointments
                  </p>
                </button>
              </Link>
              <Link href="/dashboard/profile" className="block">
                <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <p className="font-medium">Update Profile</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your information
                  </p>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <QuickBookingDialog
        isOpen={isQuickBookingOpen}
        onClose={() => setIsQuickBookingOpen(false)}
        onTimeSlotSelect={handleTimeSlotSelect}
        onDoctorChange={handleDoctorChange}
        onWeekChange={handleWeekChange}
      />
    </div>
  );
}
