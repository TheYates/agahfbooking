"use client";

import { useState } from "react";
import { ChevronRight, Calendar as CalendarX } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDatabaseTimeForDisplay } from "@/lib/slot-time-utils";

interface Appointment {
    id: number;
    date: string;
    slotNumber: number;
    slotStartTime?: string;
    slotEndTime?: string;
    status: string;
    doctorName: string;
    departmentId: number;
    departmentName: string;
    departmentColor: string;
    notes?: string;
}

interface MobileAppointmentsListProps {
    appointments: Appointment[];
    isLoading: boolean;
    onCancel: (id: number) => void;
    onReschedule?: (id: number) => void;
}

// Sub-component for individual row state
function AppointmentRow({
    apt,
    onCancel,
    onReschedule,
    getStatusColor,
    getStatusLabel
}: {
    apt: Appointment,
    onCancel: (id: number) => void,
    onReschedule?: (id: number) => void,
    getStatusColor: (s: string) => string,
    getStatusLabel: (s: string) => string
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-card transition-all duration-200">
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center p-4 active:bg-zinc-50 dark:active:bg-white/[0.02] transition-colors cursor-pointer"
            >
                {/* Left: Date Box (mimicking the "album art" or major visual anchor) */}
                <div className={cn(
                    "h-12 w-12 rounded-xl flex flex-col items-center justify-center shrink-0 border shadow-sm",
                    getStatusColor(apt.status) // Use status color for border/bg tint
                )}>
                    <span className="text-[10px] uppercase font-bold opacity-60 leading-none mb-0.5">
                        {format(new Date(apt.date), "MMM")}
                    </span>
                    <span className="text-lg font-black leading-none">
                        {format(new Date(apt.date), "d")}
                    </span>
                </div>

                {/* Middle: Info */}
                <div className="flex-1 ml-4 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-sm text-foreground truncate pr-2">
                            {apt.departmentName}
                        </h4>
                        {/* Status Dot */}
                        {apt.status === 'pending_review' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />}
                        {apt.status === 'reschedule_requested' && <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
                        {(apt.status === 'confirmed' || apt.status === 'booked') && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                        {apt.status === 'cancelled' && <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 shrink-0" />}
                    </div>

                    <p className="text-xs text-muted-foreground truncate">
                        {apt.doctorName ? `Dr. ${apt.doctorName} • ` : ''}
                        {apt.slotStartTime && apt.slotEndTime ? (
                          `${formatDatabaseTimeForDisplay(apt.slotStartTime)} - ${formatDatabaseTimeForDisplay(apt.slotEndTime)}`
                        ) : (
                          `Slot #${apt.slotNumber}`
                        )}
                    </p>
                </div>

                {/* Right: Chevron / Expand Indicator */}
                <div className="ml-2 text-muted-foreground/30">
                    <ChevronRight className={cn(
                        "h-5 w-5 transition-transform duration-200",
                        isExpanded && "rotate-90"
                    )} />
                </div>
            </div>

            {/* Expanded Content: Actions */}
            <div className={cn(
                "grid transition-all duration-200 ease-in-out px-4 overflow-hidden",
                isExpanded ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
                <div className="min-h-0 pt-2 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-4 mt-2">
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase tracking-widest font-bold">
                            {getStatusLabel(apt.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                            {format(new Date(apt.date), "EEEE")}
                        </span>
                    </div>

                    {(apt.status === "pending_review" || apt.status === "reschedule_requested" || apt.status === "booked" || apt.status === "confirmed") ? (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-9 text-xs rounded-lg font-semibold"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReschedule?.(apt.id);
                                }}
                            >
                                Reschedule
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 h-9 text-xs rounded-lg shadow-none bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCancel(apt.id);
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <p className="text-xs text-center text-muted-foreground py-2">
                            No actions available for this appointment.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export function MobileAppointmentsList({
    appointments,
    isLoading,
    onCancel,
    onReschedule
}: MobileAppointmentsListProps) {

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            pending_review: "bg-amber-50/50 text-amber-700 border-amber-200 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800",
            reschedule_requested: "bg-red-50/50 text-red-700 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800",
            booked: "bg-blue-50/50 text-blue-700 border-blue-200 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800",
            confirmed: "bg-green-50/50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800",
            arrived: "bg-yellow-50/50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/10 dark:text-yellow-400 dark:border-yellow-800",
            waiting: "bg-purple-50/50 text-purple-700 border-purple-200 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800",
            completed: "bg-emerald-50/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800",
            no_show: "bg-red-50/50 text-red-700 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800",
            cancelled: "bg-zinc-100/50 text-zinc-500 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-500 dark:border-zinc-700",
            rescheduled: "bg-orange-50/50 text-orange-700 border-orange-200 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800",
        };
        return colors[status] || "bg-zinc-50 border-zinc-200";
    };

    // Get display label for status
    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            pending_review: "Pending Confirmation",
            reschedule_requested: "Reschedule Requested",
            booked: "Confirmed",
            confirmed: "Confirmed",
            arrived: "Arrived",
            waiting: "Waiting",
            completed: "Completed",
            no_show: "No Show",
            cancelled: "Cancelled",
            rescheduled: "Rescheduled",
        };
        return labels[status] || status;
    };

    if (isLoading) {
        return (
            <div className="pb-24 divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-b border-zinc-100 dark:border-zinc-800">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="h-16 w-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                    <CalendarX className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                </div>
                <h3 className="text-base font-bold text-foreground">No appointments found</h3>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-[200px]">
                    No appointments match your current filter.
                </p>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* List Container - Simulating the clean list look */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-b border-zinc-100 dark:border-zinc-800">
                {appointments.map((apt) => (
                    <AppointmentRow
                        key={apt.id}
                        apt={apt}
                        onCancel={onCancel}
                        onReschedule={onReschedule}
                        getStatusColor={getStatusColor}
                        getStatusLabel={getStatusLabel}
                    />
                ))}
            </div>
        </div>
    );
}
