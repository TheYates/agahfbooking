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
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import Link from "next/link";
import { QuickBookingDialogConvex as QuickBookingDialog } from "@/components/ui/quick-booking-dialog-convex";
import type { User } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface DashboardClientProps {
  user: User;
}

interface DashboardStats {
  upcomingAppointments: number;
  totalAppointments: number;
  completedAppointments: number;
  availableSlots: number;
  daysUntilNext: number | null;
  recentAppointments: Array<{
    id: string;
    date: string;
    slotNumber: number;
    status: string;
    doctorName: string;
    departmentName: string;
    departmentColor: string;
    clientName?: string; // For staff view
    clientXNumber?: string; // For staff view
  }>;
}

export function DashboardClientConvex({ user }: DashboardClientProps) {
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const queryClient = useQueryClient();

  // Check if client has convexId
  const hasConvexId = user.role !== "client" || !!user.convexId;

  // Fetch dashboard statistics using Convex
  const clientStats = useQuery(
    api.queries.getClientDashboardStats,
    user.role === "client" && user.convexId
      ? { clientId: user.convexId as Id<"clients"> }
      : "skip"
  );

  const staffStats = useQuery(
    api.queries.getStaffDashboardStats,
    user.role !== "client" ? {} : "skip"
  );

  // Use the appropriate stats based on user role
  const stats = user.role === "client" ? clientStats : staffStats;
  const loading = hasConvexId && stats === undefined;
  const error = !hasConvexId 
    ? "User account not fully migrated to Convex. Please contact support."
    : stats === null 
    ? "Failed to load dashboard data" 
    : "";

  // Note: Prefetching removed - quick booking dialog will fetch data when opened
  // This avoids calling old PostgreSQL API routes during dashboard load

  // Helper function to get status colors
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
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

  const handleTimeSlotSelect = (
    day: string,
    time: string,
    doctorId: number
  ) => {
    // Handle booking logic here
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show error state if user account needs migration
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100">
              Account Migration Required
            </CardTitle>
            <CardDescription className="text-red-700 dark:text-red-200">
              Your account needs to be updated to work with the new system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              Please log out and log back in to refresh your session. This will only take a moment.
            </p>
            <Button onClick={handleLogout} variant="destructive">
              Log Out and Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user.role === "client" ? user.name : `${user.name}`}!
        </h1>
        <p className="text-muted-foreground">
          {user.role === "client"
            ? "Here's what's happening with your appointments today."
            : "Here's today's appointment overview and system status."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user.role === "client"
                ? "Upcoming Appointments"
                : "Upcoming This Week"}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
              ) : (
                stats?.upcomingAppointments || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <span className="inline-block animate-pulse bg-gray-200 h-4 w-24 rounded"></span>
              ) : user.role === "client" ? (
                stats?.daysUntilNext !== null && stats?.daysUntilNext !== undefined ? (
                  `Next appointment in ${stats.daysUntilNext} day${
                    stats.daysUntilNext !== 1 ? "s" : ""
                  }`
                ) : (
                  "No upcoming appointments"
                )
              ) : (
                "Next 7 days"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user.role === "client"
                ? "Total Appointments"
                : "Total This Month"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
              ) : (
                stats?.totalAppointments || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user.role === "client" ? "Completed" : "Completed Today"}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
              ) : (
                stats?.completedAppointments || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.role === "client"
                ? "Successfully completed"
                : "Today's completed"}
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
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
              ) : (
                stats?.availableSlots || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.role === "client" ? "This week" : "Today"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {user.role === "client" && (
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
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <p className="font-bold">⚡ Quick Booking</p>

                  <p className="text-sm text-muted-foreground">
                    Fast appointment scheduling
                  </p>
                </button>
                <Link href="/dashboard/calendar" className="block">
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                    <p className="font-medium">View Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      See all your appointments
                    </p>
                  </button>
                </Link>
                <Link href="/dashboard/profile" className="block">
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                    <p className="font-medium">Update Profile</p>
                    <p className="text-sm text-muted-foreground">
                      Manage your information
                    </p>
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Appointments</CardTitle>
                <CardDescription>
                  {user.role === "client"
                    ? "Your latest appointment activity"
                    : "Today's appointment activity"}
                </CardDescription>
              </div>
              {user.role === "client" && (
                <Link href="/dashboard/my-appointments">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm">Loading appointments...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-600">
                <p className="text-sm">Error: {error}</p>
              </div>
            ) : !stats?.recentAppointments || stats.recentAppointments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No recent appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {user.role === "client"
                          ? appointment.doctorName || appointment.departmentName
                          : appointment.clientName ||
                            `Client ${appointment.clientXNumber}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.role !== "client" && appointment.doctorName && (
                          <span>{appointment.doctorName} • </span>
                        )}
                        {new Date(appointment.date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}{" "}
                        - Slot {appointment.slotNumber}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 text-xs rounded-full capitalize"
                      style={{
                        backgroundColor:
                          getStatusColor(appointment.status) + "20",
                        color: getStatusColor(appointment.status),
                      }}
                    >
                      {appointment.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {user.role === "client" && (
        <QuickBookingDialog
          isOpen={isQuickBookingOpen}
          onClose={() => setIsQuickBookingOpen(false)}
          onTimeSlotSelect={handleTimeSlotSelect}
          userRole={user.role}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
