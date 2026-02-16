// @ts-nocheck
"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  Plus,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDatabaseTimeForDisplay } from "@/lib/slot-time-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDescriptionText,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RescheduleReasonSelector } from "@/components/reschedule-reason-selector";
import { useBooking } from "@/components/mobile-layout";
import type { User } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// 🚀 Import TanStack Query hooks
import {
  useCalendarData,
} from "@/hooks/use-hospital-queries";
import { useAppointmentReminders } from "@/hooks/use-appointment-reminders";

interface MobileCalendarClientTanstackProps {
  user: User;
  userRole: "client" | "receptionist" | "admin" | "reviewer";
  currentUserId?: number;
}

export function MobileCalendarClientTanstack({
  user,
  userRole,
  currentUserId,
}: MobileCalendarClientTanstackProps) {
  // Local state - simplified!
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<"all" | "my" | "department">("all");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Get booking function from context
  let openBooking: ((departmentId?: number) => void) | undefined;
  try {
    const booking = useBooking();
    openBooking = booking.openBooking;
  } catch {
    // Not within MobileLayout context
  }

  // 🚀 TanStack Query: Replace ALL fetch logic with one hook!
  const {
    departments,
    appointments,
    isLoading: loading,
    error,
    isRefetching,
    refetch,
  } = useCalendarData(userRole, currentUserId || user.id, view, currentDate);

  const queryClient = useQueryClient();

  // Schedule local reminders for upcoming appointments
  useAppointmentReminders(appointments, user.id);

  const confirmMutation = useMutation({
    mutationFn: async ({ appointmentId, notes }: { appointmentId: number; notes?: string }) => {
      const response = await fetch("/api/appointments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, notes }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to confirm appointment");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      refetch();
      setConfirmDialogOpen(false);
      setSelectedAppointment(null);
      setConfirmNotes("");
      toast.success("Appointment confirmed successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to confirm appointment");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ appointmentId, reason }: { appointmentId: number; reason: string }) => {
      const response = await fetch("/api/appointments/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, reason }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to request reschedule");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      refetch();
      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      setRescheduleReason("");
      toast.success("Reschedule request sent");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to request reschedule");
    },
  });

  // Calendar navigation
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      const diff = direction === "prev" ? -7 : 7;
      newDate.setDate(prev.getDate() + diff);
      return newDate;
    });
  };

  // Get days for current view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getWeekDays = (date: Date) => {
    const days: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];

    const filteredApts = appointments.filter((apt) => {
      try {
        let aptDateStr = apt.date;

        // If the appointment date is already in ISO format (YYYY-MM-DD)
        if (typeof aptDateStr === "string" && aptDateStr.includes("-")) {
          aptDateStr = aptDateStr.split("T")[0]; // Remove time part if present
        } else {
          const aptDate = new Date(apt.date);

          if (isNaN(aptDate.getTime())) {
            console.warn(
              `Invalid appointment date: ${apt.date} for appointment ID: ${apt.id}`
            );
            return false;
          }

          aptDateStr = aptDate.toISOString().split("T")[0];
        }

        return aptDateStr === dateStr;
      } catch (error) {
        console.error(
          `Error processing appointment date: ${apt.date} for appointment ID: ${apt.id}`,
          error
        );
        return false;
      }
    });

    return filteredApts;
  };

  // Get status color
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

  // Get status label for display
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

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Render month view
  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);

    return (
      <div className="space-y-4">
        {/* Calendar Grid */}
        <div className="bg-card rounded-lg border">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-px bg-border">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="bg-card p-2 h-20 md:h-24" />;
              }

              const dayAppointments = getAppointmentsForDate(day);
              const isDateToday = isToday(day);
              const isPast = isPastDate(day);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "bg-card p-2 h-20 md:h-24 flex flex-col items-start text-left transition-colors hover:bg-muted",
                    isDateToday && "bg-primary/10 border-2 border-primary",
                    isPast && "opacity-60",
                    selectedDate?.toDateString() === day.toDateString() &&
                      "bg-primary/20"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isDateToday && "text-primary font-bold",
                      isPast && "text-muted-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>

                  {/* Appointment indicators */}
                  <div className="flex flex-wrap gap-1 mt-1 w-full">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getStatusColor(apt.status) }}
                      />
                    ))}
                    {dayAppointments.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{dayAppointments.length - 2}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isDateToday = isToday(day);
            const isPast = isPastDate(day);

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  isDateToday && "bg-primary/10 border-primary",
                  isPast && "opacity-60",
                  selectedDate?.toDateString() === day.toDateString() &&
                    "bg-primary/20",
                  "hover:bg-muted"
                )}
              >
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div
                    className={cn(
                      "text-lg font-semibold",
                      isDateToday && "text-primary"
                    )}
                  >
                    {day.getDate()}
                  </div>
                  <div className="flex justify-center mt-2">
                    {dayAppointments.length > 0 && (
                      <div className="flex gap-1">
                        {dayAppointments.slice(0, 3).map((apt) => (
                          <div
                            key={apt.id}
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: getStatusColor(apt.status),
                            }}
                          />
                        ))}
                        {dayAppointments.length > 3 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            +{dayAppointments.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render selected date appointments
  const renderSelectedDateAppointments = () => {
    if (!selectedDate) return null;

    const dayAppointments = getAppointmentsForDate(selectedDate);
    const dateString = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{dateString}</CardTitle>
                <CardDescription>
                  {dayAppointments.length} appointment
                  {dayAppointments.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              {userRole === "client" && openBooking && (
                <Button onClick={() => openBooking()} size="sm" className="h-8">
                  <Plus className="h-4 w-4 mr-1" />
                  Book
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {dayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No appointments scheduled</p>
                {userRole === "client" && openBooking && (
                  <Button
                    onClick={() => openBooking()}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {dayAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-base">
                            {appointment.departmentName}
                          </h3>
                          <span
                            className="px-2 py-1 text-xs rounded-full font-medium"
                            style={{
                              backgroundColor:
                                getStatusColor(appointment.status) + "20",
                              color: getStatusColor(appointment.status),
                            }}
                          >
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {appointment.slotStartTime && appointment.slotEndTime 
                                ? `${formatDatabaseTimeForDisplay(appointment.slotStartTime)} - ${formatDatabaseTimeForDisplay(appointment.slotEndTime)}`
                                : `Slot ${appointment.slotNumber}`}
                            </span>
                          </div>

                          {appointment.doctorName && (
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>{appointment.doctorName}</span>
                            </div>
                          )}

                          {userRole !== "client" && (
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>{appointment.clientName}</span>
                            </div>
                          )}
                        </div>

                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                            {appointment.notes}
                          </p>
                        )}

                        {userRole === "reviewer" && appointment.status === "pending_review" && (
                          <div className="mt-4 flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setConfirmNotes("");
                                setConfirmDialogOpen(true);
                              }}
                              disabled={confirmMutation.isPending || rescheduleMutation.isPending}
                            >
                              Confirm Appointment
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setRescheduleReason("");
                                setRescheduleDialogOpen(true);
                              }}
                              disabled={confirmMutation.isPending || rescheduleMutation.isPending}
                            >
                              Request Reschedule
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col space-y-4">
        {/* Navigation and View Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                view === "month" ? navigateMonth("prev") : navigateWeek("prev")
              }
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
              {view === "week" &&
                ` - Week of ${currentDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}`}
            </h2>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                view === "month" ? navigateMonth("next") : navigateWeek("next")
              }
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* View Switcher */}
          <div className="flex rounded-lg border p-1">
            <button
              onClick={() => setView("month")}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                view === "month"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                view === "week"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              Week
            </button>
          </div>
        </div>

        {/* Quick Book Button for Clients */}
        {userRole === "client" && openBooking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={() => openBooking()}
              className="w-full h-12 text-base font-semibold"
              size="lg"
              disabled={loading}
            >
              <Plus className="h-5 w-5 mr-2" />
              Book New Appointment
            </Button>
          </motion.div>
        )}
      </div>

      {/* Loading State */}
      {loading && appointments.length === 0 ? (
        <div className="space-y-4">
          {/* Calendar skeleton */}
          <div className="bg-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
          {/* Selected date skeleton */}
          <div className="bg-card rounded-xl p-4 space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      ) : (
        <>
          {/* Calendar View */}
          {view === "month" ? renderMonthView() : renderWeekView()}

          {/* Selected Date Appointments */}
          {renderSelectedDateAppointments()}
        </>
      )}

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="w-[90vw] rounded-2xl top-[40%]">
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescriptionText>
              Are you sure you want to confirm this appointment?
            </DialogDescriptionText>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-2 block">Notes (Optional)</Label>
            <Textarea
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              placeholder="Add reviewer notes..."
            />
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={confirmMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() =>
                selectedAppointment &&
                confirmMutation.mutate({
                  appointmentId: selectedAppointment.id,
                  notes: confirmNotes.trim() || undefined,
                })
              }
              disabled={!selectedAppointment || confirmMutation.isPending}
            >
              {confirmMutation.isPending ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="w-[90vw] rounded-2xl top-[40%]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Request Reschedule</DialogTitle>
            <DialogDescriptionText>
              Send a request to reschedule this appointment.
            </DialogDescriptionText>
          </DialogHeader>
          <div className="py-2">
            <RescheduleReasonSelector
              value={rescheduleReason}
              onChange={setRescheduleReason}
              placeholder="Why is a reschedule needed?"
              required
            />
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => setRescheduleDialogOpen(false)}
              disabled={rescheduleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() =>
                selectedAppointment &&
                rescheduleMutation.mutate({
                  appointmentId: selectedAppointment.id,
                  reason: rescheduleReason.trim(),
                })
              }
              disabled={!selectedAppointment || !rescheduleReason.trim() || rescheduleMutation.isPending}
            >
              {rescheduleMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
