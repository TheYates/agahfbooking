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
import { Calendar, Clock, User as UserIcon, Building, Search, CheckCircle2, Sparkles, CircleDashed, XCircle, MapPin, UserX, RefreshCw, Check, ArrowRight, Zap, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
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
    departmentId: string
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-blue-100">
              {user.role === "client" ? "Upcoming" : "Upcoming This Week"}
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-100" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mt-2">
              {loading ? (
                <div className="animate-pulse bg-white/20 h-10 w-16 rounded"></div>
              ) : (
                stats?.upcomingAppointments || 0
              )}
            </div>
            <p className="text-xs text-blue-100 mt-2 font-medium">
              {loading ? (
                <span className="inline-block animate-pulse bg-white/20 h-4 w-24 rounded"></span>
              ) : user.role === "client" ? (
                stats?.daysUntilNext !== null && stats?.daysUntilNext !== undefined ? (
                  `Next in ${stats.daysUntilNext} day${stats.daysUntilNext !== 1 ? "s" : ""}`
                ) : (
                  "No upcoming"
                )
              ) : (
                "Next 7 days"
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {user.role === "client" ? "Total Appointments" : "Total This Month"}
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">
              {loading ? (
                <div className="animate-pulse bg-zinc-200 dark:bg-zinc-800 h-9 w-16 rounded"></div>
              ) : (
                stats?.totalAppointments || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              For this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {user.role === "client" ? "Completed" : "Completed Today"}
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">
              {loading ? (
                <div className="animate-pulse bg-zinc-200 dark:bg-zinc-800 h-9 w-16 rounded"></div>
              ) : (
                stats?.completedAppointments || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user.role === "client" ? "All time success" : "Today's completed"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {user.role === "client" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Quick Actions</h2>
            <div className="grid gap-3">
              <button
                onClick={() => setIsQuickBookingOpen(true)}
                className="group relative overflow-hidden p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-blue-500/50 hover:shadow-md transition-all duration-300 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Quick Booking</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Schedule a new appointment instantly</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </button>

              <Link href="/dashboard/calendar" className="block">
                <button className="w-full group relative overflow-hidden p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-violet-500/50 hover:shadow-md transition-all duration-300 text-left">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-50 to-transparent dark:from-violet-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">View Calendar</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Check your monthly schedule</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-violet-500 transition-colors" />
                  </div>
                </button>
              </Link>

              <Link href="/dashboard/profile" className="block">
                <button className="w-full group relative overflow-hidden p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-500/50 hover:shadow-md transition-all duration-300 text-left">
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Update Profile</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage your personal information</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </div>
                </button>
              </Link>
            </div>
          </div>
        )}

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                <CardDescription className="text-xs">
                  {user.role === "client"
                    ? "Your latest appointments"
                    : "Today's appointment activity"}
                </CardDescription>
              </div>
              {user.role === "client" && (
                <Link href="/dashboard/my-appointments">
                  <Button variant="ghost" size="sm" className="text-xs h-8 gap-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-xs">Loading appointments...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Error: {error}</p>
              </div>
            ) : !stats?.recentAppointments || stats.recentAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
                  <ClipboardList className="h-6 w-6 opacity-30" />
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No recent activity</p>
                <p className="text-xs mt-1">Your recent appointments will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stats.recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between py-4 group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 -mx-6 px-6 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                        <Building className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {user.role === "client"
                            ? appointment.doctorName || appointment.departmentName
                            : (appointment as any).clientName ||
                            `Client ${(appointment as any).clientXNumber}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {new Date(appointment.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                            <span className="mx-1.5">•</span>
                            Slot {appointment.slotNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const statusConfig: Record<string, { icon: any, label: string, className: string }> = {
                        booked: {
                          icon: Calendar,
                          label: "Booked",
                          className: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400"
                        },
                        confirmed: {
                          icon: CheckCircle2,
                          label: "Confirmed",
                          className: "bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/30 dark:border-cyan-800 dark:text-cyan-400"
                        },
                        arrived: {
                          icon: MapPin,
                          label: "Arrived",
                          className: "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-400"
                        },
                        waiting: {
                          icon: Clock,
                          label: "Waiting",
                          className: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-400"
                        },
                        completed: {
                          icon: Check,
                          label: "Completed",
                          className: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400"
                        },
                        no_show: {
                          icon: UserX,
                          label: "No Show",
                          className: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
                        },
                        cancelled: {
                          icon: XCircle,
                          label: "Cancelled",
                          className: "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                        },
                        rescheduled: {
                          icon: RefreshCw,
                          label: "Rescheduled",
                          className: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400"
                        }
                      };

                      const config = statusConfig[appointment.status] || {
                        icon: CircleDashed,
                        label: appointment.status,
                        className: "bg-zinc-50 border-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                      };

                      const StatusIcon = config.icon;

                      return (
                        <div className={cn(
                          "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-medium shadow-sm",
                          config.className
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          <span className="capitalize">{config.label}</span>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {
        user.role === "client" && (
          <QuickBookingDialog
            isOpen={isQuickBookingOpen}
            onClose={() => setIsQuickBookingOpen(false)}
            onTimeSlotSelect={handleTimeSlotSelect}
            userRole={user.role}
            currentUserId={user.id}
            currentClientId={user.convexId as Id<"clients">}
          />
        )
      }
    </div >
  );
}
