// @ts-nocheck
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Eye,
  Trash2,
  Calendar as CalendarIcon,
  User,
  MoreHorizontal,
  CheckSquare,
} from "lucide-react";
import { AppointmentModalConvex as AppointmentModal } from "@/components/calendar/appointment-modal-convex";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Helper function for status colors
const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    booked: "#3B82F6",
    arrived: "#10B981",
    waiting: "#F59E0B",
    completed: "#059669",
    no_show: "#EF4444",
    cancelled: "#6B7280",
    rescheduled: "#8B5CF6",
  };
  return statusColors[status] || "#6B7280";
};

// Appointment Skeleton Loader Component
function AppointmentSkeleton() {
  return (
    <TableRow>
      <TableCell className="w-[50px]"><Skeleton className="h-4 w-4" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell>
        <div className="flex justify-end">
          <Skeleton className="h-8 w-8" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function DesktopAppointmentsConvex() {
  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination & Selection state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Convex queries and mutations
  const allAppointments = useQuery(api.queries.getAppointments, {});
  const allClients = useQuery(api.queries.getClients, {});
  const allDepartments = useQuery(api.queries.getDepartments, {});
  const allDoctors = useQuery(api.queries.getDoctors, {});
  
  const deleteAppointmentMutation = useMutation(api.mutations.deleteAppointment);
  const deleteAppointmentsMutation = useMutation(api.mutations.deleteAppointments);

  const loading = allAppointments === undefined || allClients === undefined || 
                  allDepartments === undefined || allDoctors === undefined;
  const error = allAppointments === null || allClients === null || 
                allDepartments === null || allDoctors === null;

  // Filter appointments based on search, status, and date
  const filteredAppointments = useMemo(() => {
    if (!allAppointments || !allClients || !allDepartments || !allDoctors) return [];

    let filtered = allAppointments;

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    if (dateFilter === "today") {
      filtered = filtered.filter((apt) => apt.appointment_date === todayStr);
    } else if (dateFilter === "upcoming") {
      filtered = filtered.filter(
        (apt) =>
          apt.appointment_date >= todayStr &&
          apt.status !== "cancelled" &&
          apt.status !== "completed"
      );
    } else if (dateFilter === "past") {
      filtered = filtered.filter((apt) => apt.appointment_date < todayStr);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((apt) => {
        const client = allClients.find((c) => c._id === apt.client_id);
        const department = allDepartments.find((d) => d._id === apt.department_id);
        const doctor = apt.doctor_id ? allDoctors.find((d) => d._id === apt.doctor_id) : null;

        return (
          client?.name.toLowerCase().includes(search) ||
          client?.x_number.toLowerCase().includes(search) ||
          department?.name.toLowerCase().includes(search) ||
          doctor?.name.toLowerCase().includes(search) ||
          apt.appointment_date.includes(search)
        );
      });
    }

    // Sort by date and slot (newest first)
    return filtered.sort((a, b) => {
      if (a.appointment_date === b.appointment_date) {
        return b.slot_number - a.slot_number;
      }
      return b.appointment_date.localeCompare(a.appointment_date);
    });
  }, [allAppointments, allClients, allDepartments, allDoctors, searchTerm, statusFilter, dateFilter]);

  // Transform appointments with details
  const appointmentsWithDetails = useMemo(() => {
    if (!allClients || !allDepartments || !allDoctors) return [];

    return filteredAppointments.map((apt) => {
      const client = allClients.find((c) => c._id === apt.client_id);
      const department = allDepartments.find((d) => d._id === apt.department_id);
      const doctor = apt.doctor_id ? allDoctors.find((d) => d._id === apt.doctor_id) : null;

      return {
        id: apt._id,
        clientId: apt.client_id,
        clientName: client?.name || "Unknown",
        clientXNumber: client?.x_number || "N/A",
        clientPhone: client?.phone || "",
        clientCategory: client?.category || "",
        doctorId: apt.doctor_id || department?._id,
        doctorName: doctor?.name || "Unassigned",
        departmentId: apt.department_id,
        departmentName: department?.name || "Unknown",
        date: apt.appointment_date,
        slotNumber: apt.slot_number,
        status: apt.status,
        statusColor: getStatusColor(apt.status),
        notes: apt.notes,
        createdAt: apt.created_at,
      };
    });
  }, [filteredAppointments, allClients, allDepartments, allDoctors]);

  // Pagination logic
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return appointmentsWithDetails.slice(startIndex, startIndex + itemsPerPage);
  }, [appointmentsWithDetails, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(appointmentsWithDetails.length / itemsPerPage);

  // Stats
  const stats = useMemo(() => {
    if (!allAppointments) return { total: 0, today: 0, upcoming: 0, completed: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    return {
      total: allAppointments.length,
      today: allAppointments.filter((apt) => apt.appointment_date === todayStr).length,
      upcoming: allAppointments.filter(
        (apt) =>
          apt.appointment_date >= todayStr &&
          apt.status !== "cancelled" &&
          apt.status !== "completed"
      ).length,
      completed: allAppointments.filter((apt) => apt.status === "completed").length,
    };
  }, [allAppointments]);

  // Handler functions
  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleDeleteAppointment = async (appointmentId: Id<"appointments">) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    try {
      await deleteAppointmentMutation({ id: appointmentId });
      toast.success("Appointment deleted successfully");
      // Deselect if it was selected
      if (selectedIds.has(appointmentId)) {
        const newSelected = new Set(selectedIds);
        newSelected.delete(appointmentId);
        setSelectedIds(newSelected);
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete appointment");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} appointments?`)) return;
    
    try {
      await deleteAppointmentsMutation({ ids: Array.from(selectedIds) as Id<"appointments">[] });
      toast.success(`${selectedIds.size} appointments deleted successfully`);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error bulk deleting appointments:", error);
      toast.error("Failed to delete selected appointments");
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all visible on current page
      const idsToAdd = paginatedAppointments.map(a => a.id);
      const newSet = new Set(selectedIds);
      idsToAdd.forEach(id => newSet.add(id));
      setSelectedIds(newSet);
    } else {
      // Deselect all visible on current page
      const newSet = new Set(selectedIds);
      paginatedAppointments.forEach(a => newSet.delete(a.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const isAllPageSelected = paginatedAppointments.length > 0 && paginatedAppointments.every(a => selectedIds.has(a.id));
  const isSomePageSelected = paginatedAppointments.some(a => selectedIds.has(a.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage and track all bookings in one place.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Schedule</CardTitle>
            <CalendarIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
            <CalendarIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <User className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle>Appointments List</CardTitle>
          <CardDescription>
            View, manage, and track patient appointments. Use checkboxes for bulk actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center space-x-2">
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, x-number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-muted/50"
                  />
                </div>
                {/* Bulk Action Button */}
                {selectedIds.size > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    className="ml-2 animate-in fade-in zoom-in duration-200"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedIds.size})
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-muted/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="arrived">Arrived</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px] bg-muted/50">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={isAllPageSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                        className={cn(isSomePageSelected && !isAllPageSelected && "indeterminate")}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>X-Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => <AppointmentSkeleton key={i} />)
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-red-500">
                        Error loading appointments. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : paginatedAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground flex-col gap-2">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckSquare className="h-8 w-8 text-muted-foreground/50" />
                          <p>No appointments found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAppointments.map((appointment) => (
                      <TableRow 
                        key={appointment.id}
                        className={selectedIds.has(appointment.id) ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(appointment.id)}
                            onCheckedChange={() => toggleSelectRow(appointment.id)}
                            aria-label={`Select appointment for ${appointment.clientName}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(appointment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className="font-mono">
                             #{appointment.slotNumber}
                           </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{appointment.clientName}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {appointment.clientXNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${appointment.statusColor}20`,
                              color: appointment.statusColor,
                              border: `1px solid ${appointment.statusColor}40`
                            }}
                            className="capitalize whitespace-nowrap"
                          >
                            {appointment.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={appointment.departmentName}>
                          {appointment.departmentName}
                        </TableCell>
                        <TableCell>{appointment.doctorName}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleViewDetails(appointment)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={appointmentsWithDetails.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointment Modal */}
      {selectedAppointment && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          userRole="admin"
          onAppointmentUpdate={() => {
            // Convex automatically updates
            console.log("Updated");
          }}
          onAppointmentDelete={() => {
             setIsModalOpen(false);
             setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}
