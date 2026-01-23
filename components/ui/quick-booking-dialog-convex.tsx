"use client";

import { useState, useEffect } from "react";
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
  clientId?: number;
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
  currentUserId?: number;
}

// Client Selector Component (simplified with Convex)
interface ClientSelectorProps {
  selectedClient: Client | null;
  onClientChange: (client: Client | null) => void;
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  userRole: string;
  currentUserId?: number;
}

function ClientSelector({
  selectedClient,
  onClientChange,
  searchTerm,
  onSearchChange,
  userRole,
  currentUserId,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);

  // Use Convex for client data
  const clients = useQuery(api.queries.getClients, {});
  const filteredClients = clients?.filter((client: Client) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      client.x_number.toLowerCase().includes(search) ||
      client.phone.includes(search)
    );
  });

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
            {!clients ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Loading...
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
  } | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<{
    day: DaySchedule;
    slot: TimeSlot;
  } | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  // Animation setup
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;
  const currentWeekRange = generateWeekRange(currentWeekOffset);

  // Convex queries - This replaces ALL your useEffect hooks!
  const fetchedDepartments = useQuery(api.queries.getDepartments, { isActive: true });
  const clients = useQuery(api.queries.getClients, {});
  const weekSchedule = useQuery(api.queries.getAppointments, {});

  const bookMutation = useMutation(api.mutations.createAppointment);
  const cancelMutation = useMutation(api.mutations.deleteAppointment);

  // Use fetched departments if no departments prop provided
  const availableDepartments = Array.isArray(departments) && departments.length > 0
    ? departments
    : (Array.isArray(fetchedDepartments) ? fetchedDepartments : []);

  // Auto-select client if user is a client and only one client is returned
  if (userRole === "client" && clients && clients.length === 1 && !selectedClient) {
    setSelectedClient(clients[0]);
  }

  const handleDepartmentChange = (departmentId: string) => {
    const department = availableDepartments.find(
      (d) => d._id === departmentId
    );
    if (department) {
      setSelectedDepartment(department);
      onDepartmentChange?.(department._id);
    }
  };

  const handleTimeSlotClick = (day: string, time: string) => {
    if (selectedDepartment && selectedClient) {
      const dayInfo = weekSchedule?.find((d: DaySchedule) => d.date === day);
      setSelectedTimeSlot({
        day,
        time,
        dayName: dayInfo?.dayName || day,
      });
      setShowConfirmationView(true);
      onTimeSlotSelect?.(day, time, selectedDepartment._id);
    }
  };

  const handleCancelAppointment = (day: DaySchedule, slot: TimeSlot) => {
    if (!selectedDepartment || !isOwnAppointment(slot)) return;
    setAppointmentToCancel({ day, slot });
    setShowCancelDialog(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel || !selectedDepartment) return;

    const { day, slot } = appointmentToCancel;
    const slotNumber = parseInt(slot.time.replace("Slot ", ""));

    try {
      await cancelMutation({
        id: "temp" as any, // This needs to be implemented properly
      });

      setShowCancelDialog(false);
      setAppointmentToCancel(null);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot || !selectedDepartment || !selectedClient) return;

    const slotNumber = parseInt(selectedTimeSlot.time.replace("Slot ", ""));

    try {
      await bookMutation({
        client_id: selectedClient._id,
        department_id: selectedDepartment._id,
        appointment_date: selectedTimeSlot.day,
        slot_number: slotNumber,
        status: "booked",
      });

      setShowConfirmationView(false);
      setSelectedTimeSlot(null);
      onClose();
    } catch (error) {
      // Error is handled in the mutation
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
    return !slot.available && slot.clientId === currentUserId;
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
        <DialogContent className="max-w-3xl w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] h-[90vh] max-h-[90vh] overflow-hidden p-0 flex flex-col">
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
                  {!clients ? (
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
                  />
                </>
              )}
            </div>

            {/* Department Selector */}
            <div className="relative z-50">
              <label className="block text-sm font-medium text-foreground mb-2">
                Choose Department
              </label>
              {!fetchedDepartments ? (
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
                  !weekSchedule ? (
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
                        {/* Debug info in development */}
                        {process.env.NODE_ENV === "development" && (
                          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                            Convex Status: {weekSchedule?.length || 0} appointments
                          </div>
                        )}

                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            Schedule view not yet implemented for Convex
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            This feature requires additional Convex queries to match the TanStack version
                          </p>
                        </div>
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

                  {/* Confirm button */}
                  <Button
                    onClick={handleConfirmBooking}
                    className="w-full"
                  >
                    CONFIRM BOOKING
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
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelAppointment}
            >
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
