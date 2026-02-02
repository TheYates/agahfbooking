"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  Building,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDatabaseTimeForDisplay } from "@/lib/slot-time-utils";

interface PendingReviewsViewProps {
  userId: number;
  userRole: string;
}

interface PendingAppointment {
  id: number;
  client_id: number;
  department_id: number;
  appointment_date: string;
  slot_number: number;
  slot_start_time: string | null;
  slot_end_time: string | null;
  notes: string | null;
  created_at: string;
  clients: {
    id: number;
    name: string;
    phone: string;
    x_number: string;
    category: string;
  };
  departments: {
    id: number;
    name: string;
    color: string;
    working_hours: { start: string; end: string };
    slot_duration_minutes: number;
  };
}

async function fetchPendingReviews(departmentId?: string) {
  const params = new URLSearchParams();
  if (departmentId && departmentId !== "all") {
    params.set("departmentId", departmentId);
  }
  params.set("limit", "100");

  const response = await fetch(`/api/appointments/review?${params.toString()}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch pending reviews");
  }

  return data.data as PendingAppointment[];
}

async function fetchDepartments() {
  const response = await fetch("/api/departments");
  const data = await response.json();
  return data.data || [];
}

export function PendingReviewsView({ userId, userRole }: PendingReviewsViewProps) {
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PendingAppointment | null>(null);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const queryClient = useQueryClient();

  // Fetch pending reviews
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["reviews", "pending", departmentFilter],
    queryFn: () => fetchPendingReviews(departmentFilter),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: async ({ appointmentId, notes }: { appointmentId: number; notes?: string }) => {
      const response = await fetch("/api/appointments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, notes }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to confirm appointment");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Appointment confirmed successfully!");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setConfirmDialogOpen(false);
      setSelectedAppointment(null);
      setConfirmNotes("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to confirm appointment");
    },
  });

  // Reject (request reschedule) mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ appointmentId, reason }: { appointmentId: number; reason: string }) => {
      const response = await fetch("/api/appointments/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, reason }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to request reschedule");
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Reschedule request sent to ${data.client?.name || "client"}`);
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setRejectDialogOpen(false);
      setSelectedAppointment(null);
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send reschedule request");
    },
  });

  const handleConfirmClick = (appointment: PendingAppointment) => {
    setSelectedAppointment(appointment);
    setConfirmNotes("");
    setConfirmDialogOpen(true);
  };

  const handleRejectClick = (appointment: PendingAppointment) => {
    setSelectedAppointment(appointment);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (!selectedAppointment) return;
    confirmMutation.mutate({
      appointmentId: selectedAppointment.id,
      notes: confirmNotes.trim() || undefined,
    });
  };

  const handleRejectSubmit = () => {
    if (!selectedAppointment || !rejectReason.trim()) {
      toast.error("Please provide a reason for the reschedule request");
      return;
    }
    rejectMutation.mutate({
      appointmentId: selectedAppointment.id,
      reason: rejectReason.trim(),
    });
  };

  const formatSlotTime = (appointment: PendingAppointment) => {
    if (appointment.slot_start_time && appointment.slot_end_time) {
      const start = formatDatabaseTimeForDisplay(appointment.slot_start_time);
      const end = formatDatabaseTimeForDisplay(appointment.slot_end_time);
      return `${start} - ${end}`;
    }
    return `Slot ${appointment.slot_number}`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Reviews</h3>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Failed to load pending reviews"}
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {appointments.length} Pending
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground max-w-md">
            There are no appointments pending review. New appointments will appear here when clients book.
          </p>
        </div>
      ) : (
        /* Appointments Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {appointment.clients?.name || "Unknown Client"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {appointment.clients?.phone}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${appointment.departments?.color}20`,
                      borderColor: appointment.departments?.color,
                      color: appointment.departments?.color,
                    }}
                  >
                    {appointment.departments?.name}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(appointment.appointment_date), "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatSlotTime(appointment)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    X-Number: {appointment.clients?.x_number}
                  </span>
                </div>
                {appointment.notes && (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    {appointment.notes}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Requested {format(new Date(appointment.created_at), "MMM d 'at' h:mm a")}
                </p>
              </CardContent>

              <CardFooter className="flex gap-2 pt-3 border-t">
                <Button
                  className="flex-1"
                  onClick={() => handleConfirmClick(appointment)}
                  disabled={confirmMutation.isPending || rejectMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRejectClick(appointment)}
                  disabled={confirmMutation.isPending || rejectMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reschedule
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Confirm Appointment
            </DialogTitle>
            <DialogDescription>
              Confirm this appointment for {selectedAppointment?.clients?.name}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p>
                <strong>Department:</strong> {selectedAppointment?.departments?.name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {selectedAppointment &&
                  format(new Date(selectedAppointment.appointment_date), "EEEE, MMMM d, yyyy")}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {selectedAppointment && formatSlotTime(selectedAppointment)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNotes">Notes (Optional)</Label>
              <Textarea
                id="confirmNotes"
                placeholder="Add any notes about this confirmation..."
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={confirmMutation.isPending}>
              {confirmMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject/Reschedule Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-500" />
              Request Reschedule
            </DialogTitle>
            <DialogDescription>
              Ask {selectedAppointment?.clients?.name} to reschedule their appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p>
                <strong>Department:</strong> {selectedAppointment?.departments?.name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {selectedAppointment &&
                  format(new Date(selectedAppointment.appointment_date), "EEEE, MMMM d, yyyy")}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {selectedAppointment && formatSlotTime(selectedAppointment)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejectReason">
                Reason for Reschedule Request <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejectReason"
                placeholder="Explain why this appointment needs to be rescheduled..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                This message will be sent to the client via notification.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reschedule Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
