"use client";

import { useState, useMemo } from "react";
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
  Trash2,
  LayoutList,
  Table as TableIcon,
} from "lucide-react";
import { AppointmentModal } from "@/components/calendar/appointment-modal";
import { QuickBookingDialogTanstack } from "@/components/ui/quick-booking-dialog-tanstack";
import { DataPagination } from "@/components/ui/data-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Import TanStack Query hooks
import {
  useAppointmentsList,
  useDeleteAppointment,
  type AppointmentFilters,
  type DesktopAppointment,
} from "@/hooks/use-hospital-queries";

// Appointment Skeleton Loader Component
function AppointmentSkeleton() {
  return (
    <div
      className="grid items-center gap-3 p-3 border rounded-lg"
      style={{
        gridTemplateColumns:
          "100px 70px 150px 100px 90px 150px 130px 120px 110px 100px",
      }}
    >
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-14" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-16 mx-auto" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-20 mx-auto" />
      <div className="flex items-center gap-1 justify-end">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

export default function DesktopAppointmentsTanstackPage() {
  // Local state - much simpler now!
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] =
    useState<DesktopAppointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<"list" | "table">("list");

  // Debounce search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Create filters object for TanStack Query
  const filters: AppointmentFilters = useMemo(
    () => ({
      search: debouncedSearchTerm,
      status: statusFilter,
      dateFilter: dateFilter,
    }),
    [debouncedSearchTerm, statusFilter, dateFilter]
  );

  // TanStack Query hooks - This replaces ALL the useEffect and fetch logic!
  const {
    data: appointmentsData,
    isLoading: loading,
    error,
    isPlaceholderData, // For smooth pagination (replaces isPreviousData in v5)
    isRefetching, // For background refresh indicator
  } = useAppointmentsList(filters, currentPage, itemsPerPage);

  const deleteAppointmentMutation = useDeleteAppointment();

  // Safe data extraction with proper typing
  const appointments: DesktopAppointment[] =
    (appointmentsData as any)?.data || [];
  const pagination = (appointmentsData as any)?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Reset page when filters change
  const handleFilterChange = (
    type: "search" | "status" | "date",
    value: string
  ) => {
    setCurrentPage(1); // Reset to page 1 when filters change

    switch (type) {
      case "search":
        setSearchTerm(value);
        break;
      case "status":
        setStatusFilter(value);
        break;
      case "date":
        setDateFilter(value);
        break;
    }
  };

  const handleAppointmentClick = (appointment: DesktopAppointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleAppointmentUpdate = (updatedAppointment: any) => {
    // TanStack Query will automatically update the cache when we invalidate queries
    // The AppointmentModal should trigger cache invalidation on successful update
    // Convert modal appointment type back to DesktopAppointment
    const updated: DesktopAppointment = {
      ...updatedAppointment,
      phone: selectedAppointment?.phone || "",
      category: selectedAppointment?.category || "",
    };
    setSelectedAppointment(updated);
  };

  const handleAppointmentDelete = async (appointmentId: number) => {
    try {
      await deleteAppointmentMutation.mutateAsync(appointmentId);
      // Close modal if the deleted appointment was selected
      if (selectedAppointment?.id === appointmentId) {
        setIsModalOpen(false);
        setSelectedAppointment(null);
      }
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
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
        "Department",
        "Status",
        "Category",
        "Phone",
        "Notes",
      ],
      ...appointments.map((apt: DesktopAppointment) => [
        apt.date,
        `Slot ${apt.slotNumber}`,
        apt.clientName,
        apt.clientXNumber,
        apt.doctorName,
        apt.departmentName,
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
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) =>
              value && setViewMode(value as "list" | "table")
            }
          >
            <ToggleGroupItem value="list" aria-label="List view">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            onClick={exportAppointments}
            variant="outline"
            disabled={loading || appointments.length === 0}
          >
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
            {isRefetching && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
            )}
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
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchTerm && debouncedSearchTerm !== searchTerm && (
                <p className="text-xs text-muted-foreground mt-1">
                  Searching for "{searchTerm}"...
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => handleFilterChange("status", value)}
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
                onValueChange={(value) => handleFilterChange("date", value)}
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
                onClick={clearFilters}
                className="w-full"
                disabled={
                  searchTerm === "" &&
                  statusFilter === "all" &&
                  dateFilter === "all"
                }
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List - TanStack Query powered! */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Appointments ({pagination.totalCount})
                {isRefetching && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                )}
              </CardTitle>
              <CardDescription>
                {loading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  <>
                    Showing{" "}
                    {Math.max(
                      1,
                      (pagination.currentPage - 1) * itemsPerPage + 1
                    )}
                    -
                    {Math.min(
                      pagination.currentPage * itemsPerPage,
                      pagination.totalCount
                    )}{" "}
                    of {pagination.totalCount} appointments
                    {isPlaceholderData && " (Previous page while loading)"}
                  </>
                )}
              </CardDescription>
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading && currentPage === 1 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <AppointmentSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                Error:{" "}
                {(error as Error)?.message || "Failed to load appointments"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                TanStack Query will retry automatically
              </p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No appointments found matching your criteria</p>
              {(searchTerm ||
                statusFilter !== "all" ||
                dateFilter !== "all") && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {/* Column Headers */}
              <div
                className="grid items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg font-medium text-sm"
                style={{
                  gridTemplateColumns:
                    "80px 50px 250px 100px 200px 150px 130px 150px 110px 150px",
                }}
              >
                <div>Date</div>
                <div>Slot</div>
                <div>Patient</div>
                <div>X-Number</div>
                <div className="text-center">Category</div>
                <div>Doctor</div>
                <div>Department</div>
                <div>Phone</div>
                <div className="text-center">Status</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Show loading indicator for page changes */}
              {loading && isPlaceholderData && (
                <div className="space-y-2 mb-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <AppointmentSkeleton key={`loading-${idx}`} />
                  ))}
                </div>
              )}

              {appointments.map((appointment: DesktopAppointment) => (
                <div
                  key={appointment.id}
                  className="grid items-center gap-3 p-3 border rounded-lg hover:bg-accent dark:hover:bg-accent cursor-pointer transition-colors"
                  style={{
                    opacity: loading && isPlaceholderData ? 0.7 : 1,
                    transition: "opacity 0.2s ease-in-out",
                    gridTemplateColumns:
                      "80px 50px 250px 100px 200px 150px 130px 150px 110px 150px",
                  }}
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <div className="text-sm font-medium truncate">
                    {new Date(appointment.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    Slot {appointment.slotNumber}
                  </div>
                  <div className="font-medium truncate">
                    {appointment.clientName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {appointment.clientXNumber}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs truncate justify-center"
                  >
                    {appointment.category}
                  </Badge>
                  <div className="text-sm text-muted-foreground truncate">
                    {appointment.doctorName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {appointment.doctorName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {appointment.phone}
                  </div>
                  <div
                    style={{
                      color: appointment.statusColor,
                    }}
                    className="capitalize text-sm font-medium truncate text-center"
                  >
                    {appointment.status.replace("_", " ")}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(appointment);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentDelete(appointment.id);
                      }}
                      disabled={deleteAppointmentMutation.isPending}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {deleteAppointmentMutation.isPending &&
                      deleteAppointmentMutation.variables === appointment.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>X-Number</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment: DesktopAppointment) => (
                    <TableRow
                      key={appointment.id}
                      className="cursor-pointer"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <TableCell className="font-medium">
                        {new Date(appointment.date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell>Slot {appointment.slotNumber}</TableCell>
                      <TableCell>{appointment.clientName}</TableCell>
                      <TableCell>{appointment.clientXNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {appointment.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{appointment.doctorName}</TableCell>
                      <TableCell>{appointment.phone}</TableCell>
                      <TableCell>
                        <div
                          style={{
                            color: appointment.statusColor,
                          }}
                          className="capitalize text-sm font-medium"
                        >
                          {appointment.status.replace("_", " ")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(appointment);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentDelete(appointment.id);
                            }}
                            disabled={deleteAppointmentMutation.isPending}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleteAppointmentMutation.isPending &&
                            deleteAppointmentMutation.variables ===
                              appointment.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls with TanStack Query features */}
          {pagination.totalPages > 1 && !loading && (
            <div className="mt-4">
              <DataPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAppointment && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          appointment={selectedAppointment}
          userRole="admin"
          onAppointmentUpdate={handleAppointmentUpdate}
          onAppointmentDelete={handleAppointmentDelete}
        />
      )}

      <QuickBookingDialogTanstack
        isOpen={isQuickBookingOpen}
        onClose={() => setIsQuickBookingOpen(false)}
        userRole="admin"
      />
    </div>
  );
}
