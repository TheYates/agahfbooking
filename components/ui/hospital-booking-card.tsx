"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TimeSlot {
  time: string;
  available: boolean;
  clientXNumber?: string;
}

interface DaySchedule {
  date: string; // ISO format (YYYY-MM-DD)
  displayDate: string; // Display format (e.g., "Aug 3")
  dayName: string;
  dayNumber: number;
  slots: TimeSlot[];
  hasAvailability: boolean;
}

interface Department {
  id: number;
  name: string;
  description: string;
  slots_per_day?: number;
}

interface Client {
  id: number;
  name: string;
  x_number: string;
  phone: string;
}

interface HospitalBookingProps {
  departments?: Department[];
  weekSchedule?: DaySchedule[];
  clients?: Client[];
  selectedClient?: Client | null;
  userRole?: "staff" | "client";
  currentUserId?: number;
  onDepartmentChange?: (department: Department) => void;
  onTimeSlotSelect?: (day: string, time: string) => void;
  onWeekChange?: (direction: "prev" | "next") => void;
  onClientChange?: (client: Client) => void;
  onBookingSuccess?: () => void;
  enableAnimations?: boolean;
  className?: string;
  loading?: boolean;
}

const defaultDepartments: Department[] = [
  { id: 1, name: "Cardiology", description: "Heart and cardiovascular care" },
  { id: 2, name: "Dermatology", description: "Skin and cosmetic treatments" },
  { id: 3, name: "Orthopedics", description: "Bone and joint care" },
  { id: 4, name: "Neurology", description: "Brain and nervous system" },
];

export function HospitalBookingCard({
  departments = defaultDepartments,
  weekSchedule = [],
  clients = [],
  selectedClient = null,
  userRole = "client",
  currentUserId,
  onDepartmentChange,
  onTimeSlotSelect,
  onWeekChange,
  onClientChange,
  onBookingSuccess,
  enableAnimations = true,
  className,
  loading = false,
}: HospitalBookingProps) {
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(departments[0] || null);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] =
    useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [weekRange, setWeekRange] = useState("Loading...");
  const [showConfirmationView, setShowConfirmationView] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    day: string;
    time: string;
    dayName: string;
  } | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;
  const departmentDropdownRef = useRef<HTMLDivElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Generate week range from schedule
  useEffect(() => {
    if (weekSchedule.length > 0) {
      const firstDay = weekSchedule[0];
      const lastDay = weekSchedule[weekSchedule.length - 1];
      setWeekRange(`${firstDay.displayDate} - ${lastDay.displayDate}`);
    }
  }, [weekSchedule]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDepartmentDropdownOpen(false);
      }
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClientDropdownOpen(false);
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
        setIsDepartmentDropdownOpen(false);
        setIsClientDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const handleDepartmentChange = (department: Department) => {
    setSelectedDepartment(department);
    setIsDepartmentDropdownOpen(false);
    onDepartmentChange?.(department);
  };

  const handleClientChange = (client: Client) => {
    setIsClientDropdownOpen(false);
    onClientChange?.(client);
  };

  const handleTimeSlotClick = (day: string, time: string) => {
    const dayInfo = weekSchedule.find((d) => d.date === day);
    setSelectedTimeSlot({
      day,
      time,
      dayName: dayInfo?.dayName || day,
    });
    setShowConfirmationView(true);
    onTimeSlotSelect?.(day, time);
  };

  const handleBackToMain = () => {
    setShowConfirmationView(false);
    setSelectedTimeSlot(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot || !selectedDepartment || !selectedClient) {
      console.error("Missing required booking information");
      return;
    }

    try {
      // Extract slot number from time string (e.g., "Slot 1" -> 1)
      const slotNumber = parseInt(selectedTimeSlot.time.replace("Slot ", ""));

      // Use the ISO date format directly
      const appointmentDate = new Date(selectedTimeSlot.day);

      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: userRole === "staff" ? selectedClient?.id : currentUserId,
          departmentId: selectedDepartment.id,
          date: appointmentDate.toISOString().split("T")[0],
          slotNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success toast
        toast.success("Appointment booked successfully!");

        // Close confirmation view
        setShowConfirmationView(false);
        setSelectedTimeSlot(null);

        // Call the success callback to refresh the schedule
        if (onBookingSuccess) {
          onBookingSuccess();
        }
      } else {
        console.error("Booking failed:", data.error);
        toast.error(data.error || "Failed to book appointment");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      // You could show an error message to the user here
    }
  };

  const handleWeekNavigation = (direction: "prev" | "next") => {
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
    return xNumber.substring(0, 4) + "**/**";
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
        type: "spring",
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
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  return (
    <motion.div
      variants={shouldAnimate ? containerVariants : {}}
      initial={shouldAnimate ? "hidden" : "visible"}
      animate="visible"
      className={cn(
        "bg-card rounded-xl border border-border/50 shadow-lg overflow-hidden max-w-2xl relative",
        className
      )}
    >
      <div className="relative h-auto">
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
          className="w-full"
        >
          {/* Hospital Header */}
          <motion.div
            variants={shouldAnimate ? itemVariants : {}}
            className="p-6 pb-6"
          >
            <div className="flex items-start justify-between gap-6">
              {/* Left Side - Hospital Icon */}
              <motion.div
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
                className="flex-shrink-0"
              >
                <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </motion.div>

              {/* Center - Hospital Info */}
              <div className="flex-1 min-w-0 space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Quick Booking
                </h2>

                {/* Details Row */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Schedule your appointment</span>
                  {selectedDepartment && (
                    <>
                      <span>•</span>
                      <span>{selectedDepartment.name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side - Status */}
              <motion.div
                initial={
                  shouldAnimate
                    ? {
                        opacity: 0,
                        scale: 0.8,
                        x: 20,
                        filter: "blur(4px)",
                      }
                    : {}
                }
                animate={
                  shouldAnimate
                    ? {
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        filter: "blur(0px)",
                      }
                    : {}
                }
                transition={
                  shouldAnimate
                    ? {
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        delay: 0.3,
                        mass: 0.6,
                      }
                    : {}
                }
                className="text-right flex-shrink-0"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Available
                </p>
                <motion.p
                  className="text-2xl font-bold text-emerald-500"
                  initial={shouldAnimate ? { scale: 0.5 } : {}}
                  animate={shouldAnimate ? { scale: 1 } : {}}
                  transition={
                    shouldAnimate
                      ? {
                          type: "spring",
                          stiffness: 500,
                          damping: 20,
                          delay: 0.5,
                        }
                      : {}
                  }
                >
                  {weekSchedule.reduce(
                    (total, day) =>
                      total + day.slots.filter((slot) => slot.available).length,
                    0
                  )}
                </motion.p>
              </motion.div>
            </div>
          </motion.div>

          {/* Client Selector (for staff only) */}
          {userRole === "staff" && (
            <motion.div
              variants={shouldAnimate ? itemVariants : {}}
              className="px-6 pb-4 relative z-50"
              style={{ overflow: "visible" }}
            >
              <label className="block text-sm text-muted-foreground mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Booking for
              </label>
              <div className="relative z-50" ref={clientDropdownRef}>
                <motion.button
                  whileHover={
                    shouldAnimate
                      ? {
                          scale: 1.01,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          },
                        }
                      : {}
                  }
                  whileTap={shouldAnimate ? { scale: 0.99 } : {}}
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  aria-expanded={isClientDropdownOpen}
                  aria-haspopup="listbox"
                  className="w-full flex items-center justify-between p-3 bg-muted rounded-lg border border-border/50 hover:border-border transition-colors"
                >
                  <span className="text-foreground">
                    {selectedClient
                      ? `${selectedClient.name} (${selectedClient.x_number})`
                      : "Select client..."}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      isClientDropdownOpen && "rotate-180"
                    )}
                  />
                </motion.button>

                {/* Client Dropdown Menu */}
                <AnimatePresence>
                  {isClientDropdownOpen && (
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
                      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-lg shadow-xl z-[9999] overflow-hidden max-h-60 overflow-y-auto"
                      role="listbox"
                    >
                      {clients.map((client, index) => (
                        <motion.button
                          key={client.id}
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
                          onClick={() => handleClientChange(client)}
                          role="option"
                          aria-selected={client.id === selectedClient?.id}
                          className="w-full text-left p-3 hover:bg-muted transition-colors text-foreground"
                        >
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {client.x_number}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Department Selector */}
          <motion.div
            variants={shouldAnimate ? itemVariants : {}}
            className="px-6 pb-4 relative z-40"
            style={{ overflow: "visible" }}
          >
            <label className="block text-sm text-muted-foreground mb-2">
              Choose department
            </label>
            <div className="relative z-40" ref={departmentDropdownRef}>
              <motion.button
                whileHover={
                  shouldAnimate
                    ? {
                        scale: 1.01,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        },
                      }
                    : {}
                }
                whileTap={shouldAnimate ? { scale: 0.99 } : {}}
                onClick={() =>
                  setIsDepartmentDropdownOpen(!isDepartmentDropdownOpen)
                }
                aria-expanded={isDepartmentDropdownOpen}
                aria-haspopup="listbox"
                className="w-full flex items-center justify-between p-3 bg-muted rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <span className="text-foreground">
                  {selectedDepartment?.name || "Select department..."}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    isDepartmentDropdownOpen && "rotate-180"
                  )}
                />
              </motion.button>

              {/* Department Dropdown Menu */}
              <AnimatePresence>
                {isDepartmentDropdownOpen && (
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
                    {departments.map((department, index) => (
                      <motion.button
                        key={department.id}
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
                        onClick={() => handleDepartmentChange(department)}
                        role="option"
                        aria-selected={department.id === selectedDepartment?.id}
                        className="w-full text-left p-3 hover:bg-muted transition-colors text-foreground"
                      >
                        <div>
                          <div className="font-medium">{department.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {department.description}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Separator */}
          <motion.div
            variants={shouldAnimate ? itemVariants : {}}
            className="mx-6 border-t border-border/50"
          />

          {/* Week Navigation */}
          <motion.div
            variants={shouldAnimate ? itemVariants : {}}
            className="p-6 pb-4"
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

              <h3 className="font-semibold text-foreground">{weekRange}</h3>

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

          {/* Loading State */}
          {loading ? (
            <motion.div
              variants={shouldAnimate ? itemVariants : {}}
              className="px-6 pb-6 text-center py-8"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Loading available slots...
              </p>
            </motion.div>
          ) : weekSchedule.length === 0 ? (
            <motion.div
              variants={shouldAnimate ? itemVariants : {}}
              className="px-6 pb-6 text-center py-8"
            >
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No available slots for this week
              </p>
            </motion.div>
          ) : (
            /* Daily Schedule */
            <motion.div
              variants={shouldAnimate ? itemVariants : {}}
              className="px-6 pb-6 space-y-4"
            >
              {weekSchedule.map((day) => {
                // Check if this day is in the past
                const slotDate = new Date(day.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPastDate = slotDate < today;

                return (
                  <motion.div
                    key={day.date}
                    variants={shouldAnimate ? itemVariants : {}}
                    className="space-y-3"
                  >
                    {/* Day Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2">
                      <div>
                        <h4 className="font-medium text-sm sm:text-base text-foreground">
                          {day.dayName}, {day.displayDate}
                        </h4>
                      </div>
                      {!day.hasAvailability && (
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          No Availability
                        </span>
                      )}
                    </div>

                    {/* Time Slots */}
                    {day.hasAvailability && (
                      <motion.div
                        variants={shouldAnimate ? containerVariants : {}}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
                      >
                        {day.slots.map((slot) => (
                          <motion.button
                            key={`${day.date}-${slot.time}`}
                            variants={shouldAnimate ? timeSlotVariants : {}}
                            whileHover={
                              shouldAnimate && slot.available && !isPastDate
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
                              shouldAnimate && slot.available && !isPastDate
                                ? { scale: 0.98 }
                                : {}
                            }
                            onClick={() =>
                              slot.available &&
                              !isPastDate &&
                              handleTimeSlotClick(day.date, slot.time)
                            }
                            disabled={
                              isPastDate ? slot.available : !slot.available
                            }
                            aria-label={`${
                              isPastDate
                                ? "Past date"
                                : slot.available
                                ? "Book"
                                : "Occupied"
                            } time slot ${slot.time} on ${day.dayName}, ${
                              day.displayDate
                            }`}
                            className={cn(
                              "px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 w-full",
                              isPastDate && slot.available
                                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                : isPastDate && !slot.available
                                ? "bg-red-100 border-red-300 text-red-600 cursor-not-allowed"
                                : slot.available
                                ? "bg-background border-border/50 hover:border-border hover:bg-muted text-foreground cursor-pointer"
                                : userRole === "client" &&
                                  selectedClient &&
                                  slot.clientXNumber === selectedClient.x_number
                                ? "bg-green-50 border-green-200 text-green-700 cursor-not-allowed"
                                : "bg-red-50 border-red-200 text-red-700 cursor-not-allowed"
                            )}
                          >
                            <div className="text-center">
                              <div className="font-medium">{slot.time}</div>
                              <div className="text-xs">
                                {slot.available
                                  ? isPastDate
                                    ? ""
                                    : "Empty Slot"
                                  : slot.clientXNumber
                                  ? userRole === "client" &&
                                    selectedClient &&
                                    slot.clientXNumber ===
                                      selectedClient.x_number
                                    ? slot.clientXNumber
                                    : maskXNumber(slot.clientXNumber)
                                  : "Occupied"}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Bottom Actions */}
          <motion.div
            variants={shouldAnimate ? itemVariants : {}}
            className="border-t border-border/50 p-6"
          >
            <div className="flex gap-3">
              <motion.button
                whileHover={
                  shouldAnimate
                    ? {
                        scale: 1.02,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        },
                      }
                    : {}
                }
                whileTap={shouldAnimate ? { scale: 0.98 } : {}}
                className="flex-1 bg-muted text-muted-foreground py-2.5 rounded-lg hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={
                  shouldAnimate
                    ? {
                        scale: 1.02,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        },
                      }
                    : {}
                }
                whileTap={shouldAnimate ? { scale: 0.98 } : {}}
                disabled={!selectedTimeSlot}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Book Appointment
              </motion.button>
            </div>
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
          className="absolute top-0 left-0 w-full h-full bg-card"
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
                Confirm Appointment
              </h3>
              <div></div> {/* Spacer for centering */}
            </div>

            {/* Department info summary */}
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  {selectedDepartment?.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedDepartment?.description}
                </p>
              </div>
            </div>

            {/* Booking details */}
            {selectedTimeSlot && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                    Your Appointment
                  </p>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-lg font-semibold text-foreground">
                      {selectedTimeSlot.dayName},{" "}
                      {
                        weekSchedule.find(
                          (d) => d.date === selectedTimeSlot.day
                        )?.displayDate
                      }
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {selectedTimeSlot.time}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="text-foreground font-medium">
                      {selectedDepartment?.name}
                    </span>
                  </div>
                  {userRole === "staff" && selectedClient && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Patient:</span>
                      <span className="text-foreground font-medium">
                        {selectedClient.name} ({selectedClient.x_number})
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="text-foreground font-medium">1 hour</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-emerald-600 font-medium">
                      Available
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
                CONFIRM APPOINTMENT
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
    </motion.div>
  );
}
