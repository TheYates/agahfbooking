"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
// Removed direct import to avoid client-side database dependency

interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  clientXNumber: string;
  doctorId: number;
  doctorName: string;
  departmentId: number;
  departmentName: string;
  date: string;
  slotNumber: number;
  status: string;
  statusColor: string;
  notes?: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  departmentId?: number;
}

interface Department {
  id: number;
  name: string;
  description: string;
  slots_per_day: number;
  working_days: string[];
  working_hours: { start: string; end: string };
  is_active: boolean;
}

interface CalendarViewProps {
  userRole: "client" | "receptionist" | "admin";
  currentUserId?: number;
}

export function CalendarView({ userRole, currentUserId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [draggedAppointment, setDraggedAppointment] =
    useState<Appointment | null>(null);
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    selectedDate: null as Date | null,
    selectedSlot: null as number | null,
  });
  const [appointmentModal, setAppointmentModal] = useState({
    isOpen: false,
    appointment: null as Appointment | null,
  });

  // Fetch data from API
  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
    fetchAppointments();
  }, [currentDate, view, userRole, currentUserId]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors");
      const data = await response.json();
      if (data.success) {
        // Transform the data to match the expected interface
        const transformedDoctors = data.data.map((doctor: any) => ({
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.department_name || "General",
          departmentId: doctor.department_id,
        }));
        setDoctors(transformedDoctors);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      // Calculate date range based on current view
      let startDate: string;
      let endDate: string;

      if (view === "month") {
        const firstDay = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const lastDay = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
        startDate = firstDay.toISOString().split("T")[0];
        endDate = lastDay.toISOString().split("T")[0];
      } else if (view === "week") {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        startDate = startOfWeek.toISOString().split("T")[0];
        endDate = endOfWeek.toISOString().split("T")[0];
      } else {
        // day view
        startDate = currentDate.toISOString().split("T")[0];
        endDate = startDate;
      }

      // Get the appropriate appointments endpoint based on admin settings
      const endpointResponse = await fetch(
        `/api/calendar/endpoint?userRole=${userRole}&currentUserId=${currentUserId}`
      );
      const endpointData = await endpointResponse.json();

      if (!endpointResponse.ok || !endpointData.success) {
        throw new Error(
          endpointData.error || "Failed to get calendar endpoint"
        );
      }

      const baseEndpoint = endpointData.data.endpoint;

      // Properly construct URL with query parameters
      const url = new URL(baseEndpoint, window.location.origin);
      url.searchParams.set("startDate", startDate);
      url.searchParams.set("endDate", endDate);

      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.success) {
        // Transform the data to match the expected interface
        // Handle both full appointment data and client-specific data
        const transformedAppointments = data.data.map((appointment: any) => ({
          id: appointment.id,
          clientId: appointment.client_id || appointment.clientId,
          clientName: appointment.client_name || appointment.clientName,
          clientXNumber:
            appointment.client_x_number || appointment.clientXNumber,
          doctorId:
            appointment.doctor_id ||
            appointment.doctorId ||
            appointment.department_id ||
            appointment.departmentId,
          doctorName:
            appointment.doctor_name || appointment.doctorName || "Unassigned",
          departmentId: appointment.department_id || appointment.departmentId,
          departmentName:
            appointment.department_name || appointment.departmentName,
          date: appointment.appointment_date
            ? appointment.appointment_date.split("T")[0]
            : appointment.date, // Handle both date formats
          slotNumber: appointment.slot_number || appointment.slotNumber,
          status: appointment.status,
          statusColor: getStatusColor(appointment.status),
          notes: appointment.notes,
        }));
        setAppointments(transformedAppointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

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

  const isPastAppointment = (appointment: Appointment) => {
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
    let dayAppointments = appointments.filter((apt) => apt.date === dateString);

    // For clients, show all appointments but we'll mask the non-client ones in the display
    // No filtering needed here - masking is handled in the display components

    return dayAppointments;
  };

  // Get maximum slots across all departments for calendar display
  const getMaxSlots = () => {
    if (departments.length === 0) return 10; // fallback
    return Math.max(...departments.map((d) => d.slots_per_day));
  };

  // Check if a slot is valid for a specific department
  const isSlotValidForDepartment = (
    slotNumber: number,
    departmentId: number
  ) => {
    const department = departments.find((d) => d.id === departmentId);
    return department ? slotNumber <= department.slots_per_day : false;
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

  const maskXNumber = (xNumber: string, isOwnAppointment: boolean) => {
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
      // Don't open booking modal for invalid dates
      return;
    }

    setBookingModal({
      isOpen: true,
      selectedDate: date,
      selectedSlot: slotNumber,
    });
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setAppointmentModal({
      isOpen: true,
      appointment,
    });
  };

  const handleAppointmentBooked = () => {
    // Refresh appointments from database after booking
    fetchAppointments();
  };

  const handleAppointmentUpdate = (updatedAppointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      )
    );
  };

  const handleAppointmentDelete = (appointmentId: number) => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
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

    // Update appointment
    const updatedAppointment = {
      ...draggedAppointment,
      date: dateString,
      slotNumber: targetSlot,
      ...(targetDoctorId && { doctorId: targetDoctorId }),
    };

    if (targetDoctorId) {
      const doctor = doctors.find((d) => d.id === targetDoctorId);
      if (doctor) {
        updatedAppointment.doctorName = doctor.name;
      }
    }

    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === draggedAppointment.id ? updatedAppointment : apt
      )
    );

    // Show success toast
    const newDate = targetDate.toLocaleDateString();
    toast.success("Appointment Moved! 📅", {
      description: `${draggedAppointment.clientName}'s appointment moved to ${newDate}, Slot ${targetSlot}`,
      duration: 4000,
    });

    setDraggedAppointment(null);
  };

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
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <div
                      key={apt.id}
                      className="text-xs p-1 rounded truncate cursor-pointer border-l-2"
                      style={{
                        backgroundColor:
                          getDepartmentColor(apt.departmentId) + "20",
                        color: getDepartmentColor(apt.departmentId),
                        borderLeftColor: getDepartmentColor(apt.departmentId),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(apt);
                      }}
                      draggable={!isPastAppointment(apt)}
                      onDragStart={(e) => handleDragStart(e, apt)}
                    >
                      <div className="font-medium text-xs truncate">
                        {userRole === "client" && apt.clientId !== currentUserId
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
                      const appointment = slotAppointments[0]; // Show first appointment in the slot

                      // Check if this slot is valid for the appointment's department
                      const isSlotDisabled =
                        appointment &&
                        !isSlotValidForDepartment(
                          slotNumber,
                          appointment.departmentId
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
                                    appointment.departmentId
                                  ),
                                  backgroundColor:
                                    getDepartmentColor(
                                      appointment.departmentId
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
                            // Multiple appointments are handled by the popover
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
                                onAppointmentClick={handleAppointmentClick}
                                onDragStart={handleDragStart}
                              >
                                <div className="h-full flex flex-col justify-center relative cursor-pointer">
                                  <div className="text-xs font-medium truncate">
                                    {maskXNumber(
                                      appointment.clientXNumber,
                                      appointment.clientId === currentUserId
                                    )}
                                  </div>
                                  <div
                                    className="text-xs truncate"
                                    style={{
                                      color: getDepartmentColor(
                                        appointment.departmentId
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
                                    appointment.clientId === currentUserId
                                  )}
                                </div>
                                <div
                                  className="text-xs truncate"
                                  style={{
                                    color: getDepartmentColor(
                                      appointment.departmentId
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
                              appointment.departmentId
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
                                appointment.clientId === currentUserId
                              )}
                            </span>
                            <span className="opacity-75 text-xs">
                              {appointment.departmentName}
                            </span>
                          </div>
                          <div className="truncate text-sm mt-1">
                            {userRole === "client" &&
                            appointment.clientId !== currentUserId
                              ? "*** ***"
                              : appointment.clientName}
                          </div>
                          {appointment.notes && (
                            <div className="opacity-75 text-xs mt-1 truncate">
                              {userRole === "client" &&
                              appointment.clientId !== currentUserId
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
