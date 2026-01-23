"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

interface MobileBookingSheetConvexProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId?: number;
  currentUserId?: number;
}

export function MobileBookingSheetConvex({
  isOpen,
  onClose,
  departmentId,
  currentUserId,
}: MobileBookingSheetConvexProps) {
  const [step, setStep] = useState<"department" | "date" | "slot">("department");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<Id<"departments"> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Convex queries
  const departments = useQuery(api.queries.getDepartments, { isActive: true });
  const allClients = useQuery(api.queries.getClients, {});
  const appointments = useQuery(
    api.queries.getAppointments,
    selectedDepartmentId && selectedDate ? {} : "skip"
  );

  // Convex mutations
  const createAppointment = useMutation(api.mutations.createAppointment);

  const loading = departments === undefined || allClients === undefined;

  // Get current client ID (simplified - in real app would use proper mapping)
  const currentClient = allClients?.[0];

  // Get selected department
  const selectedDepartment = departments?.find((d) => d._id === selectedDepartmentId);

  // Get available slots
  const getAvailableSlots = () => {
    if (!selectedDepartment || !selectedDate || !appointments) return [];

    const dateStr = selectedDate.toISOString().split("T")[0];
    const bookedSlots = appointments
      .filter(
        (apt) =>
          apt.department_id === selectedDepartmentId &&
          apt.appointment_date === dateStr &&
          apt.status !== "cancelled"
      )
      .map((apt) => apt.slot_number);

    const totalSlots = selectedDepartment.slots_per_day;
    const availableSlots = [];

    for (let i = 1; i <= totalSlots; i++) {
      if (!bookedSlots.includes(i)) {
        availableSlots.push(i);
      }
    }

    return availableSlots;
  };

  const handleBooking = async () => {
    if (!selectedDepartmentId || !currentClient || !selectedDate || !selectedSlot) {
      toast.error("Please complete all steps");
      return;
    }

    try {
      const dateStr = selectedDate.toISOString().split("T")[0];

      await createAppointment({
        client_id: currentClient._id,
        department_id: selectedDepartmentId,
        appointment_date: dateStr,
        slot_number: selectedSlot,
        status: "booked",
      });

      toast.success("Appointment booked successfully!");
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to book appointment");
    }
  };

  const resetForm = () => {
    setStep("department");
    setSelectedDepartmentId(null);
    setSelectedDate(undefined);
    setSelectedSlot(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle>Quick Booking</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(90vh-80px)] mt-4">
            <div className="space-y-6 pb-6">
              {/* Step: Select Department */}
              {step === "department" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Select Department</h3>
                  <div className="space-y-2">
                    {departments?.map((dept) => (
                      <button
                        key={dept._id}
                        onClick={() => {
                          setSelectedDepartmentId(dept._id);
                          setStep("date");
                        }}
                        className="w-full p-4 rounded-lg border hover:bg-accent transition-colors text-left"
                      >
                        <div className="font-medium">{dept.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {dept.slots_per_day} slots per day
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step: Select Date */}
              {step === "date" && (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => setStep("department")}
                    className="mb-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <h3 className="font-semibold text-lg">Select Date</h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) setStep("slot");
                    }}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border w-full"
                  />
                </div>
              )}

              {/* Step: Select Time Slot */}
              {step === "slot" && (
                <div className="space-y-4">
                  <Button variant="ghost" onClick={() => setStep("date")} className="mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <h3 className="font-semibold text-lg">Select Time Slot</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {getAvailableSlots().map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedSlot === slot ? "default" : "outline"}
                        onClick={() => setSelectedSlot(slot)}
                        className="h-16"
                      >
                        Slot {slot}
                      </Button>
                    ))}
                  </div>
                  {getAvailableSlots().length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No available slots for this date
                    </p>
                  )}
                  <Button
                    onClick={handleBooking}
                    disabled={!selectedSlot}
                    className="w-full"
                    size="lg"
                  >
                    Confirm Booking
                  </Button>
                </div>
              )}

              {/* Summary */}
              {(step === "date" || step === "slot") && (
                <div className="border-t pt-4 space-y-2 text-sm">
                  <h4 className="font-semibold">Summary:</h4>
                  {selectedDepartment && (
                    <p>
                      <strong>Department:</strong> {selectedDepartment.name}
                    </p>
                  )}
                  {selectedDate && (
                    <p>
                      <strong>Date:</strong> {selectedDate.toLocaleDateString()}
                    </p>
                  )}
                  {selectedSlot && (
                    <p>
                      <strong>Slot:</strong> {selectedSlot}
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
