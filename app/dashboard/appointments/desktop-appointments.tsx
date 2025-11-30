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
} from "lucide-react";
import { AppointmentModal } from "@/components/calendar/appointment-modal";
import { QuickBookingDialogTanstack as QuickBookingDialog } from "@/components/ui/quick-booking-dialog-tanstack";
import { DataPagination } from "@/components/ui/data-pagination";

// 🚀 Import TanStack Query hooks
import { useAppointmentsListManagement, useDeleteAppointment } from "@/hooks/use-hospital-queries";
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
  status: string;
  statusColor: string;
  notes?: string;
  phone: string;
  category: string;
}

export default function DesktopAppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
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
        "Doctor",
        "Status",
        "Category",
        "Phone",
        "Notes",
      ],
      ...appointments.map((apt) => [
        apt.date,
        `Slot ${apt.slotNumber}`,
        apt.clientName,
        apt.clientXNumber,
        apt.doctorName,
        apt.status,
        apt.category,
        apt.phone,
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


      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search patients, doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => handleFilterChange(setStatusFilter, value)}
              >
                <SelectTrigger>
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
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Select
                value={dateFilter}
                onValueChange={(value) => handleFilterChange(setDateFilter, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter("all");
                  setCurrentPage(1);
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Appointments ({pagination.totalCount})
              </CardTitle>
              <CardDescription>
                Showing {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, pagination.totalCount)}{" "}
                of {pagination.totalCount} appointments
              </CardDescription>
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))
                  }
                  disabled={currentPage === pagination.totalPages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loading && appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading appointments...</p>
              </div>
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
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[60px]">
                      <div className="text-sm font-medium">
                        {new Date(appointment.date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Slot {appointment.slotNumber}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {appointment.clientName}
                        </span>
                        <span className="text-sm text-muted-foreground shrink-0">
                          ({appointment.clientXNumber})
                        </span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {appointment.category}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {appointment.doctorName} • {appointment.phone}
                      </div>
                      {appointment.notes && (
                        <div className="text-xs text-muted-foreground truncate">
                          {appointment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      style={{
                        backgroundColor: appointment.statusColor + "20",
                        color: appointment.statusColor,
                        borderColor: appointment.statusColor + "40",
                      }}
                      className="capitalize text-xs"
                    >
                      {appointment.status.replace("_", " ")}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 0 && (
            <DataPagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
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
