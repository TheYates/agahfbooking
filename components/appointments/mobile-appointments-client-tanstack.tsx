"use client";

import { useState } from "react";
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
  Users,
  CheckCircle,
  Plus,
  Filter,
  Search,
  MoreVertical,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBooking } from "@/components/mobile-layout";
import type { User } from "@/lib/types";
import { DataPaginationCompact } from "@/components/ui/data-pagination";

// Import TanStack Query hooks
import {
  useDashboardStats,
  useClientAppointmentsPaginated,
} from "@/hooks/use-hospital-queries";

interface MobileAppointmentsClientTanstackProps {
  user: User;
}

interface Appointment {
  id: number;
  date: string;
  slotNumber: number;
  status: string;
  doctorName: string;
  departmentName: string;
  departmentColor: string;
  notes?: string;
  location?: string;
}

export function MobileAppointmentsClientTanstack({
  user,
}: MobileAppointmentsClientTanstackProps) {
  // Local state for filters and pagination - much simpler now!
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // TanStack Query hooks - This replaces ALL the useEffect and fetch logic!
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats(user.id);

  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    isPreviousData,
  } = useClientAppointmentsPaginated(user.id, currentPage, itemsPerPage);

  // Get booking function from context
  let openBooking: ((departmentId?: number) => void) | undefined;
  try {
    const booking = useBooking();
    openBooking = booking.openBooking;
  } catch {
    // Not within MobileLayout context
  }

  // Extract data with safe defaults
  const appointments = appointmentsData?.data || [];
  const pagination = appointmentsData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const defaultStats = {
    upcomingAppointments: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    availableSlots: 0,
    daysUntilNext: null,
  };
  const currentStats = stats || defaultStats;

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

  // Filter appointments
  const filteredAppointments = appointments.filter((appointment: Appointment) => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();

    if (filter === "upcoming") {
      return (
        appointmentDate >= now &&
        !["completed", "cancelled", "no_show"].includes(appointment.status)
      );
    } else if (filter === "completed") {
      return ["completed", "cancelled", "no_show"].includes(appointment.status);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Grid - Now powered by TanStack Query! */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="touch-target">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Upcoming
                  </p>
                  <p className="text-xl font-bold">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                    ) : (
                      currentStats.upcomingAppointments
                    )}
                  </p>
                </div>
              </div>
              {!statsLoading && currentStats.daysUntilNext !== null && (
                <p className="text-xs text-muted-foreground mt-2">
                  Next in {currentStats.daysUntilNext} day
                  {currentStats.daysUntilNext !== 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="touch-target">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Completed
                  </p>
                  <p className="text-xl font-bold">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                    ) : (
                      currentStats.completedAppointments
                    )}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">This month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="touch-target">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Total
                  </p>
                  <p className="text-xl font-bold">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                    ) : (
                      currentStats.totalAppointments
                    )}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">All time</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="touch-target">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Available
                  </p>
                  <p className="text-xl font-bold">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                    ) : (
                      currentStats.availableSlots
                    )}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">This week</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* TanStack Query Status (Development) */}
      {process.env.NODE_ENV === "development" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-muted/50 rounded-lg p-3 text-xs"
        >
          <p className="font-medium mb-1">🚀 TanStack Query Status:</p>
          <p>
            Stats: {statsLoading ? "Loading..." : statsError ? "Error" : "✅ Cached"} •{" "}
            Appointments: {appointmentsLoading ? "Loading..." : appointmentsError ? "Error" : "✅ Cached"} •{" "}
            Page: {currentPage}/{pagination.totalPages} •{" "}
            Previous Data: {isPreviousData ? "Yes" : "No"}
          </p>
        </motion.div>
      )}

      {/* Quick Book Button */}
      {openBooking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={() => openBooking()}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Book New Appointment
          </Button>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex space-x-1 bg-muted p-1 rounded-lg"
      >
        {[
          { key: "all", label: "All" },
          { key: "upcoming", label: "Upcoming" },
          { key: "completed", label: "History" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={cn(
              "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all",
              filter === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Appointments List - TanStack Query powered! */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {filter === "all"
                ? "All Appointments"
                : filter === "upcoming"
                ? "Upcoming Appointments"
                : "Appointment History"}
            </CardTitle>
            <CardDescription className="text-sm">
              {appointmentsLoading ? (
                <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
              ) : (
                <>
                  {filteredAppointments.length} appointment
                  {filteredAppointments.length !== 1 ? "s" : ""} • Page{" "}
                  {pagination.currentPage} of {pagination.totalPages}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsLoading && currentPage === 1 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="ml-3 text-muted-foreground">Loading appointments...</p>
              </div>
            ) : appointmentsError ? (
              <div className="text-center py-8 text-destructive">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Error loading appointments</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {appointmentsError.message}
                </p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  No {filter !== "all" ? filter : ""} appointments
                </p>
                {filter === "upcoming" && openBooking && (
                  <Button
                    onClick={() => openBooking()}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Book Your First Appointment
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Show loading indicator for page changes */}
                {appointmentsLoading && isPreviousData && (
                  <div className="text-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                  </div>
                )}

                {filteredAppointments.map((appointment: Appointment, index: number) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: appointmentsLoading && isPreviousData ? 0.6 : 1, 
                      x: 0 
                    }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-base">
                            {appointment.departmentName}
                          </h3>
                          <span
                            className="px-2 py-1 text-xs rounded-full capitalize font-medium"
                            style={{
                              backgroundColor:
                                getStatusColor(appointment.status) + "20",
                              color: getStatusColor(appointment.status),
                            }}
                          >
                            {appointment.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <CalendarDays className="h-4 w-4" />
                            <span>
                              {new Date(appointment.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>Slot {appointment.slotNumber}</span>
                          </div>

                          {appointment.doctorName && (
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>{appointment.doctorName}</span>
                            </div>
                          )}

                          {appointment.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{appointment.location}</span>
                            </div>
                          )}
                        </div>

                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                            {appointment.notes}
                          </p>
                        )}
                      </div>

                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination with TanStack Query keepPreviousData */}
            {pagination.totalPages > 1 && (
              <DataPaginationCompact
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                className="px-6 pb-4"
                disabled={appointmentsLoading} // Prevent rapid pagination clicks
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}