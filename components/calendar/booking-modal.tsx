"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Combobox } from "@/components/ui/combobox";
import { isWorkingDay } from "@/lib/working-days-utils";
import { toast } from "sonner";

interface Department {
  id: number;
  name: string;
  description: string;
  slots_per_day: number;
  working_days: string[];
  working_hours: { start: string; end: string };
  color: string;
  is_active: boolean;
}

interface Client {
  id: number;
  xNumber: string;
  name: string;
  phone: string;
  category: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedSlot: number | null;
  userRole: "client" | "receptionist" | "admin";
  currentUserId?: number;
  onAppointmentBooked: () => void;
}

export function BookingModal({
  isOpen,
  onClose,
  selectedDate,
  selectedSlot,
  userRole,
  currentUserId,
  onAppointmentBooked,
}: BookingModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data from API
  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      if (userRole === "receptionist" || userRole === "admin") {
        fetchClients();
      } else if (userRole === "client" && currentUserId) {
        setSelectedClientId(currentUserId.toString());
      }
    }
  }, [isOpen, userRole, currentUserId]);

  // Debounced search for clients
  useEffect(() => {
    if (!isOpen || userRole === "client") return;

    const timeoutId = setTimeout(() => {
      fetchClients(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isOpen, userRole]);

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

  const fetchClients = async (search?: string) => {
    try {
      const url = search
        ? `/api/clients?search=${encodeURIComponent(search)}`
        : "/api/clients";
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        const transformedClients = data.data.map((client: any) => ({
          id: client.id,
          xNumber: client.x_number,
          name: client.name,
          phone: client.phone,
          category: client.category,
        }));
        setClients(transformedClients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDepartmentId("");
      if (userRole !== "client") {
        setSelectedClientId("");
      }
      setNotes("");
      setError("");
      setSearchTerm("");
    }
  }, [isOpen, userRole]);

  // Clear selected department if it's no longer available on the selected date
  useEffect(() => {
    if (selectedDepartmentId && selectedDate && departments.length > 0) {
      const selectedDept = departments.find(
        (d) => d.id === Number.parseInt(selectedDepartmentId)
      );
      if (selectedDept && !isWorkingDay(selectedDept as any, selectedDate)) {
        setSelectedDepartmentId("");
      }
    }
  }, [selectedDate, selectedDepartmentId, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!selectedDepartmentId) {
        throw new Error("Please select a department");
      }

      if (!selectedClientId) {
        throw new Error("Please select a client");
      }

      if (!selectedDate || selectedSlot === null) {
        throw new Error("Invalid date or slot");
      }

      // Check if the selected date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        throw new Error("Cannot book appointments in the past");
      }

      // Find department data
      const department = departments.find(
        (d) => d.id === Number.parseInt(selectedDepartmentId)
      );
      if (!department) {
        throw new Error("Department not found");
      }

      // For client role, use currentUserId; for staff roles, use selectedClientId
      const clientId =
        userRole === "client"
          ? currentUserId
          : Number.parseInt(selectedClientId);
      const bookedBy = currentUserId || 1; // Default to 1 if no currentUserId

      // Create appointment via API
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          department_id: Number.parseInt(selectedDepartmentId),
          appointment_date: selectedDate.toISOString().split("T")[0],
          slot_number: selectedSlot,
          notes: notes || null,
          booked_by: bookedBy,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to book appointment");
      }


      // Show success toast
      const selectedClient = clients.find((c) => c.id === clientId);
      const formattedDate = selectedDate.toLocaleDateString();

      toast.success("Appointment Booked Successfully! 🎉", {
        description: `${selectedClient?.name || "Client"} - ${
          department.name
        } on ${formattedDate}, Slot ${selectedSlot}`,
        duration: 5000,
      });

      // Call the callback to refresh appointments list
      onAppointmentBooked();

      // Close modal
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to book appointment";
      setError(errorMessage);

      // Show error toast
      toast.error("Booking Failed", {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter departments based on working days for selected date
  const availableDepartments = departments.filter((department) => {
    if (!selectedDate) return false;
    return isWorkingDay(department as any, selectedDate);
  });

  // Prepare client options for combobox
  const clientOptions = clients.map((client) => ({
    value: client.id.toString(),
    label: `${client.xNumber} - ${client.name}`,
  }));

  if (!selectedDate || selectedSlot === null) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Booking for{" "}
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            - Slot {selectedSlot}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="department">Department *</Label>
            <Select
              value={selectedDepartmentId}
              onValueChange={setSelectedDepartmentId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {availableDepartments.length > 0 ? (
                  availableDepartments.map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: department.color }}
                        />
                        {department.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No departments available on this date
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {(userRole === "receptionist" || userRole === "admin") && (
            <div>
              <Label htmlFor="client">Client *</Label>
              <Combobox
                options={clientOptions}
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                onSearchChange={setSearchTerm}
                placeholder="Select a client..."
                searchPlaceholder="Search by X-number or name..."
                emptyText="No clients found."
                className="w-full"
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes for this appointment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
