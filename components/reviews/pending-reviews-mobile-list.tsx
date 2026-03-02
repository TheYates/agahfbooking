"use client";

import React, { useState } from "react";
import {
    Clock,
    CheckCircle,
    CheckSquare,
    Square,
    RefreshCw,
    Loader2,
    X,
    Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatDatabaseTimeForDisplay } from "@/lib/slot-time-utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RescheduleReasonSelector } from "@/components/reschedule-reason-selector";

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
    clients_name?: string;
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

async function fetchPendingReviews() {
    const response = await fetch("/api/appointments/review?limit=100");
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch");
    return data.data as PendingAppointment[];
}

interface PendingReviewsMobileListProps {
    user: User;
    className?: string;
    showHeader?: boolean;
}

export function PendingReviewsMobileList({ user, className, showHeader = true }: PendingReviewsMobileListProps) {
    const queryClient = useQueryClient();

    // Action State
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<PendingAppointment | null>(null);
    const [confirmNotes, setConfirmNotes] = useState("");
    const [rejectReason, setRejectReason] = useState("");

    // Batch Action State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [batchConfirmDialogOpen, setBatchConfirmDialogOpen] = useState(false);
    const [batchRejectDialogOpen, setBatchRejectDialogOpen] = useState(false);

    const {
        data: appointments = [],
        isLoading,
        error,
        refetch,
        isRefetching
    } = useQuery({
        queryKey: ["reviews", "pending", "mobile"],
        queryFn: fetchPendingReviews,
        refetchInterval: 30000,
    });

    // Mutations
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
            // If we were selecting a specific one, clear it
            if (selectedAppointment) {
                setConfirmDialogOpen(false);
                setSelectedAppointment(null);
                toast.success("Confirmed successfully");
            }
        },
    });

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
            if (selectedAppointment) {
                setRejectDialogOpen(false);
                setSelectedAppointment(null);
                toast.success("Reschedule request sent");
            }
        },
    });

    // Handlers
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set());
    };

    const toggleSelection = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const openConfirm = (e: React.MouseEvent, apt: PendingAppointment) => {
        e.stopPropagation();
        if (isSelectionMode) {
            toggleSelection(apt.id);
            return;
        }
        setSelectedAppointment(apt);
        setConfirmNotes("");
        setConfirmDialogOpen(true);
    };

    const openReject = (e: React.MouseEvent, apt: PendingAppointment) => {
        e.stopPropagation();
        if (isSelectionMode) {
            toggleSelection(apt.id);
            return;
        }
        setSelectedAppointment(apt);
        setRejectReason("");
        setRejectDialogOpen(true);
    };

    const handleBatchConfirm = async () => {
        setBatchConfirmDialogOpen(false);
        const ids = Array.from(selectedIds);
        let successCount = 0;

        // Simple serial execution for now, could act in parallel
        // For better UX, we might want a bulk API endpoint, but looping existing one works 
        toast.promise(
            Promise.all(ids.map(id =>
                confirmMutation.mutateAsync({ appointmentId: id, notes: confirmNotes })
            )),
            {
                loading: 'Confirming appointments...',
                success: (data) => {
                    toggleSelectionMode(); // Exit selection mode
                    return `${ids.length} appointments confirmed!`;
                },
                error: 'Failed to confirm some appointments'
            }
        );
    };

    const handleBatchReject = async () => {
        if (!rejectReason.trim()) return;
        setBatchRejectDialogOpen(false);
        const ids = Array.from(selectedIds);

        toast.promise(
            Promise.all(ids.map(id =>
                rejectMutation.mutateAsync({ appointmentId: id, reason: rejectReason })
            )),
            {
                loading: 'Sending reschedule requests...',
                success: (data) => {
                    toggleSelectionMode(); // Exit selection mode
                    return `${ids.length} requests sent!`;
                },
                error: 'Failed to send some requests'
            }
        );
    };

    const formatTime = (apt: PendingAppointment) => {
        if (apt.slot_start_time && apt.slot_end_time) {
            return `${formatDatabaseTimeForDisplay(apt.slot_start_time)} - ${formatDatabaseTimeForDisplay(apt.slot_end_time)}`;
        }
        return `Slot ${apt.slot_number}`;
    };

    return (
        <div className={cn("space-y-4 pb-24", className)}> {/* Extra padding for FAB */}
            {/* Header / Actions */}
            {showHeader && (
                <div className="flex items-center justify-between px-1 pt-2 sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                    <h3 className="text-xl font-semibold">
                        {isSelectionMode ? `${selectedIds.size} Selected` : "Pending Reviews"}
                    </h3>
                    <div className="flex gap-2">
                        {appointments.length > 0 && (
                            <Button
                                variant={isSelectionMode ? "secondary" : "ghost"}
                                size="sm"
                                onClick={toggleSelectionMode}
                                className={cn(isSelectionMode && "bg-primary/10 text-primary")}
                            >
                                {isSelectionMode ? "Cancel" : "Select"}
                            </Button>
                        )}
                        {!isSelectionMode && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-full"
                                onClick={() => refetch()}
                                disabled={isRefetching}
                            >
                                <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Appointments List */}
            {isLoading ? (
                <div className="flex flex-col gap-4 px-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-muted/40 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/20 rounded-3xl border border-dashed border-muted m-1">
                    <CheckCircle className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium text-lg">All Caught Up!</p>
                    <p className="text-sm opacity-70">No pending reviews found.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4 px-1">
                    {appointments.map((apt, idx) => {
                        const isSelected = selectedIds.has(apt.id);
                        return (
                            <motion.div
                                key={apt.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={cn(
                                    "group relative bg-card border rounded-2xl overflow-hidden shadow-sm transition-all duration-200",
                                    isSelectionMode && "cursor-pointer active:scale-[0.98]",
                                    isSelected && "ring-2 ring-primary border-primary bg-primary/5"
                                )}
                                onClick={() => isSelectionMode ? toggleSelection(apt.id) : null}
                            >
                                {/* Color Strip (hidden if selected for cleaner look? or keep it) */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-1.5"
                                    style={{ backgroundColor: apt.departments?.color || '#ccc' }}
                                />

                                <div className="p-4 pl-5">
                                    {/* Top Row: Dept & Time & Checkbox */}
                                    <div className="flex justify-between items-start mb-2">
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: `${apt.departments?.color}15`,
                                                color: apt.departments?.color
                                            }}
                                        >
                                            {apt.departments?.name}
                                        </span>

                                        {isSelectionMode ? (
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                            </div>
                                        ) : (
                                            <span className="text-xs font-medium text-muted-foreground flex items-center">
                                                {format(new Date(apt.appointment_date), "MMM d")}
                                            </span>
                                        )}
                                    </div>

{/* Main Content */}
                                    <div>
                                        <div className="flex items-baseline justify-between gap-2 mb-1">
                                            <h4 className="text-base font-bold text-foreground leading-tight truncate">
                                                {apt.clients?.name}
                                            </h4>
                                            <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(apt)}
                                            </span>
                                        </div>

                                        {apt.notes && (
                                            <div className="bg-muted/30 p-2 rounded-lg text-xs italic text-muted-foreground mb-3 line-clamp-2">
                                                "{apt.notes}"
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons (Only show if NOT in selection mode) */}
                                    <AnimatePresence>
                                        {!isSelectionMode && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="grid grid-cols-2 gap-3 mt-2"
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="w-full text-xs font-semibold h-9 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                                                    onClick={(e) => openReject(e, apt)}
                                                >
                                                    Reschedule
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="w-full text-xs font-semibold h-9 shadow-sm"
                                                    onClick={(e) => openConfirm(e, apt)}
                                                >
                                                    Confirm
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Batch Action Floating Bar */}
            <AnimatePresence>
                {isSelectionMode && selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-28 left-4 right-4 z-40" // Above bottom nav
                    >
                        <div className="bg-foreground text-background rounded-full shadow-lg p-1.5 flex items-center justify-between pl-4 pr-1.5">
                            <span className="font-semibold text-xs ml-1">{selectedIds.size} selected</span>
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs text-background hover:bg-background/20 hover:text-background rounded-full px-3"
                                    onClick={() => { setRejectReason(""); setBatchRejectDialogOpen(true); }}
                                >
                                    Reschedule
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-8 text-xs rounded-full px-4 bg-background text-foreground hover:bg-background/90"
                                    onClick={() => { setConfirmNotes(""); setBatchConfirmDialogOpen(true); }}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Dialogs */}

            {/* Single Confirm Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="w-[90vw] rounded-2xl top-[40%]">
                    <DialogHeader>
                        <DialogTitle>Confirm Appointment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to confirm this appointment?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label className="mb-2 block">Notes (Optional)</Label>
                        <Textarea
                            value={confirmNotes}
                            onChange={(e) => setConfirmNotes(e.target.value)}
                            placeholder="Add notes..."
                        />
                    </div>
                    <DialogFooter className="flex-row gap-2">
                        <Button className="flex-1" variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                        <Button className="flex-1" onClick={() => { if (selectedAppointment) confirmMutation.mutate({ appointmentId: selectedAppointment.id, notes: confirmNotes }) }}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Single Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="w-[90vw] rounded-2xl top-[40%]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Request Reschedule</DialogTitle>
                        <DialogDescription>Send a request to reschedule?</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <RescheduleReasonSelector
                            value={rejectReason}
                            onChange={setRejectReason}
                            placeholder="Reason..."
                            required
                        />
                    </div>
                    <DialogFooter className="flex-row gap-2">
                        <Button className="flex-1" variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button className="flex-1" variant="destructive" onClick={() => { if (selectedAppointment) rejectMutation.mutate({ appointmentId: selectedAppointment.id, reason: rejectReason }) }} disabled={!rejectReason.trim()}>Send</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Batch Confirm Dialog */}
            <Dialog open={batchConfirmDialogOpen} onOpenChange={setBatchConfirmDialogOpen}>
                <DialogContent className="w-[90vw] rounded-2xl top-[40%]">
                    <DialogHeader>
                        <DialogTitle>Confirm {selectedIds.size} Appointments</DialogTitle>
                        <DialogDescription>
                            This will confirm all selected appointments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label className="mb-2 block">Notes to apply to all (Optional)</Label>
                        <Textarea
                            value={confirmNotes}
                            onChange={(e) => setConfirmNotes(e.target.value)}
                            placeholder="Add notes..."
                        />
                    </div>
                    <DialogFooter className="flex-row gap-2">
                        <Button className="flex-1" variant="outline" onClick={() => setBatchConfirmDialogOpen(false)}>Cancel</Button>
                        <Button className="flex-1" onClick={handleBatchConfirm}>Confirm All</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Batch Reject Dialog */}
            <Dialog open={batchRejectDialogOpen} onOpenChange={setBatchRejectDialogOpen}>
                <DialogContent className="w-[90vw] rounded-2xl top-[40%]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Reschedule {selectedIds.size} Appointments</DialogTitle>
                        <DialogDescription>
                            Request reschedule for all selected appointments?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <RescheduleReasonSelector
                            value={rejectReason}
                            onChange={setRejectReason}
                            placeholder="Reason for all..."
                            required
                        />
                    </div>
                    <DialogFooter className="flex-row gap-2">
                        <Button className="flex-1" variant="outline" onClick={() => setBatchRejectDialogOpen(false)}>Cancel</Button>
                        <Button className="flex-1" variant="destructive" onClick={handleBatchReject} disabled={!rejectReason.trim()}>Send All</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
