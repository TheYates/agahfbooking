"use client";

import React, { useState, useEffect } from "react";
import {
    ArrowRight,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    AlertCircle,
    ClipboardCheck,
    RefreshCw,
    Loader2,
    ChevronRight
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

interface ReviewerMobileDashboardProps {
    user: User;
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
    clients_name?: string; // Flattened for easier access if API sends it
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
    const response = await fetch("/api/appointments/review?limit=50");
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch");
    return data.data as PendingAppointment[];
}

export function ReviewerMobileDashboard({ user }: ReviewerMobileDashboardProps) {
    const queryClient = useQueryClient();

    // Action State
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<PendingAppointment | null>(null);
    const [confirmNotes, setConfirmNotes] = useState("");
    const [rejectReason, setRejectReason] = useState("");

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
            setConfirmDialogOpen(false);
            setSelectedAppointment(null);
            toast.success("Confirmed successfully");
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
            setRejectDialogOpen(false);
            setSelectedAppointment(null);
            toast.success("Reschedule request sent");
        },
    });

    // Handlers
    const openConfirm = (e: React.MouseEvent, apt: PendingAppointment) => {
        e.stopPropagation();
        setSelectedAppointment(apt);
        setConfirmNotes("");
        setConfirmDialogOpen(true);
    };

    const openReject = (e: React.MouseEvent, apt: PendingAppointment) => {
        e.stopPropagation();
        setSelectedAppointment(apt);
        setRejectReason("");
        setRejectDialogOpen(true);
    };

    // Helper for greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const formatTime = (apt: PendingAppointment) => {
        if (apt.slot_start_time && apt.slot_end_time) {
            return `${formatDatabaseTimeForDisplay(apt.slot_start_time)} - ${formatDatabaseTimeForDisplay(apt.slot_end_time)}`;
        }
        return `Slot ${apt.slot_number}`;
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-1 pt-2 space-y-1"
            >
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    {getGreeting()}
                </h1>
                <p className="text-muted-foreground text-lg">
                    Ready to review appointments?
                </p>
            </motion.div>

            {/* Stats Summary Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50 dark:border-amber-900/50 rounded-2xl p-5 flex items-center justify-between"
            >
                <div>
                    <p className="text-amber-600 dark:text-amber-400 font-medium mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Pending
                    </p>
                    <h2 className="text-3xl font-bold text-foreground">
                        {isLoading ? "..." : appointments.length}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Waiting for approval
                    </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <ClipboardCheck className="w-6 h-6" />
                </div>
            </motion.div>

            {/* Actions & Filter (Simple for now) */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xl font-semibold">Priority List</h3>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                >
                    <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
                </Button>
            </div>

            {/* Appointments List */}
            {isLoading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-muted/40 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/20 rounded-3xl border border-dashed border-muted">
                    <CheckCircle className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium text-lg">All Caught Up!</p>
                    <p className="text-sm opacity-70">No pending reviews found.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {appointments.map((apt, idx) => (
                        <motion.div
                            key={apt.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative bg-card border rounded-2xl overflow-hidden shadow-sm active:scale-[0.99] transition-transform duration-200"
                            onClick={() => setSelectedAppointment(apt)} // Optional: open details view if needed later
                        >
                            {/* Color Strip */}
                            <div
                                className="absolute left-0 top-0 bottom-0 w-1.5"
                                style={{ backgroundColor: apt.departments?.color || '#ccc' }}
                            />

                            <div className="p-4 pl-5">
                                {/* Top Row: Dept & Time */}
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
                                    <span className="text-xs font-medium text-muted-foreground flex items-center">
                                        {format(new Date(apt.appointment_date), "MMM d")}
                                    </span>
                                </div>

                                {/* Main Content */}
                                <div>
                                    <h4 className="text-lg font-bold text-foreground leading-tight mb-1">
                                        {apt.clients?.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatTime(apt)}
                                    </p>

                                    {apt.notes && (
                                        <div className="bg-muted/30 p-2 rounded-lg text-xs italic text-muted-foreground mb-3 line-clamp-2">
                                            "{apt.notes}"
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3 mt-2">
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
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Mobile Dialogs - Optimized for small screens */}

            {/* Confirm Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="w-[90vw] rounded-2xl p-4 sm:p-6 gap-3 top-[30%] sm:top-[50%]">
                    <DialogHeader className="text-left space-y-2">
                        <DialogTitle>Confirm Appointment</DialogTitle>
                        <DialogDescription>
                            For <strong>{selectedAppointment?.clients?.name}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <Label className="mb-2 block">Notes (Optional)</Label>
                        <Textarea
                            value={confirmNotes}
                            onChange={e => setConfirmNotes(e.target.value)}
                            placeholder="Add internal notes..."
                            className="text-base"
                        />
                    </div>

                    <DialogFooter className="flex-row gap-2 sm:justify-end">
                        <Button className="flex-1 sm:flex-none" variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                        <Button className="flex-1 sm:flex-none" onClick={() => { if (selectedAppointment) confirmMutation.mutate({ appointmentId: selectedAppointment.id, notes: confirmNotes }) }}>
                            {confirmMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject/Reschedule Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="w-[90vw] rounded-2xl p-4 sm:p-6 gap-3 top-[30%] sm:top-[50%]">
                    <DialogHeader className="text-left space-y-2">
                        <DialogTitle className="text-destructive">Request Reschedule</DialogTitle>
                        <DialogDescription>
                            Notify <strong>{selectedAppointment?.clients?.name}</strong> to pick a new time.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <Label className="mb-2 block">Reason <span className="text-destructive">*</span></Label>
                        <Textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reason is required..."
                            className="text-base min-h-[100px]"
                        />
                    </div>

                    <DialogFooter className="flex-row gap-2 sm:justify-end">
                        <Button className="flex-1 sm:flex-none" variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="flex-1 sm:flex-none"
                            variant="destructive"
                            disabled={!rejectReason.trim()}
                            onClick={() => { if (selectedAppointment) rejectMutation.mutate({ appointmentId: selectedAppointment.id, reason: rejectReason }) }}
                        >
                            {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Send Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
