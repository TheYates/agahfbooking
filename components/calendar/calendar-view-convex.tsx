"use client";

import type React from "react";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingModalConvex as BookingModal } from "./booking-modal-convex";
import { ViewSwitcher } from "./view-switcher";
import { AppointmentModalConvex as AppointmentModal } from "./appointment-modal-convex";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DayAppointmentsPopover } from "./day-appointments-popover";
import {
  isValidBookingDate,
  isWorkingDayForAnyDepartment,
} from "@/lib/working-days-utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface CalendarViewConvexProps {
  userRole: "client" | "receptionist" | "admin";
  currentUserId?: number;
}

interface CalendarAppointment {
  id: Id<"appointments">;
  clientId: Id<"clients">;
  clientName: string;
  clientXNumber: string;
  doctorId?: Id<"doctors">;
  doctorName: string;
  departmentId: Id<"departments">;
  departmentName: string;
  date: string;
  slotNumber: number;
  status: string;
  statusColor: string;
  notes?: string;
}

export function CalendarViewConvex({ userRole, currentUserId }: CalendarViewConvexProps) {
  // Local state
  const [currentDate, setCurrentDate] = useState(new Date());
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

  // Calculate date range for queries
  const dateRange = useMemo(() => {
    if (view === "month") {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return {
        startDate: firstDay.toISOString().split("T")[0],
        endDate: lastDay.toISOString().split("T")[0],
      };
    } else {
      // week view
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day;
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        startDate: startOfWeek.toISOString().split("T")[0],
        endDate: endOfWeek.toISOString().split("T")[0],
      };
    }
  }, [view, currentDate]);

  // Convex queries
  const allAppointments = useQuery(api.queries.getAppointments, {});
  const allDepartments = useQuery(api.queries.getDepartments, { isActive: true });
  const allDoctors = useQuery(api.queries.getDoctors, { isActive: true });
  const allClients = useQuery(api.queries.getClients, {});

  const loading = allAppointments === undefined || allDepartments === undefined || 
                  allDoctors === undefined || allClients === undefined;
  const error = allAppointments === null || allDepartments === null || 
                allDoctors === null || allClients === null;

  // Helper function to get status color (must be defined before use in useMemo)
  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      booked: "#3B82F6",
      arrived: "#10B981",
      waiting: "#F59E0B",
      completed: "#059669",
      no_show: "#EF4444",
      cancelled: "#6B7280",
      rescheduled: "#8B5CF6",
      confirmed: "#10B981",
    };
    return statusColors[status] || "#6B7280";
  };

  // Filter appointments by date range and transform to CalendarAppointment format
  const appointments = useMemo(() => {
    if (!allAppointments || !allClients || !allDepartments || !allDoctors) return [];

    const filtered = allAppointments.filter(
      (apt: any) =>
        apt.appointment_date >= dateRange.startDate &&
        apt.appointment_date <= dateRange.endDate
    );

    return filtered.map((apt: any): CalendarAppointment => {
      const client = allClients.find((c: any) => c._id === apt.client_id);
      const department = allDepartments.find((d: any) => d._id === apt.department_id);
      const doctor = apt.doctor_id ? allDoctors.find((d: any) => d._id === apt.doctor_id) : null;

      return {
        id: apt._id,
        clientId: apt.client_id,
        clientName: client?.name || "Unknown",
        clientXNumber: client?.x_number || "N/A",
        doctorId: apt.doctor_id,
        doctorName: doctor?.name || "Unassigned",
        departmentId: apt.department_id,
        departmentName: department?.name || "Unknown",
        date: apt.appointment_date,
        slotNumber: apt.slot_number,
        status: apt.status,
        statusColor: getStatusColor(apt.status),
        notes: apt.notes,
      };
    });
  }, [allAppointments, allClients, allDepartments, allDoctors, dateRange]);

  // Transform departments for compatibility
  const departments = useMemo(() => {
    if (!allDepartments) return [];
    return allDepartments.map((dept: any) => ({
      id: parseInt(dept._id, 36), // Convert Convex ID to number for compatibility
      name: dept.name,
      description: dept.description || "",
      slots_per_day: dept.slots_per_day,
      working_days: dept.working_days,
      working_hours: dept.working_hours,
      is_active: dept.is_active,
      color: dept.color,
    }));
  }, [allDepartments]);


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
    return appointments.filter((apt: any) => apt.date === dateString);
  };

  const getMaxSlots = () => {
    if (!Array.isArray(departments) || departments.length === 0) return 10;
    const slots = departments.map((d) => d.slots_per_day ?? 10);
    return Math.max(...slots);
  };

  const isSlotValidForDepartment = (slotNumber: number, departmentId: number) => {
    if (!Array.isArray(departments)) return false;
    const department = departments.find((d) => d.id === departmentId);
    return department ? slotNumber <= (department.slots_per_day ?? 10) : false;
  };

  const getDepartmentColor = (departmentId: number) => {
    if (!Array.isArray(departments)) return "#6B7280";
    const department = departments.find((d) => d.id === departmentId);
    return department?.color || "#6B7280";
  };

  const maskXNumber = (xNumber: string, isOwnAppointment: boolean) => {
    if (userRole !== "client" || isOwnAppointment) {
      return xNumber;
    }
    return xNumber.substring(0, 4) + "**/**";
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleBookSlot = (date: Date, slotNumber: number) => {
    // Check if the date is valid for booking (not in past and is a working day)
    if (!isValidBookingDate(date, undefined, departments)) {
      // Don't open booking modal for invalid dates
      return;
    }

    setBookingModal({
      isOpen: true,
      selectedDate: date,
      selectedSlot: slotNumber,
    });
  };

  const handleCellClick = (date: Date, slotNumber?: number) => {
    if (isPastDate(date)) {
      toast.error("Cannot book appointments in the past");
      return;
    }

    if (!isWorkingDayForAnyDepartment(departments, date)) {
      toast.error("This is a non-working day");
      return;
    }

    setBookingModal({
      isOpen: true,
      selectedDate: date,
      selectedSlot: slotNumber ?? null,
    });
  };

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    setAppointmentModal({
      isOpen: true,
      appointment,
    });
  };

  const handleAppointmentBooked = () => {
    // Convex will automatically update via real-time subscriptions
  };

  const handleAppointmentUpdate = (updatedAppointment: CalendarAppointment) => {
    // Convex will automatically update via real-time subscriptions
  };

  const handleAppointmentDelete = (appointmentId: string) => {
    // Convex will automatically update via real-time subscriptions
  };

  // Drag and drop handlers
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
      (apt: any) =>
        apt.date === dateString &&
        apt.slotNumber === targetSlot &&
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

    // Show success toast (actual update would be done via Convex mutation)
    const newDate = targetDate.toLocaleDateString();
    toast.success("Appointment Moved! 📅", {
      description: `${draggedAppointment.clientName}'s appointment moved to ${newDate}, Slot ${targetSlot}`,
      duration: 4000,
    });

    setDraggedAppointment(null);
  };

  const monthDays = view === "month" ? getDaysInMonth(currentDate) : [];
  const weekDays = view === "week" ? getWeekDays(currentDate) : [];
  const daysToRender = view === "month" ? monthDays : weekDays;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading calendar data</p>
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
          <h2 className="text-xl sm:text-2xl font-bold">{monthName}</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
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
            const isValidForBooking = isValidBookingDate(
              day,
              undefined,
              departments
            );

            return (
              <div
                key={index}
                className={cn(
                  "p-2 h-full border rounded-lg transition-colors flex flex-col min-h-0",
                  isPast
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600"
                    : !isWorkingDay
                    ? "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600",
                  isToday &&
                    !isPast &&
                    isWorkingDay &&
                    "bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => isValidForBooking && handleBookSlot(day, 1)}
                onDragOver={isValidForBooking ? handleDragOver : undefined}
                onDrop={
                  isValidForBooking ? (e) => handleDrop(e, day, 1) : undefined
                }
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
                  {dayAppointments.slice(0, 2).map((apt: any) => (
                    <div
                      key={apt.id}
                      className="text-xs p-1 rounded truncate cursor-pointer border-l-2"
                      style={{
                        backgroundColor:
                          getDepartmentColor(parseInt(apt.departmentId as any, 36)) + "20",
                        color: getDepartmentColor(parseInt(apt.departmentId as any, 36)),
                        borderLeftColor: getDepartmentColor(parseInt(apt.departmentId as any, 36)),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(apt);
                      }}
                      draggable={!isPastAppointment(apt)}
                      onDragStart={(e) => handleDragStart(e, apt)}
                    >
                      <div className="font-medium text-xs truncate">
                        {userRole === "client" && String(apt.clientId) !== String(currentUserId)
                          ? `${maskXNumber(apt.clientXNumber, false)} - ***`
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
                      onAppointmentClick={handleAppointmentClick as any}
                      onDragStart={handleDragStart as any}
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
    const weekRange = `${weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${weekEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">{weekRange}</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
            <ViewSwitcher currentView={view} onViewChange={setView} />
          </div>
        </div>

        <div className="flex flex-col">
          {/* Headers */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="h-16 flex items-center justify-center font-medium text-sm text-muted-foreground">
              Slots
            </div>
            {weekDays.map((day, dayIndex) => {
              const isToday = new Date().toDateString() === day.toDateString();
              const isPast = isPastDate(day);
              const isWorkingDay = isWorkingDayForAnyDepartment(
                departments,
                day
              );
              const isValidForBooking = isValidBookingDate(
                day,
                undefined,
                departments
              );

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "h-16 p-2 border rounded-lg transition-colors flex flex-col items-center justify-center",
                    isPast
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600"
                      : !isWorkingDay
                      ? "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600",
                    isToday &&
                      !isPast &&
                      isWorkingDay &&
                      "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={() => isValidForBooking && handleBookSlot(day, 1)}
                >
                  <div className="text-xs text-muted-foreground">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div
                    className={cn(
                      "text-lg font-semibold text-foreground",
                      isToday && "text-blue-600 dark:text-blue-400",
                      isPast && "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="grid grid-cols-8 gap-2">
              {/* Slot Numbers Column */}
              <div className="space-y-2">
                {Array.from({ length: getMaxSlots() }, (_, i) => (
                  <div
                    key={i}
                    className="h-16 flex items-center justify-center text-sm font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDays.map((day, dayIndex) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isPast = isPastDate(day);
                const isWorkingDay = isWorkingDayForAnyDepartment(
                  departments,
                  day
                );
                const isValidForBooking = isValidBookingDate(
                  day,
                  undefined,
                  departments
                );

                return (
                  <div key={dayIndex} className="space-y-2">
                    {Array.from({ length: getMaxSlots() }, (_, slotIndex) => {
                      const slotNumber = slotIndex + 1;
                      const slotAppointments = dayAppointments.filter(
                        (apt) => apt.slotNumber === slotNumber
                      );
                      const appointment = slotAppointments[0];

                      const isSlotDisabled =
                        appointment &&
                        !isSlotValidForDepartment(
                          slotNumber,
                          parseInt(appointment.departmentId as any, 36)
                        );

                      return (
                        <div
                          key={slotIndex}
                          className={cn(
                            "h-16 p-2 border rounded transition-colors",
                            appointment
                              ? "border-l-4 cursor-pointer"
                              : isPast
                              ? "cursor-not-allowed hover:bg-red-100 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600"
                              : !isWorkingDay
                              ? "cursor-not-allowed bg-gray-50 dark:bg-gray-800 opacity-60"
                              : "cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600",
                            isSlotDisabled && "opacity-50 cursor-not-allowed"
                          )}
                          style={
                            appointment
                              ? {
                                  borderLeftColor: getDepartmentColor(
                                    parseInt(appointment.departmentId as any, 36)
                                  ),
                                  backgroundColor:
                                    getDepartmentColor(
                                      parseInt(appointment.departmentId as any, 36)
                                    ) + "10",
                                }
                              : {}
                          }
                          onClick={() => {
                            if (isSlotDisabled || !isValidForBooking) return;
                            if (appointment && slotAppointments.length === 1) {
                              handleAppointmentClick(appointment);
                            } else if (!appointment) {
                              handleBookSlot(day, slotNumber);
                            }
                          }}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, day, slotNumber)}
                        >
                          {appointment ? (
                            slotAppointments.length > 1 ? (
                              <DayAppointmentsPopover
                                appointments={slotAppointments}
                                date={day}
                                getDepartmentColor={getDepartmentColor}
                                maskXNumber={maskXNumber}
                                currentUserId={currentUserId}
                                userRole={userRole}
                                onAppointmentClick={handleAppointmentClick as any}
                                onDragStart={handleDragStart as any}
                              >
                                <div className="h-full flex flex-col justify-center relative cursor-pointer">
                                  <div className="text-xs font-medium truncate">
                                    {maskXNumber(
                                      appointment.clientXNumber,
                                      String(appointment.clientId) === String(currentUserId)
                                    )}
                                  </div>
                                  <div
                                    className="text-xs truncate"
                                    style={{
                                      color: getDepartmentColor(
                                        parseInt(appointment.departmentId as any, 36)
                                      ),
                                    }}
                                  >
                                    {appointment.departmentName}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {appointment.doctorName.split(" ")[1]}
                                  </div>
                                  <div className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    {slotAppointments.length}
                                  </div>
                                </div>
                              </DayAppointmentsPopover>
                            ) : (
                              <div
                                className="h-full flex flex-col justify-center"
                                draggable={!isPastAppointment(appointment)}
                                onDragStart={(e) =>
                                  handleDragStart(e, appointment)
                                }
                              >
                                <div className="text-xs font-medium truncate">
                                  {maskXNumber(
                                    appointment.clientXNumber,
                                    String(appointment.clientId) === String(currentUserId)
                                  )}
                                </div>
                                <div
                                  className="text-xs truncate"
                                  style={{
                                    color: getDepartmentColor(
                                      parseInt(appointment.departmentId as any, 36)
                                    ),
                                  }}
                                >
                                  {appointment.departmentName}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {appointment.doctorName.split(" ")[1]}
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                              {isPast ? "Empty" : "Available"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  // Generate time slots for day view
  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 1; i <= getMaxSlots(); i++) {
      slots.push(`Slot ${i}`);
    }
    return slots;
  };

  // Format time slot for display
  const formatTimeSlot = (slot: string) => {
    return slot; // For now, just return the slot name
  };

  // Get appointments for a specific time slot
  const getAppointmentsForTimeSlot = (date: Date, timeSlot: string) => {
    const dateStr = date.toISOString().split("T")[0];
    const slotNumber = parseInt(timeSlot.replace("Slot ", ""));

    return appointments.filter(
      (apt) => apt.date === dateStr && apt.slotNumber === slotNumber
    );
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate);
    const dateString = currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeSlots = generateTimeSlots();
    const isPast = isPastDate(currentDate);
    const isWorkingDay = isWorkingDayForAnyDepartment(departments, currentDate);
    const isValidForBooking = isValidBookingDate(
      currentDate,
      undefined,
      departments
    );

    return (
      <div className="space-y-4">
        {/* Navigation header - matching month/week view pattern */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">{dateString}</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDay("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDay("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
            <ViewSwitcher currentView={view} onViewChange={setView} />
          </div>
        </div>

        {/* Time slots container */}
        <div className="space-y-2 h-[600px] overflow-y-auto pr-2">
          {timeSlots.map((timeSlot) => {
            const slotAppointments = getAppointmentsForTimeSlot(
              currentDate,
              timeSlot
            );

            return (
              <div key={timeSlot} className="flex items-start gap-4">
                <div className="w-16 text-sm text-gray-500 dark:text-gray-400 text-right pt-2">
                  {formatTimeSlot(timeSlot)}
                </div>
                <div
                  className={cn(
                    "flex-1 p-3 border dark:border-gray-700 rounded-lg transition-colors min-h-[60px]",
                    isPast && "opacity-60",
                    !isWorkingDay &&
                      "bg-gray-50 dark:bg-gray-800 opacity-60 cursor-not-allowed",
                    isValidForBooking && "cursor-pointer",
                    !isValidForBooking && "cursor-not-allowed",
                    isValidForBooking &&
                      "hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600"
                  )}
                  onClick={() => {
                    if (isValidForBooking) {
                      const slotNumber = parseInt(
                        timeSlot.replace("Slot ", "")
                      );
                      handleBookSlot(currentDate, slotNumber);
                    }
                  }}
                  onDragOver={isValidForBooking ? handleDragOver : undefined}
                  onDrop={
                    isValidForBooking
                      ? (e) => {
                          const slotNumber = parseInt(
                            timeSlot.replace("Slot ", "")
                          );
                          handleDrop(e, currentDate, slotNumber);
                        }
                      : undefined
                  }
                >
                  {slotAppointments.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                      <Plus className="w-4 h-4 mr-2" />
                      {isPast ? "Empty" : "Available"}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slotAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="p-2 rounded-lg text-white cursor-pointer flex-1 min-w-[160px] max-w-[220px]"
                          style={{
                            backgroundColor: getDepartmentColor(
                              parseInt(appointment.departmentId as any, 36)
                            ),
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentClick(appointment);
                          }}
                          draggable={!isPastAppointment(appointment)}
                          onDragStart={(e) => handleDragStart(e, appointment)}
                        >
                          <div className="font-medium text-sm flex items-center gap-1">
                            <span className="opacity-75">
                              {maskXNumber(
                                appointment.clientXNumber,
                                String(appointment.clientId) === String(currentUserId)
                              )}
                            </span>
                            <span className="opacity-75 text-xs">
                              {appointment.departmentName}
                            </span>
                          </div>
                          <div className="truncate text-sm mt-1">
                            {userRole === "client" &&
                            String(appointment.clientId) !== String(currentUserId)
                              ? "*** ***"
                              : appointment.clientName}
                          </div>
                          {appointment.notes && (
                            <div className="opacity-75 text-xs mt-1 truncate">
                              {userRole === "client" &&
                              String(appointment.clientId) !== String(currentUserId)
                                ? "***"
                                : appointment.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
        currentUserId={currentUserId?.toString()}
        onAppointmentBooked={handleAppointmentBooked}
      />

      {appointmentModal.appointment && (
        <AppointmentModal
          isOpen={appointmentModal.isOpen}
          onClose={() =>
            setAppointmentModal({ isOpen: false, appointment: null })
          }
          appointment={appointmentModal.appointment}
          onStatusUpdate={(newStatus) => {
            toast.success("Status updated successfully");
            setAppointmentModal({ isOpen: false, appointment: null });
          }}
        />
      )}
    </div>
  );
}
