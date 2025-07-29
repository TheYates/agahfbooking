"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TimeSlot {
  time: string;
  available: boolean;
  clientXNumber?: string;
}

interface DaySchedule {
  date: string;
  dayName: string;
  dayNumber: number;
  slots: TimeSlot[];
  hasAvailability: boolean;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
}

interface QuickBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctors?: Doctor[];
  onDoctorChange?: (doctorId: number) => void;
  onTimeSlotSelect?: (day: string, time: string, doctorId: number) => void;
  onWeekChange?: (direction: "prev" | "next") => void;
  enableAnimations?: boolean;
}

const defaultDoctors: Doctor[] = [
  { id: 1, name: "Dr. Sarah Wilson", specialization: "General Medicine" },
  { id: 2, name: "Dr. Michael Brown", specialization: "Cardiology" },
  { id: 3, name: "Dr. Emily Davis", specialization: "Pediatrics" },
  { id: 4, name: "Dr. James Miller", specialization: "Orthopedics" },
  { id: 5, name: "Dr. Lisa Anderson", specialization: "Dermatology" },
];

// Function to generate real dates for the calendar
const generateWeekSchedule = (weekOffset: number = 0): DaySchedule[] => {
  const today = new Date();
  today.setDate(today.getDate() + weekOffset * 7);
  const schedule: DaySchedule[] = [];

  // Slots for each day
  const timeSlots = [
    "Slot 1",
    "Slot 2",
    "Slot 3",
    "Slot 4",
    "Slot 5",
    "Slot 6",
    "Slot 7",
    "Slot 8",
    "Slot 9",
    "Slot 10",
  ];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const dayName = i === 0 ? "Today" : dayNames[currentDate.getDay()];
    const dateString = `${
      months[currentDate.getMonth()]
    } ${currentDate.getDate()}`;

    // Generate random availability for slots
    const slots: TimeSlot[] = timeSlots.map((time) => ({
      time,
      available: Math.random() > 0.3, // 70% chance of being available
      clientXNumber:
        Math.random() > 0.7
          ? `X${Math.floor(Math.random() * 90000) + 10000}/${
              Math.floor(Math.random() * 90) + 10
            }`
          : undefined,
    }));

    schedule.push({
      date: dateString,
      dayName,
      dayNumber: currentDate.getDate(),
      slots,
      hasAvailability: slots.some((slot) => slot.available),
    });
  }

  return schedule;
};

// Function to generate week range string
const generateWeekRange = (weekOffset: number = 0): string => {
  const today = new Date();
  today.setDate(today.getDate() + weekOffset * 7);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 6);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const startMonth = months[today.getMonth()];
  const endMonth = months[endDate.getMonth()];

  if (startMonth === endMonth) {
    return `${startMonth} ${today.getDate()} - ${endDate.getDate()}`;
  } else {
    return `${startMonth} ${today.getDate()} - ${endMonth} ${endDate.getDate()}`;
  }
};

export function QuickBookingDialog({
  isOpen,
  onClose,
  doctors = defaultDoctors,
  onDoctorChange,
  onTimeSlotSelect,
  onWeekChange,
  enableAnimations = true,
}: QuickBookingDialogProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [showConfirmationView, setShowConfirmationView] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    day: string;
    time: string;
    dayName: string;
  } | null>(null);

  // Generate current week schedule and range based on offset
  const currentWeekSchedule = generateWeekSchedule(currentWeekOffset);
  const currentWeekRange = generateWeekRange(currentWeekOffset);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;
  const doctorDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        doctorDropdownRef.current &&
        !doctorDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDoctorDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdowns on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDoctorDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const handleDoctorChange = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDoctorDropdownOpen(false);
    onDoctorChange?.(doctor.id);
  };

  const handleTimeSlotClick = (day: string, time: string) => {
    if (selectedDoctor) {
      const dayInfo = currentWeekSchedule.find((d) => d.date === day);
      setSelectedTimeSlot({
        day,
        time,
        dayName: dayInfo?.dayName || day,
      });
      setShowConfirmationView(true);
      onTimeSlotSelect?.(day, time, selectedDoctor.id);
    }
  };

  const handleBackToMain = () => {
    setShowConfirmationView(false);
    setSelectedTimeSlot(null);
  };

  const handleConfirmBooking = () => {
    // Handle booking confirmation logic here
    setShowConfirmationView(false);
    setSelectedTimeSlot(null);
    onClose();
  };

  const handleWeekNavigation = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentWeekOffset(currentWeekOffset - 1);
    } else {
      setCurrentWeekOffset(currentWeekOffset + 1);
    }
    onWeekChange?.(direction);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-[75vw] sm:min-w-[450px] h-[70vh] max-h-[70vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Quick Booking</DialogTitle>
          <DialogDescription className="mb-4">
            Select a doctor and available time slot
          </DialogDescription>

          {/* Doctor Selector - Moved to header */}
          <div className="relative z-50">
            <label className="block text-sm font-medium text-foreground mb-2">
              Choose Doctor
            </label>
            <div className="relative z-50" ref={doctorDropdownRef}>
              <motion.button
                whileHover={
                  shouldAnimate
                    ? {
                        scale: 1.01,
                        transition: {
                          type: "spring" as const,
                          stiffness: 400,
                          damping: 25,
                        },
                      }
                    : {}
                }
                whileTap={shouldAnimate ? { scale: 0.99 } : {}}
                onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                aria-expanded={isDoctorDropdownOpen}
                aria-haspopup="listbox"
                className="w-full flex items-center justify-between p-3 bg-muted rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium text-foreground">
                    {selectedDoctor ? selectedDoctor.name : "Select a doctor"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedDoctor
                      ? selectedDoctor.specialization
                      : "Choose from available doctors"}
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    isDoctorDropdownOpen && "rotate-180"
                  )}
                />
              </motion.button>

              <AnimatePresence>
                {isDoctorDropdownOpen && (
                  <motion.div
                    initial={
                      shouldAnimate ? { opacity: 0, y: -10, scale: 0.95 } : {}
                    }
                    animate={
                      shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : {}
                    }
                    exit={
                      shouldAnimate ? { opacity: 0, y: -10, scale: 0.95 } : {}
                    }
                    transition={
                      shouldAnimate
                        ? { type: "spring", stiffness: 400, damping: 25 }
                        : {}
                    }
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-lg shadow-xl z-[9999] overflow-hidden"
                    role="listbox"
                  >
                    {doctors.map((doctor, index) => (
                      <motion.button
                        key={doctor.id}
                        initial={shouldAnimate ? { opacity: 0, x: -10 } : {}}
                        animate={shouldAnimate ? { opacity: 1, x: 0 } : {}}
                        transition={
                          shouldAnimate ? { delay: index * 0.05 } : {}
                        }
                        whileHover={
                          shouldAnimate
                            ? {
                                backgroundColor: "hsl(var(--muted))",
                                transition: { duration: 0.15 },
                              }
                            : {}
                        }
                        onClick={() => handleDoctorChange(doctor)}
                        role="option"
                        aria-selected={doctor.id === selectedDoctor?.id}
                        className="w-full text-left p-2.5 hover:bg-muted transition-colors"
                      >
                        <div className="font-medium text-foreground">
                          {doctor.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {doctor.specialization}
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex-1 overflow-hidden">
          {/* Main Content */}
          <motion.div
            initial={false}
            animate={{
              y: showConfirmationView ? "-20px" : "0px",
              opacity: showConfirmationView ? 0.3 : 1,
              scale: showConfirmationView ? 0.95 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            className="w-full h-full flex flex-col"
          >
            <motion.div
              variants={shouldAnimate ? containerVariants : {}}
              initial={shouldAnimate ? "hidden" : "visible"}
              animate="visible"
              className="p-6 pt-2 flex flex-col h-full"
            >
              {/* Conditional rendering: only show calendar if doctor is selected */}
              {selectedDoctor ? (
                <div className="space-y-3">
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
                    className="space-y-4 max-h-[350px] overflow-y-auto scrollbar-hide pb-6"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {currentWeekSchedule.map((day) => (
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
                            className="grid grid-cols-5 gap-2 px-2"
                          >
                            {day.slots.map((slot) => (
                              <motion.button
                                key={`${day.date}-${slot.time}`}
                                variants={shouldAnimate ? timeSlotVariants : {}}
                                whileHover={
                                  shouldAnimate && slot.available
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
                                  shouldAnimate && slot.available
                                    ? { scale: 0.98 }
                                    : {}
                                }
                                onClick={() =>
                                  slot.available &&
                                  handleTimeSlotClick(day.date, slot.time)
                                }
                                disabled={!slot.available}
                                aria-label={`${
                                  slot.available ? "Book" : "Occupied"
                                } time slot ${slot.time} on ${day.dayName}, ${
                                  day.date
                                }`}
                                className={cn(
                                  "px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[100px]",
                                  slot.available
                                    ? "bg-background border-border/50 hover:border-border hover:bg-muted text-foreground cursor-pointer"
                                    : "bg-red-50 border-red-200 text-red-700 cursor-not-allowed"
                                )}
                              >
                                <div className="text-center">
                                  <div className="font-medium">{slot.time}</div>
                                  <div className="text-xs">
                                    {slot.available
                                      ? "Empty Slot"
                                      : maskXNumber(slot.clientXNumber || "")}
                                  </div>
                                </div>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  variants={shouldAnimate ? itemVariants : {}}
                  className="text-center py-8"
                >
                  <p className="text-muted-foreground">
                    Please select a doctor to view available time slots
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Confirmation View */}
          <motion.div
            initial={false}
            animate={{
              y: showConfirmationView ? "0%" : "100%",
              opacity: showConfirmationView ? 1 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            className="absolute top-0 left-0 w-full h-full bg-card overflow-y-auto"
          >
            <div className="p-6 space-y-6">
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

              {/* Doctor info summary */}
              {selectedDoctor && (
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {selectedDoctor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {selectedDoctor.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedDoctor.specialization}
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
                      <span className="text-muted-foreground">Doctor:</span>
                      <span className="text-foreground font-medium">
                        {selectedDoctor?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="text-foreground font-medium">
                        1 hour
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="text-foreground font-medium">
                        Consultation
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
                className="w-full relative overflow-hidden py-3 rounded-lg font-semibold transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground border cursor-pointer group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
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
                </span>
                {/* Gradient shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuickBookingDialog;
