"use client";

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
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit } from "lucide-react";

interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  clientXNumber: string;
  doctorId: number;
  doctorName: string;
  departmentId: number;
  departmentName: string;
  date: string;
  slotNumber: number;
  status: string;
  statusColor: string;
  notes?: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  userRole: "client" | "receptionist" | "admin";
  currentUserId?: number;
  onAppointmentUpdate: (appointment: Appointment) => void;
  onAppointmentDelete: (appointmentId: number) => void;
}

const statusOptions = [
  { value: "booked", label: "Booked", color: "#3B82F6" },
  { value: "confirmed", label: "Confirmed", color: "#8B5CF6" },
  { value: "arrived", label: "Arrived", color: "#10B981" },
  { value: "waiting", label: "Waiting", color: "#F59E0B" },
  { value: "in_progress", label: "In Progress", color: "#06B6D4" },
  { value: "completed", label: "Completed", color: "#059669" },
  { value: "no_show", label: "No Show", color: "#EF4444" },
  { value: "cancelled", label: "Cancelled", color: "#6B7280" },
];

export function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  userRole,
  currentUserId,
  onAppointmentUpdate,
  onAppointmentDelete,
}: AppointmentModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status);
      setNotes(appointment.notes || "");
      setIsEditing(false);
      setError("");
    }
  }, [appointment]);

  if (!appointment) return null;

  // Check if appointment is in the past
  const isPastAppointment = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate < today;
  };

  const canEdit =
    !isPastAppointment() &&
    (userRole === "receptionist" ||
      userRole === "admin" ||
      appointment.clientId === currentUserId);
  const canDelete =
    !isPastAppointment() &&
    (userRole === "receptionist" || userRole === "admin");

  const handleSave = async () => {
    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const statusOption = statusOptions.find((s) => s.value === status);
      const updatedAppointment = {
        ...appointment,
        status,
        statusColor: statusOption?.color || appointment.statusColor,
        notes,
      };

      onAppointmentUpdate(updatedAppointment);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onAppointmentDelete(appointment.id);
      onClose();
    } catch (err) {
      setError("Failed to delete appointment");
    } finally {
      setLoading(false);
    }
  };

  const appointmentDate = new Date(appointment.date).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Appointment Details</span>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={loading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {appointmentDate} - Slot {appointment.slotNumber}
          </DialogDescription>
        </DialogHeader>

        {isPastAppointment() && (
          <Alert className="mb-4">
            <AlertDescription>
              This appointment is in the past and cannot be modified.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Patient</Label>
              <div className="text-sm">
                <div className="font-medium">{appointment.clientName}</div>
                <div className="text-muted-foreground">
                  {appointment.clientXNumber}
                </div>
              </div>
            </div>
            <div>
              <Label>Doctor</Label>
              <div className="text-sm font-medium">
                {appointment.doctorName}
              </div>
            </div>
          </div>

          <div>
            <Label>Department</Label>
            <div className="text-sm font-medium">
              {appointment.departmentName}
            </div>
          </div>

          <div>
            <Label>Status</Label>
            {isEditing ? (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div>
                <Badge
                  style={{
                    backgroundColor: appointment.statusColor,
                    color: "white",
                  }}
                >
                  {appointment.status}
                </Badge>
              </div>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            {isEditing ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this appointment..."
                rows={3}
              />
            ) : (
              <div className="text-sm text-muted-foreground min-h-[60px] p-2 border rounded">
                {appointment.notes || "No notes"}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {isEditing ? "Cancel" : "Close"}
          </Button>
          {isEditing && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
