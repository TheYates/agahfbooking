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
import {
  Calendar,
  Clock,
  CheckCircle,
  PlusCircle,
  UserCog,
  ChevronRight,
  Lightbulb,
  Mail,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { QuickBookingDialogTanstack } from "@/components/ui/quick-booking-dialog-tanstack";
import type { User } from "@/lib/types";
import { formatDatabaseTimeForDisplay } from "@/lib/slot-time-utils";

// Import TanStack Query hook
import { useUnifiedDashboardStats } from "@/hooks/use-hospital-queries";

interface DashboardClientTanstackProps {
  user: User;
}

export function DashboardClientTanstack({
  user,
}: DashboardClientTanstackProps) {
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);

  // TanStack Query hook - This replaces ALL the useEffect and fetch logic!
  const {
    data: stats,
    isLoading: loading,
    error,
  } = useUnifiedDashboardStats(user.role, user.id);

  // Safe defaults for stats
  const defaultStats = {
    upcomingAppointments: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    availableSlots: 0,
    daysUntilNext: null,
    recentAppointments: [],
  };
  const currentStats = stats || defaultStats;

  // Helper function to get status colors
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending_review: "#F59E0B",
      reschedule_requested: "#DC2626",
      booked: "#3B82F6",
      confirmed: "#10B981",
      arrived: "#F59E0B",
      waiting: "#8B5CF6",
      completed: "#059669",
      no_show: "#EF4444",
      cancelled: "#6B7280",
      rescheduled: "#F97316",
    };
    return colors[status] || "#6B7280";
  };

  // Helper function to get status display label
  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending_review: "Pending Confirmation",
      reschedule_requested: "Reschedule Requested",
      booked: "Confirmed",
      confirmed: "Confirmed",
      arrived: "Arrived",
      waiting: "Waiting",
      completed: "Completed",
      no_show: "No Show",
      cancelled: "Cancelled",
      rescheduled: "Rescheduled",
    };
    return labels[status] || status;
  };

  const handleTimeSlotSelect = (
    day: string,
    time: string,
    doctorId: number
  ) => {
    // Handle booking logic here
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {user.role === "client" ? user.name : `${user.name}`}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {user.role === "client"
            ? "Here is what's happening with your health profile today."
            : "Here's today's appointment overview and system status."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Stats + Appointments) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Next Appointment (Featured) */}
            <div className="bg-card rounded-xl p-6 border shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-muted-foreground text-sm font-medium">
                  Next Appointment
                </p>
                <h3 className="text-2xl font-bold mt-2 leading-tight">
                  {loading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : currentStats.daysUntilNext !== null ? (
                    currentStats.daysUntilNext === 0 ? (
                      "Today"
                    ) : currentStats.daysUntilNext === 1 ? (
                      "Tomorrow"
                    ) : (
                      `In ${currentStats.daysUntilNext} Days`
                    )
                  ) : (
                    "No Upcoming"
                  )}
                </h3>
                <p className="text-muted-foreground text-xs mt-1">
                  {loading
                    ? "Checking schedule..."
                    : currentStats.daysUntilNext !== null
                      ? currentStats.recentAppointments[0]?.departmentName ||
                        "No details"
                      : "No details"}
                </p>
              </div>
              <CalendarCheck className="text-green-600 absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
            </div>

            {/* Card 2: Total Appointments */}
            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                Total Appointments
              </p>
              <h3 className="text-3xl font-bold mt-1">
                {loading ? (
                  <div className="animate-pulse bg-muted h-8 w-8 rounded"></div>
                ) : (
                  currentStats.totalAppointments
                )}
              </h3>
            </div>

            {/* Card 3: Completed Appointments */}
            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                Completed
              </p>
              <h3 className="text-3xl font-bold mt-1">
                {loading ? (
                  <div className="animate-pulse bg-muted h-8 w-8 rounded"></div>
                ) : (
                  currentStats.completedAppointments
                )}
              </h3>
            </div>
          </div>

          {/* Upcoming Appointments List */}
          <Card className="rounded-xl overflow-hidden border shadow-sm">
            <CardHeader className="border-b bg-card/50 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-bold">
                Upcoming Appointments
              </CardTitle>
              {user.role === "client" && (
                <Link href="/dashboard/my-appointments">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 font-semibold hover:bg-transparent p-0 h-auto"
                  >
                    View All
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm">Loading appointments...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  <p className="text-sm">failed to load appointments</p>
                </div>
              ) : currentStats.recentAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm mb-2">No upcoming appointments found</p>
                  {user.role === "client" && (
                    <Button
                      onClick={() => setIsQuickBookingOpen(true)}
                      variant="outline"
                      size="sm"
                    >
                      Book Now
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {currentStats.recentAppointments.map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground">
                        <span className="text-[10px] font-bold uppercase">
                          {new Date(appointment.date).toLocaleDateString(
                            "en-US",
                            { month: "short" }
                          )}
                        </span>
                        <span className="text-base font-bold leading-none">
                          {new Date(appointment.date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {user.role === "client"
                            ? appointment.doctorName ||
                              appointment.departmentName
                            : appointment.clientName ||
                              `Client ${appointment.clientXNumber}`}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {user.role !== "client" && appointment.doctorName && (
                            <span>{appointment.doctorName} • </span>
                          )}
                          {appointment.slotStartTime && appointment.slotEndTime 
                            ? `${formatDatabaseTimeForDisplay(appointment.slotStartTime)} - ${formatDatabaseTimeForDisplay(appointment.slotEndTime)}`
                            : `Slot ${appointment.slotNumber}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className="px-2 py-1 text-[10px] font-semibold rounded-full capitalize"
                          style={{
                            backgroundColor:
                              getStatusColor(appointment.status) + "20",
                            color: getStatusColor(appointment.status),
                          }}
                        >
                          {appointment.status}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(appointment.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {user.role === "client" && (
                <button
                  onClick={() => setIsQuickBookingOpen(true)}
                  className="w-full flex items-center justify-between p-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 group"
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className="w-5 h-5" />
                    <span className="font-semibold">Quick Booking</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              <Link href="/dashboard/calendar" className="block">
                <button className="w-full flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">View Calendar</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              <Link href="/dashboard/profile" className="block">
                <button className="w-full flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <UserCog className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">Update Profile</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* Health Tip */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400">
              <Lightbulb className="w-5 h-5" />
              <h3 className="font-bold">Health Tip</h3>
            </div>
            <p className="text-sm text-muted-foreground italic">
              "Regular check-ups are the best way to prevent long-term health
              issues. Don't forget to stay hydrated today!"
            </p>
          </div>

          {/* Need Help */}
          <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-2">Need Help?</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Contact our support desk for assistance with bookings.
              </p>
              <a
                href="mailto:support@agahf.com"
                className="text-primary font-bold flex items-center gap-2 hover:underline"
              >
                <Mail className="w-4 h-4" />
                support@agahf.com
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Quick Booking Dialog with TanStack Query */}
      {user.role === "client" && (
        <QuickBookingDialogTanstack
          isOpen={isQuickBookingOpen}
          onClose={() => setIsQuickBookingOpen(false)}
          onTimeSlotSelect={handleTimeSlotSelect}
          userRole={user.role}
          currentUserId={user.id}
          clientInfo={{
            id: user.id,
            name: user.name,
            x_number: user.xNumber,
            phone: user.phone ?? undefined,
            category: user.category ?? undefined,
          }}
        />
      )}
    </div>
  );
}
