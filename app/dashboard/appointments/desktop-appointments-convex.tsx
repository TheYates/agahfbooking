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
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar as CalendarIcon,
  User,
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
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

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
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
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

  // Convex queries and mutations
  const allAppointments = useQuery(api.queries.getAppointments, {});
  const allClients = useQuery(api.queries.getClients, {});
  const allDepartments = useQuery(api.queries.getDepartments, {});
  const allDoctors = useQuery(api.queries.getDoctors, {});
  const deleteAppointmentMutation = useMutation(api.mutations.deleteAppointment);
  const updateAppointmentMutation = useMutation(api.mutations.updateAppointment);

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

  // Transform appointments with client/department/doctor details
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

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleDeleteAppointment = async (appointmentId: Id<"appointments">) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    try {
      await deleteAppointmentMutation({ id: appointmentId });
      toast.success("Appointment deleted successfully");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete appointment");
    }
  };

  const handleUpdateStatus = async (appointmentId: Id<"appointments">, newStatus: string) => {
    try {
      await updateAppointmentMutation({
        id: appointmentId,
        status: newStatus as any,
      });
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage all appointments and bookings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <CalendarIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.upcoming}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <User className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, department, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments List</CardTitle>
          <CardDescription>
            {appointmentsWithDetails.length} appointment(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <AppointmentSkeleton key={i} />
                    ))}
                  </>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-red-600">
                      Error loading appointments
                    </TableCell>
                  </TableRow>
                ) : appointmentsWithDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No appointments found
                    </TableCell>
                  </TableRow>
                ) : (
                  appointmentsWithDetails.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {new Date(appointment.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{appointment.slotNumber}</TableCell>
                      <TableCell>{appointment.clientName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {appointment.clientXNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: `${appointment.statusColor}20`,
                            color: appointment.statusColor,
                          }}
                          className="capitalize"
                        >
                          {appointment.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{appointment.departmentName}</TableCell>
                      <TableCell>{appointment.doctorName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(appointment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
          onAppointmentUpdate={(updatedAppointment) => {
            // Handle appointment update - could refresh data or update local state
            console.log("Appointment updated:", updatedAppointment);
          }}
          onAppointmentDelete={(appointmentId) => {
            // Handle appointment deletion - could refresh data or update local state
            console.log("Appointment deleted:", appointmentId);
          }}
        />
      )}
    </div>
  );
}
