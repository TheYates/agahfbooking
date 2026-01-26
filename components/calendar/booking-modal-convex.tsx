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
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface BookingModalConvexProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedSlot: number | null;
  userRole: "client" | "receptionist" | "admin";
  currentUserId?: string;
  onAppointmentBooked: () => void;
}

export function BookingModalConvex({
  isOpen,
  onClose,
  selectedDate,
  selectedSlot,
  userRole,
  currentUserId,
  onAppointmentBooked,
}: BookingModalConvexProps) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Convex queries
  const departments = useQuery(api.queries.getDepartments, { isActive: true });
  const allClients = useQuery(api.queries.getClients, {});

  // Convex mutation
  const createAppointment = useMutation(api.mutations.createAppointment);

  // Filter clients based on search term
  const filteredClients = allClients?.filter((client) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      client.x_number.toLowerCase().includes(search) ||
      client.phone.includes(search)
    );
  }) || [];

  // Set client ID for client users
  useEffect(() => {
    if (isOpen && userRole === "client" && currentUserId) {
      setSelectedClientId(currentUserId);
    }
  }, [isOpen, userRole, currentUserId]);

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
    if (selectedDepartmentId && selectedDate && departments && departments.length > 0) {
      const selectedDept = departments.find(
        (d) => d._id === selectedDepartmentId
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
      today.setHours(0, 0, 0, 0);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        throw new Error("Cannot book appointments in the past");
      }

      // Find department data
      const department = departments?.find(
        (d) => d._id === selectedDepartmentId
      );
      if (!department) {
        throw new Error("Department not found");
      }

      // Create appointment via Convex mutation
      await createAppointment({
        client_id: selectedClientId as Id<"clients">,
        department_id: selectedDepartmentId as Id<"departments">,
        appointment_date: selectedDate.toISOString().split("T")[0],
        slot_number: selectedSlot,
        status: "booked",
        notes: notes || undefined,
      });

      // Show success toast
      const selectedClient = filteredClients.find((c) => c._id === selectedClientId);
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
  const availableDepartments = departments?.filter((department) => {
    if (!selectedDate) return false;
    return isWorkingDay(department as any, selectedDate);
  }) || [];

  // Prepare client options for combobox
  const clientOptions = filteredClients.map((client) => ({
    value: client._id,
    label: `${client.x_number} - ${client.name}`,
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
                    <SelectItem key={department._id} value={department._id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: department.color || "#3B82F6" }}
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
