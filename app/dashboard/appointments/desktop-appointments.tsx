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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Clock,
  User,
  Building2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppointmentModal } from "@/components/calendar/appointment-modal";
import { QuickBookingDialogTanstack as QuickBookingDialog } from "@/components/ui/quick-booking-dialog-tanstack";
import { DataPagination } from "@/components/ui/data-pagination";
import { formatDatabaseTimeForDisplay } from "@/lib/slot-time-utils";
import { AppointmentsTableSkeleton } from "@/components/appointments/appointments-table-skeleton";
import { format } from "date-fns";

// 🚀 Import TanStack Query hooks
import {
  useAppointmentsListManagement,
  useDeleteAppointment,
} from "@/hooks/use-hospital-queries";
import { useDebounce } from "@/hooks/use-debounce";

interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  clientXNumber: string;
  doctorId: number;
  doctorName: string;
  departmentId: number;
  departmentName: string;
  date: string;
  slotNumber: number;
  slotStartTime?: string;
  slotEndTime?: string;
  status: string;
  statusColor: string;
  notes?: string;
  phone: string;
  category: string;
  bookedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export default function DesktopAppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  // Helper to format slot time
  const formatSlotTime = (appointment: Appointment) => {
    if (appointment.slotStartTime && appointment.slotEndTime) {
      return `${formatDatabaseTimeForDisplay(appointment.slotStartTime)} - ${formatDatabaseTimeForDisplay(appointment.slotEndTime)}`;
    }
    return `Slot ${appointment.slotNumber}`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Increased from 10 to 20 for better UX

  // 🚀 Debounce search term (500ms delay)
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 🚀 TanStack Query: Replace all manual fetch logic with one hook!
  const {
    data: appointmentsData,
    isLoading: loading,
    error: queryError,
    isRefetching,
  } = useAppointmentsListManagement({
    search: debouncedSearch,
    status: statusFilter,
    dateFilter,
    page: currentPage,
    limit: itemsPerPage,
  });

  // 🚀 TanStack Query: Delete mutation with optimistic updates
  const deleteMutation = useDeleteAppointment();

  // Extract data with safe defaults
  const appointments = appointmentsData?.data || [];
  const pagination = appointmentsData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  };
  const error = queryError?.message || "";

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleAppointmentUpdate = (updatedAppointment: Appointment) => {
    // TanStack Query automatically refetches after mutation!
    setIsModalOpen(false);
  };

  const handleAppointmentDelete = (appointmentId: number) => {
    // 🚀 TanStack Query: Use mutation hook - handles optimistic updates automatically!
    deleteMutation.mutate(appointmentId);
    setIsModalOpen(false);
  };

  // Pagination handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: any) => void, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  const exportAppointments = () => {
    const csvContent = [
      [
        "Date",
        "Time Slot",
        "Patient",
        "X-Number",
        "Department",
        "Status",
        "Category",
        "Phone",
        "Booked At",
        "Reviewed By",
        "Notes",
      ],
      ...appointments.map((apt) => [
        apt.date,
        formatSlotTime(apt),
        apt.clientName,
        apt.clientXNumber,
        apt.departmentName,
        apt.status,
        apt.category,
        apt.phone,
        apt.bookedAt || "",
        apt.reviewedBy || "",
        apt.notes || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">
            Manage all patient appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportAppointments} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsQuickBookingOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-3 rounded-lg border">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => handleFilterChange(setStatusFilter, value)}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="arrived">Arrived</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={dateFilter}
          onValueChange={(value) => handleFilterChange(setDateFilter, value)}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button - Show only if filters are active */}
        {(searchTerm || statusFilter !== "all" || dateFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setDateFilter("all");
              setCurrentPage(1);
            }}
            className="h-9 px-2 text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader className="pb-4 pt-5 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Appointments</CardTitle>
              <CardDescription>
                Showing {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, pagination.totalCount)} of{" "}
                {pagination.totalCount} results
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && appointments.length === 0 ? (
            <AppointmentsTableSkeleton />
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Error: {error}</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No appointments found matching your criteria</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] text-center">Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="hidden xl:table-cell text-center">Booked At</TableHead>
                    <TableHead className="hidden xl:table-cell">Reviewed By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {format(new Date(appointment.date), "EEE")}
                          </span>
                          <span className="text-sm">
                            {format(new Date(appointment.date), "MMM d, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className="font-mono text-xs font-semibold">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatSlotTime(appointment)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {appointment.clientName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {appointment.clientXNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span>{appointment.departmentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {appointment.bookedAt ? (
                          <div className="flex flex-col items-center">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(appointment.bookedAt), "MMM d, yyyy")}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70">
                              {format(new Date(appointment.bookedAt), "h:mm a")}
                            </span>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">-</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                        {appointment.reviewedBy ? (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3" />
                            {appointment.reviewedBy}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: appointment.statusColor + "20",
                            color: appointment.statusColor,
                            borderColor: appointment.statusColor + "40",
                          }}
                          className="capitalize"
                        >
                          {appointment.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleAppointmentClick(appointment)}
                            >
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAppointmentClick(appointment)}
                            >
                              Edit appointment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleAppointmentDelete(appointment.id)}
                            >
                              Cancel appointment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 0 && (
            <div className="mt-4">
              <DataPagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment as any}
        userRole="admin"
        onAppointmentUpdate={handleAppointmentUpdate as any}
        onAppointmentDelete={handleAppointmentDelete}
      />

      <QuickBookingDialog
        isOpen={isQuickBookingOpen}
        onClose={() => setIsQuickBookingOpen(false)}
        userRole="admin"
      />
    </div>
  );
}
