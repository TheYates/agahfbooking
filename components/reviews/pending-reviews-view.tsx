"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  Filter,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDatabaseTimeForDisplay } from "@/lib/slot-time-utils";
import { motion, AnimatePresence } from "framer-motion";
import { RescheduleReasonSelector } from "@/components/reschedule-reason-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  // Single Action State
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PendingAppointment | null>(null);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Batch Action State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchConfirmDialogOpen, setBatchConfirmDialogOpen] = useState(false);
  const [batchRejectDialogOpen, setBatchRejectDialogOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

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
    refetchInterval: 30000,
  });

  // Fetch departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  // Derived state
  const allSelected = useMemo(() =>
    appointments.length > 0 && selectedIds.size === appointments.length,
    [selectedIds, appointments.length]
  );

  const isIndeterminate = useMemo(() =>
    selectedIds.size > 0 && selectedIds.size < appointments.length,
    [selectedIds.size, appointments.length]
  );

  // Handlers for Selection
  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(appointments.map(a => a.id)));
    }
  };

  // Confirm Mutation
  const confirmMutation = useMutation({
    mutationFn: async ({ appointmentId, notes }: { appointmentId: number; notes?: string }) => {
      const response = await fetch("/api/appointments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, notes }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  // Reject/Reschedule Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ appointmentId, reason }: { appointmentId: number; reason: string }) => {
      const response = await fetch("/api/appointments/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, reason }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  // Single Action Handlers
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

  const handleConfirmSubmit = async () => {
    if (!selectedAppointment) return;
    try {
      await confirmMutation.mutateAsync({
        appointmentId: selectedAppointment.id,
        notes: confirmNotes.trim() || undefined,
      });
      toast.success("Appointment confirmed successfully!");
      setConfirmDialogOpen(false);
      setSelectedAppointment(null);
    } catch (e) {
      toast.error("Failed to confirm appointment");
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedAppointment || !rejectReason.trim()) {
      toast.error("Please provide a reason to reschedule");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        appointmentId: selectedAppointment.id,
        reason: rejectReason.trim(),
      });
      toast.success("Reschedule request sent!");
      setRejectDialogOpen(false);
      setSelectedAppointment(null);
    } catch (e) {
      toast.error("Failed to send reschedule request");
    }
  };

  // Batch Action Handlers
  const handleBatchConfirmSubmit = async () => {
    setIsBatchProcessing(true);
    let successCount = 0;
    const ids = Array.from(selectedIds);

    try {
      await Promise.all(ids.map(id =>
        confirmMutation.mutateAsync({
          appointmentId: id,
          notes: confirmNotes.trim() || undefined
        })
      ));
      successCount = ids.length;
      toast.success(`${successCount} appointments confirmed successfully!`);
    } catch (error) {
      console.error(error);
      toast.error("Some appointments failed to confirm");
    } finally {
      setIsBatchProcessing(false);
      setBatchConfirmDialogOpen(false);
      setConfirmNotes("");
      setSelectedIds(new Set());
    }
  };

  const handleBatchRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setIsBatchProcessing(true);
    const ids = Array.from(selectedIds);

    try {
      await Promise.all(ids.map(id =>
        rejectMutation.mutateAsync({
          appointmentId: id,
          reason: rejectReason.trim()
        })
      ));
      toast.success(`${ids.length} reschedule requests sent!`);
    } catch (error) {
      console.error(error);
      toast.error("Some requests failed to send");
    } finally {
      setIsBatchProcessing(false);
      setBatchRejectDialogOpen(false);
      setRejectReason("");
      setSelectedIds(new Set());
    }
  };

  const formatSlotTime = (appointment: PendingAppointment) => {
    if (appointment.slot_start_time && appointment.slot_end_time) {
      const start = formatDatabaseTimeForDisplay(appointment.slot_start_time);
      const end = formatDatabaseTimeForDisplay(appointment.slot_end_time);
      return `${start} - ${end}`;
    }
    if (appointment.slot_start_time && appointment.slot_end_time) {
      return `${formatDatabaseTimeForDisplay(appointment.slot_start_time)} - ${formatDatabaseTimeForDisplay(appointment.slot_end_time)}`;
    }
    return `Slot ${appointment.slot_number}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-xl border border-dashed">
        <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Reviews</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {error instanceof Error ? error.message : "Failed to load pending reviews"}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-24">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Pending Reviews</h2>
            <p className="text-sm text-muted-foreground">{appointments.length} appointments waiting</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 bg-background border-input/60 shadow-sm">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
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

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="h-10 w-10 shrink-0"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Table Content */}
      <AnimatePresence mode="wait">
        {appointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/5 p-8"
          >
            <div className="h-24 w-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
              There are no appointments pending review at the moment.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border shadow-sm bg-card overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[40px] px-4">
                    <Checkbox
                      checked={allSelected || isIndeterminate}
                      onCheckedChange={toggleAll}
                      className={cn("data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary border-muted-foreground/30")}
                    />
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="w-[30%]">Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => {
                  const isSelected = selectedIds.has(appointment.id);
                  return (
                    <TableRow
                      key={appointment.id}
                      className={cn(
                        "transition-colors hover:bg-muted/30 cursor-pointer",
                        isSelected && "bg-muted/20"
                      )}
                      onClick={() => toggleSelection(appointment.id)}
                    >
                      <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(appointment.id)}
                          className={cn("border-muted-foreground/30", isSelected && "data-[state=checked]:bg-primary")}
                        />
                      </TableCell>
<TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-base">
                            {appointment.clients?.name || appointment.clients?.x_number || `Client #${appointment.client_id || 'Unknown'}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {appointment.clients?.phone || ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-sm font-medium">
                            {format(new Date(appointment.appointment_date), "MMM d, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatSlotTime(appointment)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: `${appointment.departments?.color}15`,
                            color: appointment.departments?.color,
                            borderColor: `${appointment.departments?.color}30`
                          }}
                        >
                          {appointment.departments?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground" title={appointment.notes || ""}>
                          {appointment.notes || <span className="text-muted-foreground/30 italic">No notes</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRejectClick(appointment)}
                          >
                            <span className="sr-only">Reject</span>
                            <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleConfirmClick(appointment)}
                          >
                            <span className="sr-only">Confirm</span>
                            <CheckCircle className="h-4 w-4 text-primary transition-colors" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleConfirmClick(appointment)}>
                                Confirm Appointment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRejectClick(appointment)} className="text-destructive focus:text-destructive">
                                Reschedule Appointment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Batch Action Bar */}
      <AnimatePresence>
        {/* Mobile-only bulk action bar - hidden on desktop */}
        <div className="md:hidden">
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl"
            >
              <div className="bg-foreground text-background rounded-full px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between gap-6 border border-white/10 ring-1 ring-black/5">
                <div className="flex items-center gap-3 font-medium cursor-default">
                  <div className="bg-background/20 text-background px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {selectedIds.size}
                  </div>
                  <span className="text-sm sm:text-base">Selected</span>
                  <Button
                    variant="link"
                    className="text-background/70 hover:text-background h-auto p-0 text-xs sm:text-sm ml-2"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-background hover:bg-background/20 hover:text-white h-9 rounded-full px-4"
                    onClick={() => {
                      setRejectReason("");
                      setBatchRejectDialogOpen(true);
                    }}
                  >
                    Reschedule
                  </Button>
                  <Button
                    size="sm"
                    className="bg-background text-foreground hover:bg-background/90 h-9 rounded-full px-5 font-semibold shadow-sm"
                    onClick={() => {
                      setConfirmNotes("");
                      setBatchConfirmDialogOpen(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm ({selectedIds.size})
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>

      {/* --- DIALOGS --- */}

      {/* Single Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              For {selectedAppointment?.clients?.name} on {selectedAppointment && format(new Date(selectedAppointment.appointment_date), "MMM d")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Internal Notes (Optional)</Label>
              <Textarea
                placeholder="Added to reviewer notes..."
                value={confirmNotes}
                onChange={e => setConfirmNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmSubmit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
            <DialogDescription>
              This will notify {selectedAppointment?.clients?.name} to pick a new time.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <RescheduleReasonSelector
              value={rejectReason}
              onChange={setRejectReason}
              placeholder="Why is a reschedule needed?"
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectSubmit}>Send Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BATCH Confirm Dialog */}
      <Dialog open={batchConfirmDialogOpen} onOpenChange={setBatchConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {selectedIds.size} Appointments</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm all selected appointments?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Bulk Notes (Applied to all)</Label>
              <Textarea
                placeholder="Optional notes for all..."
                value={confirmNotes}
                onChange={e => setConfirmNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBatchConfirmSubmit} disabled={isBatchProcessing}>
              {isBatchProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BATCH Reject Dialog */}
      <Dialog open={batchRejectDialogOpen} onOpenChange={setBatchRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule {selectedIds.size} Appointments</DialogTitle>
            <DialogDescription>
              Request all selected clients to reschedule. They will receive a notification with the reason below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <RescheduleReasonSelector
              value={rejectReason}
              onChange={setRejectReason}
              placeholder="Reason for bulk reschedule request..."
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBatchRejectSubmit} disabled={isBatchProcessing || !rejectReason.trim()}>
              {isBatchProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Requests
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
