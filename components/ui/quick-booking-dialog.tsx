"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from "sonner";

interface TimeSlot {
  time: string;
  available: boolean;
  clientXNumber?: string;
  clientId?: number;
  isNonWorkingDay?: boolean;
}

interface DaySchedule {
  date: string;
  fullDate: string; // YYYY-MM-DD format for proper date comparison
  dayName: string;
  dayNumber: number;
  slots: TimeSlot[];
  hasAvailability: boolean;
  isWorkingDay?: boolean;
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
  category: string;
}

interface QuickBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  departments?: Department[];
  onDepartmentChange?: (departmentId: number) => void;
  onTimeSlotSelect?: (day: string, time: string, departmentId: number) => void;
  onWeekChange?: (direction: "prev" | "next") => void;
  enableAnimations?: boolean;
  userRole?: "client" | "receptionist" | "admin";
  currentUserId?: number;
}

// Client Selector Component with search functionality
interface ClientSelectorProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientChange: (clientId: string) => void;
  onSearchChange: (searchTerm: string) => void;
  searchTerm: string;
}

function ClientSelector({
  clients,
  selectedClient,
  onClientChange,
  onSearchChange,
  searchTerm,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);

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
            <CommandEmpty>
              No clients found. Start typing to search.
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.id.toString()}
                  onSelect={(currentValue) => {
                    onClientChange(
                      currentValue === selectedClient?.id.toString()
                        ? ""
                        : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedClient?.id.toString() === client.id.toString()
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to fetch real departments from API
const fetchDepartments = async (): Promise<Department[]> => {
  try {
    const response = await fetch("/api/departments");
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
};

// Helper function to fetch clients from API
const fetchClients = async (
  searchTerm: string = "",
  userRole: string = "receptionist",
  currentUserId?: number
): Promise<Client[]> => {
  try {
    // For clients, only return their own information
    if (userRole === "client" && currentUserId) {
      const response = await fetch(
        `/api/clients/stats?clientId=${currentUserId}`
      );
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        return data.data.map((client: any) => ({
          id: client.id,
          name: client.name,
          x_number: client.xNumber,
          phone: client.phone,
          category: client.category,
        }));
      }
      return [];
    }

    // For staff, fetch all clients with search
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    params.append("limit", "20"); // Limit to 20 results for dropdown

    const response = await fetch(`/api/clients/stats?${params.toString()}`);
    const data = await response.json();
    if (data.success) {
      return data.data.map((client: any) => ({
        id: client.id,
        name: client.name,
        x_number: client.xNumber,
        phone: client.phone,
        category: client.category,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
};

// Function to fetch real appointment schedule from API
const fetchWeekSchedule = async (
  departmentId: number,
  weekOffset: number = 0
): Promise<DaySchedule[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + weekOffset * 7);

    const response = await fetch(
      `/api/appointments/schedule?departmentId=${departmentId}&startDate=${startDate.toISOString()}`
    );
    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return [];
  }
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
  departments = [],
  onDepartmentChange,
  onTimeSlotSelect,
  onWeekChange,
  enableAnimations = true,
  userRole = "receptionist",
  currentUserId,
}: QuickBookingDialogProps) {
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
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
  const [realDepartments, setRealDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const departmentsLoadedRef = useRef(false);

  // Generate current week range based on offset
  const currentWeekRange = generateWeekRange(currentWeekOffset);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  // Fetch departments when dialog opens (only once)
  useEffect(() => {
    if (!isOpen) {
      // Reset the ref when dialog closes
      departmentsLoadedRef.current = false;
      return;
    }

    if (departmentsLoadedRef.current) return;

    const loadDepartments = async () => {
      if (departments.length === 0) {
        const fetchedDepartments = await fetchDepartments();
        setRealDepartments(fetchedDepartments);
      } else {
        setRealDepartments(departments);
      }
      departmentsLoadedRef.current = true;
    };
    loadDepartments();
  }, [isOpen]); // Only depend on isOpen

  // Fetch clients when search term changes or dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const loadClients = async () => {
      const fetchedClients = await fetchClients(
        clientSearchTerm,
        userRole,
        currentUserId
      );
      setClients(fetchedClients);

      // Auto-select client if user is a client and only one client is returned
      if (userRole === "client" && fetchedClients.length === 1) {
        setSelectedClient(fetchedClients[0]);
      }
    };

    const timeoutId = setTimeout(loadClients, clientSearchTerm ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm, isOpen, userRole, currentUserId]);

  // Fetch schedule when department or week changes
  useEffect(() => {
    const loadSchedule = async () => {
      if (selectedDepartment) {
        setLoading(true);
        const schedule = await fetchWeekSchedule(
          selectedDepartment.id,
          currentWeekOffset
        );
        setWeekSchedule(schedule);
        setLoading(false);
      }
    };
    loadSchedule();
  }, [selectedDepartment, currentWeekOffset]);

  // Use real departments or fetched departments
  const availableDepartments =
    departments.length > 0 ? departments : realDepartments;

  const handleDepartmentChange = (departmentId: string) => {
    const department = availableDepartments.find(
      (d) => d.id.toString() === departmentId
    );
    if (department) {
      setSelectedDepartment(department);
      onDepartmentChange?.(department.id);
    }
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id.toString() === clientId);
    if (client) {
      setSelectedClient(client);
    }
  };

  const handleTimeSlotClick = (day: string, time: string) => {
    if (selectedDepartment && selectedClient) {
      const dayInfo = weekSchedule.find((d: DaySchedule) => d.date === day);
      setSelectedTimeSlot({
        day,
        time,
        dayName: dayInfo?.dayName || day,
      });
      setShowConfirmationView(true);
      onTimeSlotSelect?.(day, time, selectedDepartment.id);
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

    try {
      const response = await fetch(
        `/api/appointments/cancel?departmentId=${selectedDepartment.id}&date=${
          day.fullDate
        }&slotNumber=${slot.time.replace(
          "Slot ",
          ""
        )}&clientId=${currentUserId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        // Refresh the schedule to show the cancellation
        const updatedSchedule = await fetchWeekSchedule(
          selectedDepartment.id,
          currentWeekOffset
        );
        setWeekSchedule(updatedSchedule);

        // Close dialog and reset state
        setShowCancelDialog(false);
        setAppointmentToCancel(null);

        // Show success toast
        toast.success("Appointment Cancelled! ✅", {
          description: `Your appointment for ${slot.time} has been cancelled successfully`,
          duration: 4000,
        });
      } else {
        // Show error toast
        toast.error("Cancellation Failed", {
          description:
            data.error || "Failed to cancel appointment. Please try again.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);

      // Show error toast
      toast.error("Cancellation Error", {
        description: "Failed to cancel appointment. Please try again.",
        duration: 4000,
      });
    }
  };

  const handleBackToMain = () => {
    setShowConfirmationView(false);
    setSelectedTimeSlot(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot || !selectedDepartment || !selectedClient) return;

    setLoading(true);
    try {
      // Extract slot number from time string (e.g., "Slot 1" -> 1)
      const slotNumber = parseInt(selectedTimeSlot.time.replace("Slot ", ""));

      // Convert date string back to ISO date
      const currentYear = new Date().getFullYear();
      const dateStr = selectedTimeSlot.day; // e.g., "Jan 15"
      const [month, day] = dateStr.split(" ");
      const monthIndex = [
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
      ].indexOf(month);
      const appointmentDate = new Date(currentYear, monthIndex, parseInt(day));

      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          departmentId: selectedDepartment.id,
          clientId: selectedClient.id,
          date: appointmentDate.toISOString(),
          slotNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the schedule to show the new booking
        const updatedSchedule = await fetchWeekSchedule(
          selectedDepartment.id,
          currentWeekOffset
        );
        setWeekSchedule(updatedSchedule);

        // Show success toast
        const formattedDate = appointmentDate.toLocaleDateString();
        toast.success("Quick Booking Successful! 🎉", {
          description: `${selectedClient.name} booked for ${selectedDepartment.name} on ${formattedDate}, ${selectedTimeSlot?.time}`,
          duration: 5000,
        });

        setShowConfirmationView(false);
        setSelectedTimeSlot(null);
        onClose();
      } else {
        console.error("Booking failed:", data.error);

        // Show error toast
        toast.error("Quick Booking Failed", {
          description:
            data.error || "Failed to book appointment. Please try again.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error booking appointment:", error);

      // Show error toast
      toast.error("Booking Error", {
        description:
          "Failed to book appointment. Please check your connection and try again.",
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
    const slotDate = new Date(fullDateString); // YYYY-MM-DD format
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

    // Non-working day styling
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

            {/* Department Selector - Moved to header */}
            <div className="relative z-50">
              <label className="block text-sm font-medium text-foreground mb-2">
                Choose Department
              </label>
              <Combobox
                options={availableDepartments.map((dept) => ({
                  value: dept.id.toString(),
                  label: dept.name,
                }))}
                value={selectedDepartment?.id.toString() || ""}
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
                {userRole === "client" ? "Booking For" : "Select Client *"}
              </label>
              {userRole === "client" ? (
                // Read-only display for clients
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
                      Loading your information...
                    </span>
                  )}
                </div>
              ) : (
                // Dropdown selector for staff
                <ClientSelector
                  clients={clients}
                  selectedClient={selectedClient}
                  onClientChange={handleClientChange}
                  onSearchChange={setClientSearchTerm}
                  searchTerm={clientSearchTerm}
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
                  loading ? (
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
                                          day.date,
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
                                      slot.isNonWorkingDay
                                    }
                                    aria-label={`${
                                      slot.available ? "Book" : "Occupied"
                                    } time slot ${slot.time} on ${
                                      day.dayName
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
                        {selectedDepartment.description}
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
                        <span className="text-muted-foreground">
                          Department:
                        </span>
                        <span className="text-foreground font-medium">
                          {selectedDepartment?.name}
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

      {/* Cancel Appointment Confirmation Dialog */}
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
            <Button variant="destructive" onClick={confirmCancelAppointment}>
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default QuickBookingDialog;
