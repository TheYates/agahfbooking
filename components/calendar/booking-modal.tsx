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

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  departmentId?: number;
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
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch data from API
  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      if (userRole === "receptionist" || userRole === "admin") {
        fetchClients();
      } else if (userRole === "client" && currentUserId) {
        setSelectedClientId(currentUserId.toString());
      }
    }
  }, [isOpen, userRole, currentUserId]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors");
      const data = await response.json();
      if (data.success) {
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
      setSelectedDoctorId("");
      if (userRole !== "client") {
        setSelectedClientId("");
      }
      setNotes("");
      setError("");
    }
  }, [isOpen, userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!selectedDoctorId) {
        throw new Error("Please select a doctor");
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

      // Find doctor data to get department_id
      const doctor = doctors.find(
        (d) => d.id === Number.parseInt(selectedDoctorId)
      );
      if (!doctor) {
        throw new Error("Doctor not found");
      }

      // Check if the selected date is a working day for the department
      if (doctor.departmentId) {
        const departmentResponse = await fetch(
          `/api/departments/${doctor.departmentId}`
        );
        if (departmentResponse.ok) {
          const departmentData = await departmentResponse.json();
          if (departmentData.success && departmentData.data) {
            const department = departmentData.data;
            if (!isWorkingDay(department, selectedDate)) {
              throw new Error(
                "Selected date is not a working day for this department"
              );
            }
          }
        }
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
          department_id: doctor.departmentId || 1, // Use doctor's department or default to 1
          doctor_id: Number.parseInt(selectedDoctorId),
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
      const selectedDoctor = doctors.find(
        (d) => d.id === Number.parseInt(selectedDoctorId)
      );
      const formattedDate = selectedDate.toLocaleDateString();

      toast.success("Appointment Booked Successfully! 🎉", {
        description: `${selectedClient?.name || "Client"} with ${
          selectedDoctor?.name || "Doctor"
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
            <Label htmlFor="doctor">Doctor *</Label>
            <Select
              value={selectedDoctorId}
              onValueChange={setSelectedDoctorId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id.toString()}>
                    {doctor.name} - {doctor.specialization}
                  </SelectItem>
                ))}
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
