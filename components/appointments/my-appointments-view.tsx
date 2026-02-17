"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  User,
  Building,
  Search,
  CheckCircle2,
  Sparkles,
  CircleDashed,
  XCircle,
  MapPin,
  UserX,
  RefreshCw,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useClientAppointmentsPaginated,
  useCancelAppointment,
} from "@/hooks/use-hospital-queries";

import { MobileAppointmentsList } from "./mobile-appointments-list";
import { useAppointmentReminders } from "@/hooks/use-appointment-reminders";
import { QuickBookingDialogTanstack } from "@/components/ui/quick-booking-dialog-tanstack";

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
  bookedAt?: string;
}

interface MyAppointmentsViewProps {
  currentUserId: number;
}

export function MyAppointmentsView({ currentUserId }: MyAppointmentsViewProps) {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<{
    id: number;
    departmentId: number;
    departmentName: string;
    date: string;
    slotNumber: number;
  } | null>(null);

  // 🚀 TanStack Query: Replace manual fetch with optimized hook
  const {
    data: appointmentsData,
    isLoading: loading,
    error: queryError,
  } = useClientAppointmentsPaginated(
    currentUserId,
    1,
    1000, // Fetch all appointments at once for filtering
  );

  // 🚀 TanStack Query: Use mutation hook for cancellations
  const cancelMutation = useCancelAppointment();

  // Extract appointments with safe default
  const appointments: Appointment[] = (appointmentsData as any)?.data || [];

  // Schedule local reminders for upcoming appointments
  useAppointmentReminders(appointments, currentUserId);
  const error = queryError?.message || "";

  // 🚀 TanStack Query: Simplified cancel with optimistic updates
  const handleCancelAppointment = async (appointmentId: number) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId);
    if (!appointment) return;

    const confirmCancel = window.confirm(
      `Are you sure you want to cancel your appointment${appointment.doctorName ? ` with Dr. ${appointment.doctorName}` : ""} on ${new Date(appointment.date).toLocaleDateString()}?`,
    );

    if (!confirmCancel) return;

    // Use TanStack Query mutation - handles optimistic updates automatically!
    cancelMutation.mutate({
      departmentId: appointment.departmentId,
      date: appointment.date,
      slotNumber: appointment.slotNumber,
      clientId: currentUserId,
    });
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Date/Status Filter
    let matchesFilter = true;
    switch (filter) {
      case "upcoming":
        matchesFilter =
          appointmentDate >= today &&
          appointment.status !== "completed" &&
          appointment.status !== "cancelled";
        break;
      case "past":
        matchesFilter = appointmentDate < today;
        break;
      case "completed":
        matchesFilter = appointment.status === "completed";
        break;
      case "cancelled":
        matchesFilter = appointment.status === "cancelled";
        break;
      default:
        matchesFilter = true;
    }

    // Search Filter
    const query = searchQuery.toLowerCase();
    const searchMatch =
      (appointment.doctorName &&
        appointment.doctorName.toLowerCase().includes(query)) ||
      appointment.departmentName.toLowerCase().includes(query) ||
      (appointment.notes && appointment.notes.toLowerCase().includes(query));

    return matchesFilter && searchMatch;
  });

  const handleReschedule = (id: number) => {
    const appointment = appointments.find((apt) => apt.id === id);
    if (!appointment) return;

    // Check if appointment can be rescheduled
    const nonReschedulableStatuses = [
      "cancelled",
      "rescheduled",
      "completed",
      "no_show",
    ];
    if (nonReschedulableStatuses.includes(appointment.status)) {
      toast.error(
        `Cannot reschedule an appointment with status: ${appointment.status}`,
      );
      return;
    }

    setAppointmentToReschedule({
      id: appointment.id,
      departmentId: appointment.departmentId,
      departmentName: appointment.departmentName,
      date: appointment.date,
      slotNumber: appointment.slotNumber,
    });
    setRescheduleDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Live Updates Indicator */}
      {/* <div className="flex items-center justify-end">
        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Updates
          </span>
        </Badge>
      </div> */}

      {/* Filter Buttons */}
      {/* Mobile Filter & Search (Reference Style) */}
      <div className="md:hidden space-y-3 mb-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Find appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 rounded-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-base"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {["All", "Upcoming", "Past", "Completed", "Cancelled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab.toLowerCase())}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap border shadow-sm transition-all",
                filter === tab.toLowerCase()
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Filter & Search */}
      <div className="hidden md:flex flex-row gap-4 items-center justify-between">
        <Tabs
          defaultValue="all"
          value={filter}
          onValueChange={setFilter}
          className="w-auto"
        >
          <TabsList className="grid w-full grid-cols-5 md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search doctor or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <MobileAppointmentsList
          appointments={filteredAppointments}
          isLoading={loading}
          onCancel={handleCancelAppointment}
          onReschedule={handleReschedule}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <Skeleton className="h-10 w-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-red-600">
              <p className="text-sm">Error: {error}</p>
            </div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No appointments found</p>
              <p className="text-sm">
                Try adjusting your filters or search query.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-[2fr_1.25fr_1fr_1fr_1.25fr] gap-4 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div>Title</div>
              <div>Status</div>
              <div>Date</div>
              <div>Booked On</div>
              <div>Actions</div>
            </div>

            {/* Appointment Groups */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {Object.entries(
                filteredAppointments.reduce(
                  (groups, appointment) => {
                    const date = new Date(appointment.date);
                    date.setHours(0, 0, 0, 0); // Normalize to start of day

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                    let groupKey = "Older";

                    // Check in order: Today, Future (Upcoming), Yesterday, Last Week, Older
                    if (date.getTime() === today.getTime()) {
                      groupKey = "Today";
                    } else if (date > today) {
                      groupKey = "Upcoming";
                    } else if (date.getTime() === yesterday.getTime()) {
                      groupKey = "Yesterday";
                    } else if (date > sevenDaysAgo && date < today) {
                      groupKey = "Last Week";
                    }
                    // else stays "Older"

                    if (!groups[groupKey]) groups[groupKey] = [];
                    groups[groupKey].push(appointment);
                    return groups;
                  },
                  {} as Record<string, Appointment[]>,
                ),
              )
                .sort((a, b) => {
                  // Custom sort order
                  const order = [
                    "Today",
                    "Upcoming",
                    "Yesterday",
                    "Last Week",
                    "Older",
                  ];
                  return order.indexOf(a[0]) - order.indexOf(b[0]);
                })
                .map(([groupName, groupAppointments]) => (
                  <div key={groupName}>
                    <div className="px-6 py-3 bg-zinc-50/30 dark:bg-zinc-900/30 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {groupName}
                    </div>
                    <div>
                      {groupAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="grid grid-cols-[2fr_1.25fr_1fr_1fr_1.25fr] gap-4 px-6 py-4 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          {/* Title Column */}
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                              <Building className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                Appointment{" "}
                                {appointment.doctorName && (
                                  <>
                                    <span className="font-light text-xs text-muted-foreground">
                                      with
                                    </span>{" "}
                                    {appointment.doctorName}
                                  </>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {appointment.departmentName} •{" "}
                                {appointment.slotStartTime &&
                                appointment.slotEndTime
                                  ? `${appointment.slotStartTime.slice(0, 5)} - ${appointment.slotEndTime.slice(0, 5)}`
                                  : `Slot #${appointment.slotNumber}`}
                              </p>
                            </div>
                          </div>

                          {/* Status Column */}
                          <div className="flex items-center">
                            {(() => {
                              const statusConfig: Record<
                                string,
                                { icon: any; label: string; className: string }
                              > = {
                                pending_review: {
                                  icon: Clock,
                                  label: "Pending",
                                  className:
                                    "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400",
                                },
                                reschedule_requested: {
                                  icon: AlertTriangle,
                                  label: "Reschedule",
                                  className:
                                    "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400",
                                },
                                booked: {
                                  icon: CheckCircle2,
                                  label: "Confirmed",
                                  className:
                                    "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400",
                                },
                                confirmed: {
                                  icon: CheckCircle2,
                                  label: "Confirmed",
                                  className:
                                    "bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/30 dark:border-cyan-800 dark:text-cyan-400",
                                },
                                arrived: {
                                  icon: MapPin,
                                  label: "Arrived",
                                  className:
                                    "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-400",
                                },
                                waiting: {
                                  icon: Clock,
                                  label: "Waiting",
                                  className:
                                    "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-400",
                                },
                                completed: {
                                  icon: Check,
                                  label: "Done",
                                  className:
                                    "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400",
                                },
                                no_show: {
                                  icon: UserX,
                                  label: "Missed",
                                  className:
                                    "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400",
                                },
                                cancelled: {
                                  icon: XCircle,
                                  label: "Cancelled",
                                  className:
                                    "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400",
                                },
                                rescheduled: {
                                  icon: RefreshCw,
                                  label: "Moved",
                                  className:
                                    "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400",
                                },
                              };

                              const config = statusConfig[
                                appointment.status
                              ] || {
                                icon: CircleDashed,
                                label: appointment.status,
                                className:
                                  "bg-zinc-50 border-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400",
                              };

                              const StatusIcon = config.icon;

                              return (
                                <div
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium shadow-sm transition-colors",
                                    config.className,
                                  )}
                                >
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  <span className="capitalize">
                                    {config.label}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Date Column */}
                          <div className="text-sm text-zinc-500">
                            {new Date(appointment.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>

                          {/* Booked On Column */}
                          <div className="text-sm text-zinc-500">
                            {appointment.bookedAt ? (
                              <div className="flex flex-col">
                                <span>
                                  {new Date(
                                    appointment.bookedAt,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="text-xs text-zinc-400">
                                  {new Date(
                                    appointment.bookedAt,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </div>

                          {/* Actions Column */}
                          <div className="flex items-center gap-2">
                            {(appointment.status === "pending_review" ||
                              appointment.status === "reschedule_requested" ||
                              appointment.status === "booked" ||
                              appointment.status === "confirmed") && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    handleReschedule(appointment.id)
                                  }
                                >
                                  Reschedule
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    handleCancelAppointment(appointment.id)
                                  }
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Dialog */}
      <QuickBookingDialogTanstack
        isOpen={rescheduleDialogOpen}
        onClose={() => {
          setRescheduleDialogOpen(false);
          setAppointmentToReschedule(null);
        }}
        mode="reschedule"
        rescheduleAppointment={
          appointmentToReschedule
            ? {
                id: appointmentToReschedule.id,
                departmentId: appointmentToReschedule.departmentId,
                departmentName: appointmentToReschedule.departmentName,
                date: appointmentToReschedule.date,
                slotNumber: appointmentToReschedule.slotNumber,
              }
            : undefined
        }
        userRole="client"
        currentUserId={currentUserId}
        onRescheduleSuccess={() => {
          setRescheduleDialogOpen(false);
          setAppointmentToReschedule(null);
        }}
      />
    </div>
  );
}
