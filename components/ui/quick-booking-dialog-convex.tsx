"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

// Types (same as your existing interfaces)
interface TimeSlot {
  time: string;
  available: boolean;
  clientXNumber?: string;
  clientId?: string | Id<"clients">;
  appointmentId?: Id<"appointments">;
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

interface Department {
  _id: Id<"departments">;
  name: string;
  description?: string;
  slots_per_day?: number;
}

interface Client {
  _id: Id<"clients">;
  name: string;
  x_number: string;
  phone: string;
  category: string;
}

interface QuickBookingDialogConvexProps {
  isOpen: boolean;
  onClose: () => void;
  departments?: Department[];
  onDepartmentChange?: (departmentId: string) => void;
  onTimeSlotSelect?: (day: string, time: string, departmentId: string) => void;
  onWeekChange?: (direction: "prev" | "next") => void;
  enableAnimations?: boolean;
  userRole?: "client" | "receptionist" | "admin";
  currentUserId?: string; // Convex ID string
  currentClientId?: Id<"clients">; // For client users
}

// Client Selector Component (simplified with Convex)
interface ClientSelectorProps {
  selectedClient: Client | null;
  onClientChange: (client: Client | null) => void;
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  userRole: string;
  currentUserId?: string;
  isLoading?: boolean;
}

function ClientSelector({
  selectedClient,
  onClientChange,
  searchTerm,
  onSearchChange,
  userRole,
  currentUserId,
  isLoading,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);

  // Use Convex for client data with search
  const clients = useQuery(
    api.queries.getClients,
    open || searchTerm.length > 0 ? { search: searchTerm || undefined } : "skip"
  );

  // Filter clients based on search term (client-side filtering for immediate feedback)
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchTerm) return clients;
    const search = searchTerm.toLowerCase();
    return clients.filter(
      (client: Client) =>
        client.name.toLowerCase().includes(search) ||
        client.x_number.toLowerCase().includes(search) ||
        client.phone.includes(search)
    );
  }, [clients, searchTerm]);

  const isLoadingClients = clients === undefined && (open || searchTerm.length > 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedClient
            ? `${selectedClient.name} (${selectedClient.x_number})`
            : "Select a client"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search by name or X-number..."
            value={searchTerm}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {isLoadingClients ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  No clients found. Start typing to search.
                </CommandEmpty>
                <CommandGroup>
                  {filteredClients?.map((client: Client) => (
                    <CommandItem
                      key={client._id}
                      value={client._id}
                      onSelect={() => {
                        onClientChange(
                          selectedClient?._id === client._id ? null : client
                        );
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedClient?._id === client._id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{client.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {client.x_number} • {client.category}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Function to generate week range string (Sunday-first)
const generateWeekRange = (weekOffset: number = 0): string => {
  const today = new Date();
  let startDate = new Date();

  if (weekOffset === 0) {
    // Current week: start from today
    startDate = new Date(today);
  } else if (weekOffset > 0) {
    // Future weeks: start from the next Sunday (week start)
    const daysUntilNextSunday = today.getDay() === 0 ? 7 : 7 - today.getDay();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilNextSunday);

    startDate = new Date(nextSunday);
    startDate.setDate(nextSunday.getDate() + (weekOffset - 1) * 7);
  } else {
    // Previous weeks: go to previous Sunday-based weeks (Sunday is week start)
    const currentSunday = new Date(today);
    const daysSinceSunday = today.getDay();
    currentSunday.setDate(today.getDate() - daysSinceSunday);

    startDate = new Date(currentSunday);
    startDate.setDate(currentSunday.getDate() + weekOffset * 7);
  }

  const endDate = new Date(startDate);
  if (weekOffset === 0) {
    // For current week, end on Saturday (Sunday is the first day of the week)
    const daysUntilSaturday = 6 - startDate.getDay();
    if (startDate.getDay() === 0) {
      // If today is Sunday, show the full week (Sunday to Saturday)
      endDate.setDate(startDate.getDate() + 6);
    } else {
      // Show from today until Saturday
      endDate.setDate(startDate.getDate() + daysUntilSaturday);
    }
  } else {
    // For other weeks, show full 7 days (Sunday to Saturday)
    endDate.setDate(startDate.getDate() + 6);
  }

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const startMonth = months[startDate.getMonth()];
  const endMonth = months[endDate.getMonth()];

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}`;
  } else {
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`;
  }
};

export function QuickBookingDialogConvex({
  isOpen,
  onClose,
  departments = [],
  onDepartmentChange,
  onTimeSlotSelect,
  onWeekChange,
  enableAnimations = true,
  userRole = "receptionist",
  currentUserId,
  currentClientId,
}: QuickBookingDialogConvexProps) {
  // Local state (much simpler now!)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [showConfirmationView, setShowConfirmationView] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    day: string;
    time: string;
    dayName: string;
    fullDate: string;
  } | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<{
    day: DaySchedule;
    slot: TimeSlot;
  } | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Animation setup
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;
  const currentWeekRange = generateWeekRange(currentWeekOffset);

  // Calculate start date for schedule query
  const startDate = useMemo(() => {
    const today = new Date();
    let start = new Date(today);

    if (currentWeekOffset === 0) {
      // Current week: start from today
      start = new Date(today);
    } else if (currentWeekOffset > 0) {
      // Future weeks: start from the next Sunday (week start)
      const daysUntilNextSunday = today.getDay() === 0 ? 7 : 7 - today.getDay();
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + daysUntilNextSunday);

      start = new Date(nextSunday);
      start.setDate(nextSunday.getDate() + (currentWeekOffset - 1) * 7);
    } else {
      // Previous weeks: go to previous Sunday-based weeks
      const currentSunday = new Date(today);
      const daysSinceSunday = today.getDay();
      currentSunday.setDate(today.getDate() - daysSinceSunday);

      start = new Date(currentSunday);
      start.setDate(currentSunday.getDate() + currentWeekOffset * 7);
    }

    return start.toISOString();
  }, [currentWeekOffset]);

  // Convex queries - This replaces ALL your useEffect hooks!
  const fetchedDepartments = useQuery(api.queries.getDepartments, { isActive: true });

  // Query for client's own data when userRole is "client"
  const clientData = useQuery(
    api.queries.getClientById,
    currentClientId ? { id: currentClientId } : "skip"
  );

  // Query for all clients (for staff)
  const allClients = useQuery(
    api.queries.getClients,
    userRole !== "client" && isOpen ? {} : "skip"
  );

  // Query for schedule - only when department is selected
  const weekSchedule = useQuery(
    api.queries.getScheduleForDepartment,
    selectedDepartment && isOpen
      ? { departmentId: selectedDepartment._id, startDate }
      : "skip"
  );

  const bookMutation = useMutation(api.mutations.createAppointment);
  const cancelMutation = useMutation(api.mutations.cancelAppointment);

  // Use fetched departments if no departments prop provided
  const availableDepartments = Array.isArray(departments) && departments.length > 0
    ? departments
    : (Array.isArray(fetchedDepartments) ? fetchedDepartments : []);

  // Auto-select client if user is a client
  useEffect(() => {
    if (userRole === "client" && clientData && !selectedClient) {
      setSelectedClient(clientData as Client);
    }
  }, [userRole, clientData, selectedClient]);

  // Loading states
  const clientsLoading = userRole === "client" ? clientData === undefined : allClients === undefined;
  const scheduleLoading = selectedDepartment && weekSchedule === undefined;
  const departmentsLoading = fetchedDepartments === undefined;

  const handleDepartmentChange = (departmentId: string) => {
    const department = availableDepartments.find(
      (d) => d._id === departmentId
    );
    if (department) {
      setSelectedDepartment(department);
      onDepartmentChange?.(department._id);
    }
  };

  const handleTimeSlotClick = (day: DaySchedule, time: string) => {
    if (selectedDepartment && selectedClient) {
      setSelectedTimeSlot({
        day: day.date,
        time,
        dayName: day.dayName,
        fullDate: day.fullDate,
      });
      setShowConfirmationView(true);
      onTimeSlotSelect?.(day.date, time, selectedDepartment._id);
    }
  };

  const handleCancelAppointment = (day: DaySchedule, slot: TimeSlot) => {
    if (!selectedDepartment || !isOwnAppointment(slot)) return;
    setAppointmentToCancel({ day, slot });
    setShowCancelDialog(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel || !selectedDepartment || !selectedClient) return;

    const { slot } = appointmentToCancel;

    if (!slot.appointmentId) {
      toast.error("Cancellation Failed", {
        description: "Could not find the appointment to cancel.",
      });
      return;
    }

    setIsCancelling(true);
    try {
      await cancelMutation({
        id: slot.appointmentId,
      });

      toast.success("Appointment Cancelled! ✅", {
        description: "Your appointment has been cancelled successfully.",
        duration: 4000,
      });

      setShowCancelDialog(false);
      setAppointmentToCancel(null);
    } catch (error: any) {
      toast.error("Cancellation Failed", {
        description: error.message || "Failed to cancel appointment. Please try again.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot || !selectedDepartment || !selectedClient) return;

    const slotNumber = parseInt(selectedTimeSlot.time.replace("Slot ", ""));

    setIsBooking(true);
    try {
      await bookMutation({
        client_id: selectedClient._id,
        department_id: selectedDepartment._id,
        appointment_date: selectedTimeSlot.fullDate,
        slot_number: slotNumber,
        status: "booked",
      });

      toast.success("Booking Successful! 🎉", {
        description: "Your appointment has been booked successfully.",
        duration: 5000,
      });

      setShowConfirmationView(false);
      setSelectedTimeSlot(null);
      onClose();
    } catch (error: any) {
      toast.error("Booking Failed", {
        description: error.message || "Failed to book appointment. Please try again.",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleWeekNavigation = (direction: "prev" | "next") => {
    const newOffset = direction === "prev" ? currentWeekOffset - 1 : currentWeekOffset + 1;
    setCurrentWeekOffset(newOffset);
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

  const isPastDate = (fullDateString: string) => {
    const slotDate = new Date(fullDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    slotDate.setHours(0, 0, 0, 0);
    return slotDate < today;
  };

  const isOwnAppointment = (slot: TimeSlot) => {
    if (!selectedClient) return false;
    return !slot.available && slot.clientId === selectedClient._id;
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
      return maskXNumber(slot.clientXNumber || "");
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-h-[85vh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>Quick Booking</DialogTitle>
            <DialogDescription className="mb-4">
              Select a department and available time slot
            </DialogDescription>

            {/* Client Selector - Moved before department */}
            <div className="space-y-2">
              {userRole === "client" ? (
                // Read-only display for clients - centered
                <div className="w-full p-3 rounded-md bg-muted/10 flex justify-center">
                  {clientsLoading ? (
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  ) : selectedClient ? (
                    <div className="flex flex-col text-center">
                      <span className="font-medium">{selectedClient.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedClient.x_number} • {selectedClient.category}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Loading your information...
                    </span>
                  )}
                </div>
              ) : (
                // Dropdown selector for staff with label
                <>
                  <label className="block text-sm font-medium text-foreground">
                    Select Client *
                  </label>
                  <ClientSelector
                    selectedClient={selectedClient}
                    onClientChange={setSelectedClient}
                    searchTerm={clientSearchTerm}
                    onSearchChange={setClientSearchTerm}
                    userRole={userRole}
                    currentUserId={currentUserId}
                    isLoading={clientsLoading}
                  />
                </>
              )}
            </div>

            {/* Department Selector */}
            <div className="relative z-50">
              <label className="block text-sm font-medium text-foreground mb-2">
                Choose Department
              </label>
              {departmentsLoading ? (
                <div className="w-full h-10 bg-muted animate-pulse rounded-md" />
              ) : (
                <Combobox
                  options={availableDepartments.map((dept) => ({
                    value: dept._id,
                    label: dept.name,
                  }))}
                  value={selectedDepartment?._id || ""}
                  onValueChange={handleDepartmentChange}
                  placeholder="Select a department"
                  searchPlaceholder="Search departments..."
                  emptyText="No departments found."
                  className="w-full"
                />
              )}
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
                className="p-4 pt-2 flex flex-col h-full overflow-y-auto"
              >
                {/* Conditional rendering: only show calendar if both department and client are selected */}
                {selectedDepartment && selectedClient ? (
                  scheduleLoading ? (
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
                              shouldAnimate ? { scale: 1.05 } : {}
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
                              shouldAnimate ? { scale: 1.05 } : {}
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
                        className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide pb-4 bg-background"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {/* TanStack Status Debug (development only) */}
                        {process.env.NODE_ENV === "development" && (
                          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                            Convex Status: {weekSchedule?.length || 0} days •
                            Loading: {scheduleLoading ? 'Yes' : 'No'}
                          </div>
                        )}

                        {!weekSchedule || weekSchedule.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No schedule data available</p>
                          </div>
                        ) : (
                          weekSchedule.map((day: DaySchedule) => (
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
                              {day.hasAvailability ? (
                                <motion.div
                                  variants={
                                    shouldAnimate ? containerVariants : {}
                                  }
                                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-2 px-2"
                                >
                                  {day.slots.map((slot: TimeSlot) => (
                                    <motion.button
                                      key={`${day.date}-${slot.time}`}
                                      variants={
                                        shouldAnimate ? timeSlotVariants : {}
                                      }
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
                                      onClick={() => {
                                        if (
                                          slot.available &&
                                          !isPastDate(day.fullDate) &&
                                          !slot.isNonWorkingDay
                                        ) {
                                          handleTimeSlotClick(
                                            day,
                                            slot.time
                                          );
                                        } else if (
                                          isOwnAppointment(slot) &&
                                          !isPastDate(day.fullDate) &&
                                          !slot.isNonWorkingDay
                                        ) {
                                          handleCancelAppointment(day, slot);
                                        }
                                      }}
                                      disabled={
                                        isPastDate(day.fullDate) ||
                                        slot.isNonWorkingDay ||
                                        isBooking ||
                                        isCancelling
                                      }
                                      aria-label={`${slot.available ? "Book" : "Occupied"
                                        } time slot ${slot.time} on ${day.dayName
                                        }, ${day.date}`}
                                      className={cn(
                                        "px-2 py-2 text-xs sm:text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[80px] sm:min-w-[100px]",
                                        getSlotStyling(slot, day.fullDate)
                                      )}
                                    >
                                      <div className="text-center relative">
                                        <div className="font-medium">
                                          {slot.time}
                                        </div>
                                        <div className="text-xs">
                                          {getSlotText(slot)}
                                        </div>
                                        {isOwnAppointment(slot) &&
                                          !isPastDate(day.fullDate) && (
                                            <div className="absolute -top-1 -right-1 text-red-500 opacity-80 font-bold">
                                              ×
                                            </div>
                                          )}
                                      </div>
                                    </motion.button>
                                  ))}
                                </motion.div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                  No available slots for this day
                                </div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    </div>
                  )
                ) : (
                  <motion.div
                    variants={shouldAnimate ? itemVariants : {}}
                    className="text-center py-8"
                  >
                    <p className="text-muted-foreground">
                      {!selectedDepartment && !selectedClient
                        ? "Please select a department and client to view available time slots"
                        : !selectedDepartment
                          ? "Please select a department to continue"
                          : "Please select a client to continue"}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {/* Confirmation View - Same as original but with mutation loading states */}
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
              {selectedTimeSlot && (
                <div className="p-6 space-y-6">
                  {/* Header with back button */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => setShowConfirmationView(false)}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold text-foreground">
                      Confirm Booking
                    </h3>
                    <div></div>
                  </div>

                  {/* Booking details */}
                  <div className="space-y-4">
                    <div className="text-center">
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
                        <span className="text-muted-foreground">Department:</span>
                        <span className="text-foreground font-medium">
                          {selectedDepartment?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confirm button with loading state */}
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={isBooking}
                    className="w-full"
                  >
                    {isBooking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Booking...
                      </>
                    ) : (
                      'CONFIRM BOOKING'
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Dialog with loading state */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your appointment?
            </DialogDescription>
          </DialogHeader>

          {appointmentToCancel && (
            <div className="py-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Department:</span>{" "}
                  {selectedDepartment?.name}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {appointmentToCancel.day.dayName},{" "}
                  {appointmentToCancel.day.date}
                </div>
                <div>
                  <span className="font-medium">Time:</span>{" "}
                  {appointmentToCancel.slot.time}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setAppointmentToCancel(null);
              }}
              disabled={isCancelling}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelAppointment}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Cancelling...
                </>
              ) : (
                'Cancel Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default QuickBookingDialogConvex;
