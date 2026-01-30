// @ts-nocheck
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Combobox } from "@/components/ui/combobox";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface TimeSlot {
  time: string;
  slotNumber: number;
  available: boolean;
  clientXNumber?: string;
  clientId?: string;
  isNonWorkingDay?: boolean;
}

interface DaySchedule {
  date: string;
  fullDate: string;
  dayName: string;
  dayNumber: number;
  slots: TimeSlot[];
  hasAvailability: boolean;
  isWorkingDay?: boolean;
}

interface MobileBookingSheetConvexProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: () => void;
  user: {
    id?: number | string;
    name?: string;
    role?: string;
    xNumber?: string;
    convexId?: string;
  };
  selectedDepartmentId?: string;
}

// Function to generate week range string
const generateWeekRange = (weekOffset: number = 0): string => {
  const today = new Date();
  today.setDate(today.getDate() + weekOffset * 7);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 6);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const startMonth = months[today.getMonth()];
  const endMonth = months[endDate.getMonth()];

  if (startMonth === endMonth) {
    return `${startMonth} ${today.getDate()} - ${endDate.getDate()}`;
  } else {
    return `${startMonth} ${today.getDate()} - ${endMonth} ${endDate.getDate()}`;
  }
};

// Generate week dates
const generateWeekDates = (weekOffset: number = 0): { date: Date; dateStr: string }[] => {
  const dates: { date: Date; dateStr: string }[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + weekOffset * 7);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push({
      date,
      dateStr: date.toISOString().split("T")[0],
    });
  }
  return dates;
};

export function MobileBookingSheetConvex({
  isOpen,
  onClose,
  onBookingSuccess,
  user,
  selectedDepartmentId: initialDepartmentId,
}: MobileBookingSheetConvexProps) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<Id<"departments"> | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [showConfirmationView, setShowConfirmationView] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    day: string;
    time: string;
    dayName: string;
    slotNumber: number;
    fullDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate current week range based on offset
  const currentWeekRange = generateWeekRange(currentWeekOffset);
  const weekDates = generateWeekDates(currentWeekOffset);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !shouldReduceMotion;

  // Convex queries
  const departments = useQuery(api.queries.getDepartments, { isActive: true });
  const clients = useQuery(api.queries.getClients, {});
  const appointments = useQuery(api.queries.getAppointmentsByDateRange, 
    selectedDepartmentId ? {
      startDate: weekDates[0]?.dateStr || new Date().toISOString().split("T")[0],
      endDate: weekDates[6]?.dateStr || new Date().toISOString().split("T")[0],
    } : "skip"
  );

  // Convex mutation
  const createAppointment = useMutation(api.mutations.createAppointment);

  // Get selected department
  const selectedDepartment = departments?.find((d) => d._id === selectedDepartmentId);

  // Auto-select client for client users
  useEffect(() => {
    if (isOpen && clients && user) {
      // Find current client by convexId or match by phone/name
      const currentClient = clients.find(
        (c) => c._id === user.convexId || c.phone === user.xNumber
      ) || clients[0];
      
      if (currentClient) {
        setSelectedClient(currentClient);
      }
    }
  }, [isOpen, clients, user]);

  // Auto-select department if provided
  useEffect(() => {
    if (isOpen && initialDepartmentId && departments) {
      const dept = departments.find((d) => d._id === initialDepartmentId);
      if (dept) {
        setSelectedDepartmentId(dept._id);
      }
    }
  }, [isOpen, initialDepartmentId, departments]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmationView(false);
      setSelectedTimeSlot(null);
      setCurrentWeekOffset(0);
    }
  }, [isOpen]);

  // Generate week schedule from appointments
  const weekSchedule: DaySchedule[] = weekDates.map(({ date, dateStr }) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const slotsPerDay = selectedDepartment?.slots_per_day || 10;
    const dayAppointments = appointments?.filter(
      (apt) => apt.appointment_date === dateStr && apt.department_id === selectedDepartmentId
    ) || [];

    const slots: TimeSlot[] = [];
    for (let i = 1; i <= slotsPerDay; i++) {
      const bookedApt = dayAppointments.find((apt) => apt.slot_number === i);
      slots.push({
        time: `Slot ${i}`,
        slotNumber: i,
        available: !bookedApt || bookedApt.status === "cancelled",
        clientXNumber: bookedApt?.client_x_number,
        clientId: bookedApt?.client_id,
        isNonWorkingDay: false,
      });
    }

    const hasAvailability = slots.some((s) => s.available);

    return {
      date: `${months[date.getMonth()]} ${date.getDate()}`,
      fullDate: dateStr,
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      slots,
      hasAvailability,
      isWorkingDay: true,
    };
  });

  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId as Id<"departments">);
  };

  const handleTimeSlotClick = (day: string, time: string, slotNumber: number, fullDate: string) => {
    if (selectedDepartmentId && selectedClient) {
      const dayInfo = weekSchedule.find((d) => d.date === day);
      setSelectedTimeSlot({
        day,
        time,
        dayName: dayInfo?.dayName || day,
        slotNumber,
        fullDate,
      });
      setShowConfirmationView(true);
    }
  };

  const handleBackToMain = () => {
    setShowConfirmationView(false);
    setSelectedTimeSlot(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot || !selectedDepartmentId || !selectedClient) return;

    setLoading(true);
    try {
      await createAppointment({
        client_id: selectedClient._id,
        department_id: selectedDepartmentId,
        appointment_date: selectedTimeSlot.fullDate,
        slot_number: selectedTimeSlot.slotNumber,
        status: "booked",
      });

      // Show success toast
      toast.success("Mobile Booking Successful! 🎉", {
        description: `${selectedClient.name} booked for ${selectedDepartment?.name} on ${selectedTimeSlot.day}, ${selectedTimeSlot.time}`,
        duration: 5000,
      });

      setShowConfirmationView(false);
      setSelectedTimeSlot(null);
      if (onBookingSuccess) {
        onBookingSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Mobile Booking Failed", {
        description: error instanceof Error ? error.message : "Failed to book appointment. Please try again.",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWeekNavigation = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentWeekOffset(currentWeekOffset - 1);
    } else {
      setCurrentWeekOffset(currentWeekOffset + 1);
    }
  };

  const maskXNumber = (xNumber: string) => {
    if (!xNumber) return "";
    const parts = xNumber.split("/");
    if (parts.length === 2) {
      const firstPart = parts[0].substring(0, 4) + "**";
      const secondPart = "**";
      return `${firstPart}/${secondPart}`;
    }
    return xNumber;
  };

  const isPastDate = (fullDateString: string) => {
    const slotDate = new Date(fullDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    slotDate.setHours(0, 0, 0, 0);
    return slotDate < today;
  };

  const isOwnAppointment = (slot: TimeSlot) => {
    return !slot.available && slot.clientId === selectedClient?._id;
  };

  const getSlotStyling = (slot: TimeSlot, fullDateString: string) => {
    const isPast = isPastDate(fullDateString);
    const isOwn = isOwnAppointment(slot);
    const isNonWorkingDay = slot.isNonWorkingDay;

    if (isNonWorkingDay) {
      return "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60";
    }

    if (slot.available) {
      return isPast
        ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        : "bg-background border-border/50 hover:border-border hover:bg-muted text-foreground cursor-pointer";
    } else if (isOwn) {
      return isPast
        ? "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 cursor-not-allowed"
        : "bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30 cursor-pointer";
    } else {
      return isPast
        ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 cursor-not-allowed";
    }
  };

  const getSlotText = (slot: TimeSlot) => {
    if (slot.isNonWorkingDay) {
      return "Non-working day";
    } else if (slot.available) {
      return "Empty Slot";
    } else if (isOwnAppointment(slot)) {
      return "Your Appointment";
    } else {
      return maskXNumber(slot.clientXNumber || "Booked");
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: -25,
      scale: 0.95,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 28,
        mass: 0.6,
      },
    },
  };

  const timeSlotVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
      },
    },
  };

  const isLoading = departments === undefined || clients === undefined;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[90vh] overflow-hidden p-0 flex flex-col"
      >
        {!showConfirmationView ? (
          <>
            <SheetHeader className="p-4 pb-2">
              <SheetTitle>Quick Booking</SheetTitle>
              <SheetDescription className="mb-4">
                Select a department and available time slot
              </SheetDescription>

              {/* Department Selector */}
              <div className="relative z-50">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Choose Department
                </label>
                <Combobox
                  options={(departments || []).map((dept) => ({
                    value: dept._id,
                    label: dept.name,
                  }))}
                  value={selectedDepartmentId || ""}
                  onValueChange={handleDepartmentChange}
                  placeholder="Select a department"
                  searchPlaceholder="Search departments..."
                  emptyText="No departments found."
                  className="w-full"
                />
              </div>

              {/* Client Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Booking For
                </label>
                <div className="w-full p-3 border border-border rounded-md bg-muted/50">
                  {selectedClient ? (
                    <div className="flex flex-col">
                      <span className="font-medium">{selectedClient.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedClient.x_number} • {selectedClient.category}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {isLoading ? "Loading your information..." : "No client selected"}
                    </span>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-hidden">
              <motion.div
                variants={shouldAnimate ? containerVariants : {}}
                initial={shouldAnimate ? "hidden" : "visible"}
                animate="visible"
                className="p-4 pt-2 flex flex-col h-full overflow-y-auto"
              >
                {/* Conditional rendering: only show calendar if both department and client are selected */}
                {selectedDepartmentId && selectedClient ? (
                  isLoading || appointments === undefined ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">
                        Loading schedule...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Separator */}
                      <motion.div
                        variants={shouldAnimate ? itemVariants : {}}
                        className="border-t border-border/50"
                      />

                      {/* Week Navigation */}
                      <motion.div
                        variants={shouldAnimate ? itemVariants : {}}
                        className="pb-2"
                      >
                        <div className="flex items-center justify-between">
                          <motion.button
                            whileHover={
                              shouldAnimate
                                ? {
                                    scale: 1.05,
                                    transition: {
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 25,
                                    },
                                  }
                                : {}
                            }
                            whileTap={shouldAnimate ? { scale: 0.95 } : {}}
                            onClick={() => handleWeekNavigation("prev")}
                            aria-label="Previous week"
                            className="p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                          </motion.button>

                          <h3 className="font-semibold text-foreground">
                            {currentWeekRange}
                          </h3>

                          <motion.button
                            whileHover={
                              shouldAnimate
                                ? {
                                    scale: 1.05,
                                    transition: {
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 25,
                                    },
                                  }
                                : {}
                            }
                            whileTap={shouldAnimate ? { scale: 0.95 } : {}}
                            onClick={() => handleWeekNavigation("next")}
                            aria-label="Next week"
                            className="p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Daily Schedule - Scrollable */}
                      <motion.div
                        variants={shouldAnimate ? itemVariants : {}}
                        className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide pb-4"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {weekSchedule.map((day: DaySchedule) => (
                          <motion.div
                            key={day.date}
                            variants={shouldAnimate ? itemVariants : {}}
                            className="space-y-3"
                          >
                            {/* Day Header */}
                            <div className="flex items-center justify-center">
                              <h4 className="font-medium text-foreground">
                                {day.dayName}, {day.date}
                              </h4>
                              {!day.hasAvailability && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  - No Availability
                                </span>
                              )}
                            </div>

                            {/* Time Slots */}
                            {day.hasAvailability && (
                              <motion.div
                                variants={shouldAnimate ? containerVariants : {}}
                                className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 px-2"
                              >
                                {day.slots.map((slot: TimeSlot) => (
                                  <motion.button
                                    key={`${day.date}-${slot.time}`}
                                    variants={shouldAnimate ? timeSlotVariants : {}}
                                    whileHover={
                                      shouldAnimate && slot.available && !isPastDate(day.fullDate)
                                        ? {
                                            scale: 1.05,
                                            y: -2,
                                            transition: {
                                              type: "spring",
                                              stiffness: 400,
                                              damping: 25,
                                            },
                                          }
                                        : {}
                                    }
                                    whileTap={
                                      shouldAnimate && slot.available && !isPastDate(day.fullDate)
                                        ? { scale: 0.98 }
                                        : {}
                                    }
                                    onClick={() => {
                                      if (
                                        slot.available &&
                                        !isPastDate(day.fullDate) &&
                                        !slot.isNonWorkingDay
                                      ) {
                                        handleTimeSlotClick(
                                          day.date,
                                          slot.time,
                                          slot.slotNumber,
                                          day.fullDate
                                        );
                                      }
                                    }}
                                    disabled={
                                      isPastDate(day.fullDate) ||
                                      slot.isNonWorkingDay ||
                                      !slot.available
                                    }
                                    aria-label={`${
                                      slot.available ? "Book" : "Occupied"
                                    } time slot ${slot.time} on ${day.dayName}, ${day.date}`}
                                    className={cn(
                                      "px-2 py-2 text-xs sm:text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[80px] sm:min-w-[100px]",
                                      getSlotStyling(slot, day.fullDate)
                                    )}
                                  >
                                    <div className="text-center relative">
                                      <div className="font-medium">{slot.time}</div>
                                      <div className="text-xs">{getSlotText(slot)}</div>
                                    </div>
                                  </motion.button>
                                ))}
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  )
                ) : (
                  <motion.div
                    variants={shouldAnimate ? itemVariants : {}}
                    className="text-center py-8"
                  >
                    <p className="text-muted-foreground">
                      {!selectedDepartmentId
                        ? "Please select a department to continue"
                        : "Loading your information..."}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </>
        ) : (
          /* Confirmation View - Replaces entire content */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            className="flex flex-col h-full overflow-y-auto"
          >
            <div className="p-6 space-y-6 flex-1">
              {/* Header with back button */}
              <div className="flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBackToMain}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="text-sm font-medium">Back</span>
                </motion.button>
                <h3 className="text-lg font-semibold text-foreground">
                  Confirm Booking
                </h3>
                <div></div> {/* Spacer for centering */}
              </div>

              {/* Department info summary */}
              {selectedDepartment && (
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {selectedDepartment.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {selectedDepartment.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedDepartment.description || `${selectedDepartment.slots_per_day} slots per day`}
                    </p>
                  </div>
                </div>
              )}

              {/* Booking details */}
              {selectedTimeSlot && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                      Your Booking
                    </p>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-lg font-semibold text-foreground">
                        {selectedTimeSlot.dayName}, {selectedTimeSlot.day}
                      </p>
                      <p className="text-xl font-bold text-primary">
                        {selectedTimeSlot.time}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="text-foreground font-medium">
                        {selectedClient?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">X-Number:</span>
                      <span className="text-foreground font-medium font-mono">
                        {selectedClient?.x_number}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="text-foreground font-medium">
                        {selectedClient?.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="text-foreground font-medium">
                        {selectedDepartment?.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm button */}
              <motion.button
                whileHover={shouldAnimate ? { scale: 1.02, y: -1 } : {}}
                whileTap={shouldAnimate ? { scale: 0.98 } : {}}
                onClick={handleConfirmBooking}
                disabled={loading}
                className="w-full relative overflow-hidden py-3 rounded-lg font-semibold transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground border cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      BOOKING...
                    </>
                  ) : (
                    <>
                      CONFIRM BOOKING
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </>
                  )}
                </span>
                {/* Gradient shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
}
