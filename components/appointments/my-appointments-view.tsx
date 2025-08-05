"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Building } from "lucide-react";

interface Appointment {
  id: number;
  date: string;
  slotNumber: number;
  status: string;
  doctorName: string;
  departmentId: number;
  departmentName: string;
  departmentColor: string;
  notes?: string;
}

interface MyAppointmentsViewProps {
  currentUserId: number;
}

export function MyAppointmentsView({ currentUserId }: MyAppointmentsViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "past" | "completed" | "cancelled"
  >("all");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/appointments/client?clientId=${currentUserId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch appointments");
        }

        setAppointments(data.data || []);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load appointments"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentUserId]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      booked:
        "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
      confirmed:
        "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300",
      arrived:
        "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
      waiting:
        "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300",
      completed:
        "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300",
      no_show: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300",
      cancelled:
        "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
      rescheduled:
        "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300",
    };
    return (
      colors[status] ||
      "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
    );
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId);
    if (!appointment) return;

    const confirmCancel = window.confirm(
      `Are you sure you want to cancel your appointment with Dr. ${
        appointment.doctorName
      } on ${new Date(appointment.date).toLocaleDateString()}?`
    );

    if (!confirmCancel) return;

    try {
      const response = await fetch(
        `/api/appointments/cancel?departmentId=${appointment.departmentId}&date=${appointment.date}&slotNumber=${appointment.slotNumber}&clientId=${currentUserId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update the local state to reflect the cancellation
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt
          )
        );
        alert("Appointment cancelled successfully!");
      } else {
        alert(
          "Failed to cancel appointment: " + (data.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case "upcoming":
        return (
          appointmentDate >= today &&
          appointment.status !== "completed" &&
          appointment.status !== "cancelled"
        );
      case "past":
        return appointmentDate < today;
      case "completed":
        return appointment.status === "completed";
      case "cancelled":
        return appointment.status === "cancelled";
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Appointments
        </Button>
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </Button>
        <Button
          variant={filter === "past" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("past")}
        >
          Past
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          Completed
        </Button>
        <Button
          variant={filter === "cancelled" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("cancelled")}
        >
          Cancelled
        </Button>
      </div>

      {/* Appointments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">
              Loading appointments...
            </p>
          </div>
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
              {filter === "all"
                ? "You don't have any appointments yet."
                : `No ${filter} appointments found.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Department
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Doctor
                  </div>
                </TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[150px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {new Date(appointment.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      Slot {appointment.slotNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {appointment.departmentName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-muted-foreground">
                      Dr. {appointment.doctorName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {appointment.notes || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {appointment.status === "booked" && (
                        <Button size="sm" variant="outline">
                          Reschedule
                        </Button>
                      )}
                      {(appointment.status === "booked" ||
                        appointment.status === "confirmed") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleCancelAppointment(appointment.id)
                          }
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
