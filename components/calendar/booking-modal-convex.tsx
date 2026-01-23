"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BookingModalConvexProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedSlot: number | null;
  userRole: string;
  currentUserId?: number;
}

export function BookingModalConvex({
  isOpen,
  onClose,
  selectedDate,
  selectedSlot,
  userRole,
  currentUserId,
}: BookingModalConvexProps) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<Id<"departments"> | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<Id<"clients"> | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<Id<"doctors"> | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [notes, setNotes] = useState("");

  // Convex queries
  const departments = useQuery(api.queries.getDepartments, { isActive: true });
  const allClients = useQuery(api.queries.getClients, {});
  const doctors = useQuery(
    api.queries.getDoctors,
    selectedDepartmentId ? { isActive: true } : "skip"
  );

  // Convex mutation
  const createAppointment = useMutation(api.mutations.createAppointment);

  const loading = departments === undefined || allClients === undefined;

  // Filter clients based on search
  const filteredClients = allClients?.filter((client) => {
    if (!clientSearch) return true;
    const search = clientSearch.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      client.x_number.toLowerCase().includes(search) ||
      client.phone.includes(search)
    );
  });

  // Filter doctors by selected department
  const filteredDoctors = doctors?.filter(
    (doc) => doc.department_id === selectedDepartmentId
  );

  // Auto-select client for client users
  useEffect(() => {
    if (userRole === "client" && allClients && currentUserId) {
      // In a real app, match by proper ID mapping
      const currentClient = allClients[0];
      if (currentClient) {
        setSelectedClientId(currentClient._id);
      }
    }
  }, [userRole, allClients, currentUserId]);

  const handleBooking = async () => {
    if (!selectedDepartmentId || !selectedClientId || !selectedDate || selectedSlot === null) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const dateStr = selectedDate.toISOString().split("T")[0];

      await createAppointment({
        client_id: selectedClientId,
        department_id: selectedDepartmentId,
        doctor_id: selectedDoctorId || undefined,
        appointment_date: dateStr,
        slot_number: selectedSlot,
        status: "booked",
        notes: notes || undefined,
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
    setSelectedDepartmentId(null);
    setSelectedClientId(null);
    setSelectedDoctorId(null);
    setClientSearch("");
    setNotes("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Date & Slot (read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  value={selectedDate?.toLocaleDateString() || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Slot</Label>
                <Input
                  value={selectedSlot !== null ? `Slot ${selectedSlot}` : ""}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Department Selection */}
            <div>
              <Label>Department *</Label>
              <Select
                value={selectedDepartmentId || ""}
                onValueChange={(value) => {
                  setSelectedDepartmentId(value as Id<"departments">);
                  setSelectedDoctorId(null); // Reset doctor when department changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctor Selection (optional) */}
            {selectedDepartmentId && filteredDoctors && filteredDoctors.length > 0 && (
              <div>
                <Label>Doctor (Optional)</Label>
                <Select
                  value={selectedDoctorId || ""}
                  onValueChange={(value) => setSelectedDoctorId(value as Id<"doctors">)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No preference</SelectItem>
                    {filteredDoctors.map((doc) => (
                      <SelectItem key={doc._id} value={doc._id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Client Selection (staff only) */}
            {userRole !== "client" && (
              <div>
                <Label>Client *</Label>
                <Input
                  placeholder="Search by name, X-number, or phone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-lg p-2">
                  {filteredClients?.slice(0, 10).map((client) => (
                    <button
                      key={client._id}
                      onClick={() => setSelectedClientId(client._id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedClientId === client._id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm opacity-80">
                        {client.x_number} • {client.phone}
                      </div>
                    </button>
                  ))}
                  {filteredClients?.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No clients found
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleBooking}
                disabled={!selectedDepartmentId || !selectedClientId}
                className="flex-1"
              >
                Book Appointment
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
