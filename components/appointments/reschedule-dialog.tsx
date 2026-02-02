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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RescheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: number;
    departmentId: number;
    departmentName: string;
    date: string;
    slotNumber: number;
  } | null;
  onSuccess?: () => void;
}

interface AvailableSlot {
  slotNumber: number;
  time: string;
  startTime: string | null;
  endTime: string | null;
}

export function RescheduleDialog({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  const queryClient = useQueryClient();

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen && appointment) {
      setSelectedDate(undefined);
      setAvailableSlots([]);
      setSelectedSlot("");
      setReason("");
    }
  }, [isOpen, appointment]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate || !appointment) return;

    const fetchAvailableSlots = async () => {
      setIsFetchingSlots(true);
      setAvailableSlots([]);
      setSelectedSlot("");

      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const response = await fetch(
          `/api/appointments/available-slots?departmentId=${appointment.departmentId}&date=${dateStr}`
        );
        const data = await response.json();

        if (data.success && data.data?.available_slots) {
          setAvailableSlots(data.data.available_slots);
        } else {
          setAvailableSlots([]);
        }
      } catch (error) {
        console.error("Error fetching available slots:", error);
        toast.error("Failed to fetch available time slots");
        setAvailableSlots([]);
      } finally {
        setIsFetchingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, appointment]);

  const handleReschedule = async () => {
    if (!appointment || !selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/appointments/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          newDate: format(selectedDate, "yyyy-MM-dd"),
          newSlotNumber: parseInt(selectedSlot, 10),
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Appointment rescheduled successfully!");

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
        queryClient.invalidateQueries({ queryKey: ["calendar"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });

        onSuccess?.();
        onClose();
      } else {
        toast.error(data.error || "Failed to reschedule appointment");
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast.error("Failed to reschedule appointment");
    } finally {
      setIsLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Reschedule Appointment
          </DialogTitle>
          <DialogDescription>
            Select a new date and time for your {appointment.departmentName} appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Appointment Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">Current appointment:</p>
            <p className="font-medium">
              {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")} - Slot{" "}
              {appointment.slotNumber}
            </p>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Select New Date</Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                className="rounded-md border"
              />
            </div>
          </div>

          {/* Time Slot Selector */}
          {selectedDate && (
            <div className="space-y-2">
              <Label>Select Time Slot</Label>
              {isFetchingSlots ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No available slots for this date. Please select another date.
                </p>
              ) : (
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem
                        key={slot.slotNumber}
                        value={slot.slotNumber.toString()}
                      >
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {slot.time}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Rescheduling (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Let us know why you're rescheduling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={isLoading || !selectedDate || !selectedSlot}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
