"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Calendar,
    Clock,
    Users,
    Search,
    CalendarDays,
    MapPin,
    Filter,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDatabaseTimeForDisplay } from "@/lib/slot-time-utils";
import type { User } from "@/lib/types";
import { DataPaginationCompact } from "@/components/ui/data-pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

// Import TanStack Query hooks
import {
    useAppointmentsList,
    AppointmentFilters,
} from "@/hooks/use-hospital-queries";
import { useDebounce } from "@/hooks/use-debounce";

interface ReviewerMobileAppointmentsProps {
    user: User;
}

export function ReviewerMobileAppointments({
    user,
}: ReviewerMobileAppointmentsProps) {
    // Local state
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("upcoming"); // specific backend filter, usually 'all', 'today', 'upcoming'

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filters object
    const filters: AppointmentFilters = {
        search: debouncedSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        dateFilter: dateFilter, // Pass to backend
    };

    // TanStack Query hook
    const {
        data: appointmentsData,
        isLoading,
        error,
        isFetching,
    } = useAppointmentsList(filters, currentPage, itemsPerPage);

    // Extract data with safe defaults
    const appointments = appointmentsData?.data || [];
    const pagination = appointmentsData?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    };

    // Handle page changes
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Helper function to get status colors
    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            pending_review: "#F59E0B",
            reschedule_requested: "#DC2626",
            booked: "#3B82F6",
            confirmed: "#10B981",
            arrived: "#F59E0B",
            waiting: "#8B5CF6",
            completed: "#059669",
            no_show: "#EF4444",
            cancelled: "#6B7280",
            rescheduled: "#F97316",
        };
        return colors[status] || "#6B7280";
    };

    // Helper function to get status display label
    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            pending_review: "Pending Review",
            reschedule_requested: "Reschedule Req",
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

    const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (dateFilter !== "all" ? 1 : 0);

    return (
        <div className="space-y-4 pb-20">
            <div className="flex flex-col space-y-2 sticky top-0 bg-background/95 backdrop-blur z-20 pt-2 pb-2">
                <h1 className="text-2xl font-bold px-1">All Appointments</h1>

                {/* Search and Filter Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search client, doctor..."
                            className="pl-9 h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={activeFilterCount > 0 ? "default" : "outline"}
                                size="icon"
                                className="h-10 w-10 shrink-0"
                            >
                                <Filter className="h-4 w-4" />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium leading-none">Filters</h4>
                                    {(statusFilter !== "all" || dateFilter !== "all") && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 text-xs text-muted-foreground"
                                            onClick={() => {
                                                setStatusFilter("all");
                                                setDateFilter("all");
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Date Range</Label>
                                    <Select value={dateFilter} onValueChange={setDateFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="upcoming">Upcoming</SelectItem>
                                            <SelectItem value="past">Past</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="pending_review">Pending Review</SelectItem>
                                            <SelectItem value="confirmed">Confirmed</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="no_show">No Show</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Active Filters Row */}
                {(statusFilter !== "all" || dateFilter !== "all" || searchTerm) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {dateFilter !== "all" && (
                            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                                <span>{dateFilter === 'upcoming' ? 'Upcoming' : dateFilter === 'today' ? 'Today' : 'Past'}</span>
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setDateFilter("all")}
                                />
                            </div>
                        )}
                        {statusFilter !== "all" && (
                            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                                <span>{getStatusLabel(statusFilter)}</span>
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setStatusFilter("all")}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Appointments List */}
            <div className="space-y-3">
                {isLoading && currentPage === 1 ? (
                    <div className="space-y-3 py-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-lg border bg-card space-y-3">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="h-8 w-28" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-destructive">
                        <p>Error loading appointments</p>
                        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>No appointments found</p>
                    </div>
                ) : (
                    <>
                        {/* Loading Overlay for Refetching/Pagination */}
                        {isFetching && currentPage !== 1 && (
                            <div className="p-4 rounded-lg border bg-card space-y-3 mb-3">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                                <Skeleton className="h-4 w-48" />
                            </div>
                        )}

                        {appointments.map((appointment, index) => (
                            <motion.div
                                key={appointment.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={cn("overflow-hidden", isFetching && "opacity-70")}>
                                    <div className="flex h-full">
                                        {/* Color Status Strip */}
                                        <div
                                            className="w-1.5"
                                            style={{ backgroundColor: getStatusColor(appointment.status) }}
                                        />

                                        <div className="flex-1 p-2 space-y-1.5">
                                            {/* Header: Dept & Status */}
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-semibold text-sm truncate">
                                                    {appointment.clientName}
                                                </span>
                                                <span
                                                    className="px-1.5 py-0.5 text-[10px] rounded-full font-medium uppercase tracking-wide shrink-0"
                                                    style={{
                                                        backgroundColor: getStatusColor(appointment.status) + "20",
                                                        color: getStatusColor(appointment.status),
                                                    }}
                                                >
                                                    {getStatusLabel(appointment.status)}
                                                </span>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5 col-span-2">
                                                    <CalendarDays className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                                    <span className="text-foreground/80 truncate">
                                                        {new Date(appointment.date).toLocaleDateString("en-US", {
                                                            weekday: "short",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                        <span className="text-muted-foreground mx-1">•</span>
                                                        {appointment.slotStartTime && appointment.slotEndTime 
                                                          ? `${formatDatabaseTimeForDisplay(appointment.slotStartTime)} - ${formatDatabaseTimeForDisplay(appointment.slotEndTime)}`
                                                          : `Slot ${appointment.slotNumber}`}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 col-span-2">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="truncate font-medium">{appointment.departmentName}</span>
                                                </div>

                                                {appointment.doctorName && appointment.doctorName !== appointment.departmentName && (
                                                    <div className="flex items-center gap-1.5 col-span-2">
                                                        <Users className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">{appointment.doctorName}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Notes if any */}
                                            {appointment.notes && (
                                                <div className="pt-1">
                                                    <p className="text-xs bg-muted/50 p-1.5 rounded text-muted-foreground italic">
                                                        "{appointment.notes}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}

                        {/* Pagination */}
                        <div className="pt-2">
                            <DataPaginationCompact
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
