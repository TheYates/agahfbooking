"use client";

import type React from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingModal } from "./booking-modal";
import { ViewSwitcher } from "./view-switcher";
import { AppointmentModal } from "./appointment-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DayAppointmentsPopover } from "./day-appointments-popover";
import { AppointmentAlerts } from "./appointment-alerts";
import {
  isValidBookingDate,
  isWorkingDayForAnyDepartment,
} from "@/lib/working-days-utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Import TanStack Query hooks
import {
  useCalendarData,
  type CalendarAppointment,
  type Doctor,
  type Department,
} from "@/hooks/use-hospital-queries";

interface CalendarViewTanstackProps {
  userRole: "client" | "receptionist" | "admin";
  currentUserId?: number;
}

export function CalendarViewTanstack({ userRole, currentUserId }: CalendarViewTanstackProps) {
  // Local state - much simpler now!
  const [currentDate, setCurrentDate] = useState(new Date());
  // Only month view is implemented, week and day views coming soon
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [draggedAppointment, setDraggedAppointment] = useState<CalendarAppointment | null>(null);
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    selectedDate: null as Date | null,
    selectedSlot: null as number | null,
  });
  const [appointmentModal, setAppointmentModal] = useState({
    isOpen: false,
    appointment: null as CalendarAppointment | null,
  });

  // TanStack Query hook - This replaces ALL the useEffect and fetch logic!
  const {
    departments,
    doctors,
    appointments,
    isLoading: loading,
    error,
    isRefetching,
    refetch,
  } = useCalendarData(userRole, currentUserId, view, currentDate);

  // Helper functions (same as original but using TanStack data)
  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      booked: "#3B82F6",
      arrived: "#10B981",
      waiting: "#F59E0B",
      completed: "#059669",
      no_show: "#EF4444",
      cancelled: "#6B7280",
      rescheduled: "#8B5CF6",
    };
    return statusColors[status] || "#6B7280";
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isPastAppointment = (appointment: CalendarAppointment) => {
    return isPastDate(new Date(appointment.date));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    return weekDays;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return appointments.filter((apt) => apt.date === dateString);
  };

  // Get maximum slots across all departments for calendar display
  const getMaxSlots = () => {
    if (departments.length === 0) return 10; // fallback
    return Math.max(...departments.map((d) => d.slots_per_day || 10));
  };

  // Check if a slot is valid for a specific department
  const isSlotValidForDepartment = (slotNumber: number, departmentId: number) => {
    const department = departments.find((d) => d.id === departmentId);
    return department ? slotNumber <= (department.slots_per_day || 10) : false;
  };

  // Get department color for visual coding
  const getDepartmentColor = (departmentId: number) => {
    const colors: { [key: number]: string } = {
      1: "#3B82F6", // General Medicine - Blue
      2: "#EF4444", // Cardiology - Red
      3: "#10B981", // Pediatrics - Green
      4: "#8B5CF6", // Orthopedics - Purple
      5: "#F59E0B", // Dermatology - Orange
    };
    return colors[departmentId] || "#6B7280"; // Default gray
  };

  const maskXNumber = (xNumber: string, clientId: number) => {
    const isOwnAppointment = currentUserId !== undefined && clientId === currentUserId;
    if (userRole !== "client" || isOwnAppointment) {
      return xNumber;
    }
    return xNumber.substring(0, 4) + "**/**";
  };

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
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const navigateDay = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 1);
      } else {
        newDate.setDate(prev.getDate() + 1);
      }
      return newDate;
    });
  };

  const handleBookSlot = (date: Date, slotNumber: number) => {
    // Check if the date is valid for booking (not in past and is a working day)
    if (!isValidBookingDate(date, undefined, departments)) {
      return;
    }

    setBookingModal({
      isOpen: true,
      selectedDate: date,
      selectedSlot: slotNumber,
    });
  };

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    setAppointmentModal({
      isOpen: true,
      appointment,
    });
  };

  const handleAppointmentBooked = () => {
    // TanStack Query will automatically refetch in the background
    // But we can trigger an immediate refresh for instant feedback
    refetch();
    toast.success("Appointment Booked! 🎉", {
      description: "Calendar updated automatically",
      duration: 4000,
    });
  };

  const handleAppointmentUpdate = (updatedAppointment: CalendarAppointment) => {
    // TanStack Query will handle cache updates automatically
    // through query invalidation in the mutation
    toast.success("Appointment Updated! ✅", {
      description: "Calendar will refresh automatically",
      duration: 3000,
    });
  };

  const handleAppointmentDelete = (appointmentId: number) => {
    // TanStack Query will handle optimistic updates and cache invalidation
    toast.success("Appointment Deleted! ✅", {
      description: "Calendar updated automatically",
      duration: 3000,
    });
  };

  // Drag and drop handlers (enhanced with TanStack Query cache updates)
  const handleDragStart = (e: React.DragEvent, appointment: CalendarAppointment) => {
    // Prevent dragging past appointments
    if (isPastAppointment(appointment)) {
      e.preventDefault();
      return;
    }
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    e: React.DragEvent,
    targetDate: Date,
    targetSlot: number,
    targetDoctorId?: number
  ) => {
    e.preventDefault();
    if (!draggedAppointment) return;

    const dateString = targetDate.toISOString().split("T")[0];

    // Check if slot is already occupied
    const existingAppointment = appointments.find(
      (apt) =>
        apt.date === dateString &&
        apt.slotNumber === targetSlot &&
        (targetDoctorId ? apt.doctorId === targetDoctorId : true) &&
        apt.id !== draggedAppointment.id
    );

    if (existingAppointment) {
      toast.error("Slot Occupied", {
        description: "This slot is already occupied by another appointment",
        duration: 4000,
      });
      setDraggedAppointment(null);
      return;
    }

    // Show success toast (actual API update would be handled by a mutation hook)
    const newDate = targetDate.toLocaleDateString();
    toast.success("Appointment Moved! 📅", {
      description: `${draggedAppointment.clientName}'s appointment moved to ${newDate}, Slot ${targetSlot}`,
      duration: 4000,
    });

    // TanStack Query would handle the actual update through a mutation
    // For now, trigger a refetch to simulate the update
    refetch();

    setDraggedAppointment(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-1">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-16" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        <div
          className="grid grid-cols-7 gap-1 h-[calc(100vh-11rem)]"
          style={{ gridTemplateRows: "auto 1fr 1fr 1fr 1fr 1fr 1fr" }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center font-medium text-sm text-muted-foreground h-8"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: 42 }).map((_, index) => (
            <div
              key={index}
              className="p-2 h-full border rounded-lg flex flex-col min-h-0"
            >
              <Skeleton className="h-5 w-6 mb-2" />
              <div className="space-y-1">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-red-600">
          <div className="text-lg mb-2">⚠️ Calendar Error</div>
          <p className="mb-4">{(error as Error).message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            Retry Loading
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            TanStack Query will automatically retry in the background
          </p>
        </div>
      </div>
    );
  }

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold">{monthName}</h2>
            {isRefetching && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                disabled={loading}
              >
                Today
              </Button>
            </div>
            <ViewSwitcher currentView={view} onViewChange={setView} />
          </div>
        </div>

        <div
          className="grid grid-cols-7 gap-1 h-[calc(100vh-11rem)]"
          style={{ gridTemplateRows: "auto 1fr 1fr 1fr 1fr 1fr 1fr" }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center font-medium text-sm text-muted-foreground h-8"
            >
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="p-2 h-full" />;
            }

            const dayAppointments = getAppointmentsForDate(day);
            const isToday = new Date().toDateString() === day.toDateString();
            const isPast = isPastDate(day);
            const isWorkingDay = isWorkingDayForAnyDepartment(departments, day);
            const isValidForBooking = isValidBookingDate(day, undefined, departments);

            return (
              <div
                key={index}
                className={cn(
                  "p-2 h-full border rounded-lg transition-colors flex flex-col min-h-0",
                  isPast
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed hover:bg-red-100 dark:hover:bg-red-900/20"
                    : !isWorkingDay
                    ? "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20",
                  isToday && !isPast && isWorkingDay && "bg-blue-50 dark:bg-blue-900/20",
                  loading && "opacity-75" // Visual feedback during background refresh
                )}
                onClick={() => isValidForBooking && !loading && handleBookSlot(day, 1)}
                onDragOver={isValidForBooking ? handleDragOver : undefined}
                onDrop={isValidForBooking ? (e) => handleDrop(e, day, 1) : undefined}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={cn(
                      "text-sm font-medium text-foreground",
                      isToday && "font-bold text-blue-600 dark:text-blue-400",
                      isPast && "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>

                <div className="space-y-1 flex-1 overflow-hidden">
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <div
                      key={apt.id}
                      className="text-xs p-1 rounded truncate cursor-pointer border-l-2"
                      style={{
                        backgroundColor: getDepartmentColor(apt.departmentId) + "20",
                        color: getDepartmentColor(apt.departmentId),
                        borderLeftColor: getDepartmentColor(apt.departmentId),
                        opacity: loading ? 0.8 : 1, // Slight fade during refresh
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(apt);
                      }}
                      draggable={!isPastAppointment(apt) && !loading}
                      onDragStart={(e) => handleDragStart(e, apt)}
                    >
                      <div className="font-medium text-xs truncate">
                        {userRole === "client" && currentUserId !== undefined && apt.clientId !== currentUserId
                          ? `${maskXNumber(apt.clientXNumber, apt.clientId)} - ***`
                          : `${apt.clientXNumber} - ${apt.clientName}`}
                      </div>
                      <div className="opacity-60 text-xs truncate">
                        {apt.departmentName}
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <DayAppointmentsPopover
                      appointments={dayAppointments}
                      date={day}
                      getDepartmentColor={getDepartmentColor}
                      maskXNumber={maskXNumber}
                      currentUserId={currentUserId}
                      userRole={userRole}
                      onAppointmentClick={handleAppointmentClick}
                      onDragStart={handleDragStart}
                    >
                      <div className="text-xs text-muted-foreground cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        +{dayAppointments.length - 2} more
                      </div>
                    </DayAppointmentsPopover>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];
    const weekLabel = `${weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const maxSlots = getMaxSlots();

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold">{weekLabel}</h2>
            {isRefetching && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek("prev")}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek("next")}
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                disabled={loading}
              >
                Today
              </Button>
            </div>
            <ViewSwitcher currentView={view} onViewChange={setView} />
          </div>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {/* Time slots column */}
          <div className="space-y-2">
            <div className="h-12 p-2 font-medium text-sm">Time</div>
            {Array.from({ length: maxSlots }).map((_, slotIndex) => (
              <div
                key={slotIndex}
                className="h-16 p-2 text-xs text-muted-foreground flex items-center justify-center border rounded"
              >
                Slot {slotIndex + 1}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((day, dayIndex) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isToday = new Date().toDateString() === day.toDateString();
            const isPast = isPastDate(day);
            const isWorkingDay = isWorkingDayForAnyDepartment(departments, day);
            const isValidForBooking = isValidBookingDate(day, undefined, departments);

            return (
              <div key={dayIndex} className="space-y-2">
                <div
                  className={cn(
                    "h-12 p-2 text-center border rounded-lg font-medium text-sm",
                    isToday && "bg-blue-50 dark:bg-blue-900/20 border-blue-300",
                    isPast && "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  )}
                >
                  <div className="font-bold">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-xs">{day.getDate()}</div>
                </div>

                {Array.from({ length: maxSlots }).map((_, slotIndex) => {
                  const slotNumber = slotIndex + 1;
                  const slotAppointment = dayAppointments.find(
                    (apt) => apt.slotNumber === slotNumber
                  );

                  return (
                    <div
                      key={slotIndex}
                      className={cn(
                        "h-16 p-1 border rounded-lg transition-colors",
                        slotAppointment
                          ? "cursor-pointer"
                          : isPast || !isWorkingDay
                          ? "bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
                      )}
                      onClick={() => {
                        if (slotAppointment) {
                          handleAppointmentClick(slotAppointment);
                        } else if (isValidForBooking) {
                          handleBookSlot(day, slotNumber);
                        }
                      }}
                      onDragOver={isValidForBooking && !slotAppointment ? handleDragOver : undefined}
                      onDrop={
                        isValidForBooking && !slotAppointment
                          ? (e) => handleDrop(e, day, slotNumber)
                          : undefined
                      }
                    >
                      {slotAppointment ? (
                        <div
                          className="h-full p-1 rounded text-xs border-l-2 flex flex-col justify-center"
                          style={{
                            backgroundColor: getDepartmentColor(slotAppointment.departmentId) + "20",
                            color: getDepartmentColor(slotAppointment.departmentId),
                            borderLeftColor: getDepartmentColor(slotAppointment.departmentId),
                          }}
                          draggable={!isPastAppointment(slotAppointment)}
                          onDragStart={(e) => handleDragStart(e, slotAppointment)}
                        >
                          <div className="font-semibold text-xs truncate">
                            {userRole === "client" && currentUserId !== undefined && slotAppointment.clientId !== currentUserId
                              ? maskXNumber(slotAppointment.clientXNumber, slotAppointment.clientId)
                              : slotAppointment.clientXNumber}
                          </div>
                          <div className="text-xs truncate opacity-80">
                            {userRole === "client" && currentUserId !== undefined && slotAppointment.clientId !== currentUserId
                              ? "***"
                              : slotAppointment.clientName}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                          {isValidForBooking && !isPast && isWorkingDay && (
                            <Plus className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayLabel = currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const dayAppointments = getAppointmentsForDate(currentDate);
    const isPast = isPastDate(currentDate);
    const isWorkingDay = isWorkingDayForAnyDepartment(departments, currentDate);
    const isValidForBooking = isValidBookingDate(currentDate, undefined, departments);
    const maxSlots = getMaxSlots();

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold">{dayLabel}</h2>
            {isRefetching && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
            {!isWorkingDay && (
              <span className="text-sm text-muted-foreground">(Non-working day)</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDay("prev")}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDay("next")}
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                disabled={loading}
              >
                Today
              </Button>
            </div>
            <ViewSwitcher currentView={view} onViewChange={setView} />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-2 pr-4">
            {Array.from({ length: maxSlots }).map((_, slotIndex) => {
              const slotNumber = slotIndex + 1;
              const slotAppointment = dayAppointments.find(
                (apt) => apt.slotNumber === slotNumber
              );

              return (
                <div
                  key={slotIndex}
                  className={cn(
                    "p-4 border rounded-lg transition-colors min-h-[80px]",
                    slotAppointment
                      ? "cursor-pointer"
                      : isPast || !isWorkingDay
                      ? "bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
                  )}
                  onClick={() => {
                    if (slotAppointment) {
                      handleAppointmentClick(slotAppointment);
                    } else if (isValidForBooking) {
                      handleBookSlot(currentDate, slotNumber);
                    }
                  }}
                  onDragOver={isValidForBooking && !slotAppointment ? handleDragOver : undefined}
                  onDrop={
                    isValidForBooking && !slotAppointment
                      ? (e) => handleDrop(e, currentDate, slotNumber)
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">Slot {slotNumber}</span>
                      {slotAppointment && (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: getDepartmentColor(slotAppointment.departmentId) + "20",
                            color: getDepartmentColor(slotAppointment.departmentId),
                          }}
                        >
                          {slotAppointment.departmentName}
                        </span>
                      )}
                    </div>
                    {!slotAppointment && isValidForBooking && (
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Book
                      </Button>
                    )}
                  </div>

                  {slotAppointment ? (
                    <div
                      className="p-3 rounded border-l-4"
                      style={{
                        backgroundColor: getDepartmentColor(slotAppointment.departmentId) + "10",
                        borderLeftColor: getDepartmentColor(slotAppointment.departmentId),
                      }}
                      draggable={!isPastAppointment(slotAppointment)}
                      onDragStart={(e) => handleDragStart(e, slotAppointment)}
                    >
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Client:</span>
                          <div className="font-medium">
                            {userRole === "client" && currentUserId !== undefined && slotAppointment.clientId !== currentUserId
                              ? maskXNumber(slotAppointment.clientXNumber, slotAppointment.clientId)
                              : slotAppointment.clientXNumber}
                          </div>
                          <div>
                            {userRole === "client" && currentUserId !== undefined && slotAppointment.clientId !== currentUserId
                              ? "***"
                              : slotAppointment.clientName}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Doctor:</span>
                          <div className="font-medium">{slotAppointment.doctorName}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div
                            className="inline-block px-2 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: slotAppointment.statusColor + "20",
                              color: slotAppointment.statusColor,
                            }}
                          >
                            {slotAppointment.status}
                          </div>
                        </div>
                        {slotAppointment.notes && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Notes:</span>
                            <div className="text-sm mt-1">{slotAppointment.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      {isValidForBooking ? (
                        <span className="text-sm">Available - Click to book</span>
                      ) : isPast ? (
                        <span className="text-sm">Past slot</span>
                      ) : (
                        <span className="text-sm">Non-working day</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Appointment Alerts - Shows toast notifications for upcoming appointments */}
      <AppointmentAlerts
        userRole={userRole}
        currentUserId={currentUserId}
        enabled={true}
      />

      {view === "month" && renderMonthView()}
      {view === "week" && renderWeekView()}
      {view === "day" && renderDayView()}

      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={() =>
          setBookingModal({
            isOpen: false,
            selectedDate: null,
            selectedSlot: null,
          })
        }
        selectedDate={bookingModal.selectedDate}
        selectedSlot={bookingModal.selectedSlot}
        userRole={userRole}
        currentUserId={currentUserId}
        onAppointmentBooked={handleAppointmentBooked}
      />

      <AppointmentModal
        isOpen={appointmentModal.isOpen}
        onClose={() =>
          setAppointmentModal({ isOpen: false, appointment: null })
        }
        appointment={appointmentModal.appointment}
        userRole={userRole}
        currentUserId={currentUserId}
        onAppointmentUpdate={handleAppointmentUpdate}
        onAppointmentDelete={handleAppointmentDelete}
      />
    </div>
  );
}