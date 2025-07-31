"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Calendar, Clock, User, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Department {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

interface Client {
  id: number;
  name: string;
  x_number: string;
  phone: string;
  category: string;
}

interface DaySchedule {
  date: string; // ISO format (YYYY-MM-DD) for date parsing
  displayDate: string; // Display format (e.g., "Aug 3") for UI
  dayName: string;
  dayNumber: number;
  slots: TimeSlot[];
  hasAvailability: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
  clientXNumber?: string;
}

interface EmbeddedBookingFormProps {
  userRole?: "client" | "receptionist" | "admin";
  currentUserId?: number;
  onBookingSuccess?: () => void;
}

// Helper function to get current week dates
const getCurrentWeekDates = (weekOffset: number = 0) => {
  const today = new Date();
  const currentDay = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay + weekOffset * 7);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDates.push(date);
  }
  return weekDates;
};

// Helper function to format week range
const formatWeekRange = (weekOffset: number = 0) => {
  const weekDates = getCurrentWeekDates(weekOffset);
  const startDate = weekDates[0];
  const endDate = weekDates[6];

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

  const startMonth = months[startDate.getMonth()];
  const endMonth = months[endDate.getMonth()];

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}`;
  } else {
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`;
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
    params.append("limit", "20");

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

export function EmbeddedBookingForm({
  userRole = "client",
  currentUserId,
  onBookingSuccess,
}: EmbeddedBookingFormProps) {
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    day: string;
    time: string;
    dayName: string;
    displayDate: string;
  }>({
    open: false,
    day: "",
    time: "",
    dayName: "",
    displayDate: "",
  });
  const departmentsLoadedRef = useRef(false);

  // Fetch departments
  useEffect(() => {
    if (departmentsLoadedRef.current) return;

    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/departments");
        const data = await response.json();
        if (data.success) {
          setDepartments(data.data);
          departmentsLoadedRef.current = true;
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch clients when component mounts
  useEffect(() => {
    const loadClients = async () => {
      const fetchedClients = await fetchClients("", userRole, currentUserId);
      setClients(fetchedClients);

      // Auto-select client if user is a client and only one client is returned
      if (userRole === "client" && fetchedClients.length === 1) {
        setSelectedClient(fetchedClients[0]);
      }
    };

    loadClients();
  }, [userRole, currentUserId]);

  // Fetch schedule when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      setWeekSchedule([]);
      return;
    }

    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const weekDates = getCurrentWeekDates(currentWeekOffset);
        const startDate = weekDates[0].toISOString();

        const response = await fetch(
          `/api/appointments/schedule?departmentId=${selectedDepartment.id}&startDate=${startDate}`
        );
        const data = await response.json();

        if (data.success) {
          setWeekSchedule(data.data);
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedDepartment, currentWeekOffset]);

  const handleTimeSlotSelect = (day: string, time: string, dayName: string) => {
    // Check if the selected date is in the past
    const selectedDate = new Date(day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    if (selectedDate < today) {
      setError("Cannot book appointments in the past");
      return;
    }

    if (!selectedClient || !selectedDepartment) {
      setError("Please select all required fields");
      return;
    }

    // Format display date
    const displayDate = selectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // Show confirmation dialog
    setConfirmationDialog({
      open: true,
      day,
      time,
      dayName,
      displayDate,
    });

    // Clear any previous errors
    setError("");
  };

  const handleConfirmBooking = async () => {
    if (!selectedClient || !selectedDepartment || !confirmationDialog.day) {
      setError("Please select all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Extract slot number from time string (e.g., "Slot 1" -> 1)
      const slotNumber = parseInt(confirmationDialog.time.replace("Slot ", ""));

      // Use the ISO date format directly (day parameter is already in YYYY-MM-DD format)
      const appointmentDate = new Date(confirmationDialog.day);

      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          departmentId: selectedDepartment.id,
          date: appointmentDate.toISOString().split("T")[0],
          slotNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      // Show success toast
      toast.success("Appointment booked successfully!");

      // Close confirmation dialog
      setConfirmationDialog({
        open: false,
        day: "",
        time: "",
        dayName: "",
        displayDate: "",
      });

      // Refresh schedule
      const weekDates = getCurrentWeekDates(currentWeekOffset);
      const startDate = weekDates[0].toISOString();

      const scheduleResponse = await fetch(
        `/api/appointments/schedule?departmentId=${selectedDepartment.id}&startDate=${startDate}`
      );
      const scheduleData = await scheduleResponse.json();

      if (scheduleData.success) {
        setWeekSchedule(scheduleData.data);
      }

      if (onBookingSuccess) {
        onBookingSuccess();
      }
    } catch (err) {
      console.error("Error booking appointment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to book appointment"
      );
      // Close confirmation dialog on error too
      setConfirmationDialog({
        open: false,
        day: "",
        time: "",
        dayName: "",
        displayDate: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekOffset((prev) =>
      direction === "next" ? prev + 1 : prev - 1
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Quick Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Client Information */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            {userRole === "client" ? "Booking For" : "Select Client"}
          </label>
          {userRole === "client" ? (
            <div className="w-full p-3 border border-border rounded-md bg-muted/50">
              {selectedClient ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{selectedClient.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {selectedClient.x_number} • {selectedClient.category}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  Loading your information...
                </span>
              )}
            </div>
          ) : (
            <Select
              value={selectedClient?.id.toString() || ""}
              onValueChange={(value) => {
                const client = clients.find((c) => c.id.toString() === value);
                setSelectedClient(client || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    <div className="flex flex-col">
                      <span>{client.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {client.x_number} • {client.category}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Department Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Select Department</label>
          <Select
            value={selectedDepartment?.id.toString() || ""}
            onValueChange={(value) => {
              const dept = departments.find((d) => d.id.toString() === value);
              setSelectedDepartment(dept || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Slot Selection */}
        {selectedDepartment && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">
                Select Time Slot
              </label>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWeekChange("prev")}
                  disabled={loading}
                  className="px-3 py-2"
                >
                  ←
                </Button>
                <span className="text-xs sm:text-sm font-medium px-2 text-center min-w-0 flex-1">
                  {formatWeekRange(currentWeekOffset)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWeekChange("next")}
                  disabled={loading}
                  className="px-3 py-2"
                >
                  →
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Loading available slots...
                </p>
              </div>
            ) : weekSchedule.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No available slots for this week</p>
              </div>
            ) : (
              <div className="space-y-4">
                {weekSchedule.map((day) => (
                  <div key={day.date} className="space-y-3">
                    {/* Day Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                      <h4 className="font-medium text-sm sm:text-base text-foreground">
                        {day.dayName}, {day.displayDate}
                      </h4>
                      {!day.hasAvailability && (
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          - No Availability
                        </span>
                      )}
                    </div>

                    {/* Time Slots */}
                    {day.hasAvailability && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-2">
                        {day.slots.map((slot) => {
                          // Check if this day is in the past
                          const slotDate = new Date(day.date);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isPastDate = slotDate < today;

                          return (
                            <button
                              key={`${day.date}-${slot.time}`}
                              onClick={() => {
                                if (slot.available && !isPastDate) {
                                  handleTimeSlotSelect(
                                    day.date,
                                    slot.time,
                                    day.dayName
                                  );
                                }
                              }}
                              disabled={
                                isPastDate ? slot.available : !slot.available
                              }
                              className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 w-full ${
                                isPastDate && slot.available
                                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                  : isPastDate && !slot.available
                                  ? "bg-red-100 border-red-300 text-red-600 cursor-not-allowed"
                                  : slot.available
                                  ? "bg-background border-border/50 hover:border-border hover:bg-muted text-foreground cursor-pointer"
                                  : userRole === "client" &&
                                    selectedClient &&
                                    slot.clientXNumber ===
                                      selectedClient.x_number
                                  ? "bg-green-50 border-green-200 text-green-700 cursor-not-allowed"
                                  : "bg-red-50 border-red-200 text-red-700 cursor-not-allowed"
                              }`}
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
                                      ? slot.clientXNumber // Show full X-number for client's own appointments
                                      : `${slot.clientXNumber.slice(0, 4)}**/**` // Mask other clients' X-numbers
                                    : "Occupied"}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationDialog.open}
        onOpenChange={(open) =>
          setConfirmationDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to book this appointment?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <p>
                <strong>Department:</strong> {selectedDepartment?.name}
              </p>
              <p>
                <strong>Date:</strong> {confirmationDialog.dayName},{" "}
                {confirmationDialog.displayDate}
              </p>
              <p>
                <strong>Time Slot:</strong> {confirmationDialog.time}
              </p>
              {selectedClient && (
                <p>
                  <strong>Client:</strong> {selectedClient.name} (
                  {selectedClient.x_number})
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmationDialog((prev) => ({ ...prev, open: false }))
              }
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking} disabled={loading}>
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
