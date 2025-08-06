"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar, Clock, User, Bell } from "lucide-react";

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
}

interface AppointmentAlertsProps {
  userRole: "client" | "receptionist" | "admin";
  currentUserId?: number;
  enabled?: boolean;
}

export function AppointmentAlerts({
  userRole,
  currentUserId,
  enabled = true,
}: AppointmentAlertsProps) {
  const [hasShownTodayAlert, setHasShownTodayAlert] = useState(false);
  const [hasShownTomorrowAlert, setHasShownTomorrowAlert] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const checkUpcomingAppointments = async () => {
      try {
        // Get today's and tomorrow's dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayStr = today.toISOString().split("T")[0];
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        // Fetch appointments for the current user or all appointments for staff
        let apiUrl = "/api/appointments";
        if (userRole === "client" && currentUserId) {
          apiUrl = `/api/appointments/client?clientId=${currentUserId}&startDate=${todayStr}&endDate=${tomorrowStr}`;
        } else {
          apiUrl = `/api/appointments?startDate=${todayStr}&endDate=${tomorrowStr}`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) return;

        const appointments: Appointment[] = data.data || [];

        // Filter appointments for today and tomorrow
        const todayAppointments = appointments.filter(
          (apt) => apt.date === todayStr && apt.status !== "cancelled"
        );
        const tomorrowAppointments = appointments.filter(
          (apt) => apt.date === tomorrowStr && apt.status !== "cancelled"
        );

        // Show today's appointment alerts
        if (todayAppointments.length > 0 && !hasShownTodayAlert) {
          showTodayAppointmentAlert(todayAppointments);
          setHasShownTodayAlert(true);
        }

        // Show tomorrow's appointment alerts
        if (tomorrowAppointments.length > 0 && !hasShownTomorrowAlert) {
          showTomorrowAppointmentAlert(tomorrowAppointments);
          setHasShownTomorrowAlert(true);
        }
      } catch (error) {
        console.error("Error checking upcoming appointments:", error);
      }
    };

    // Check immediately
    checkUpcomingAppointments();

    // Check every 30 minutes
    const interval = setInterval(checkUpcomingAppointments, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userRole, currentUserId, enabled, hasShownTodayAlert, hasShownTomorrowAlert]);

  const showTodayAppointmentAlert = (appointments: Appointment[]) => {
    if (appointments.length === 1) {
      const apt = appointments[0];
      toast.info("📅 Today's Appointment", {
        description: (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">
                {userRole === "client" ? apt.doctorName : apt.clientName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Slot {apt.slotNumber} - {apt.departmentName}</span>
            </div>
            {apt.notes && (
              <div className="text-sm text-muted-foreground">
                Note: {apt.notes}
              </div>
            )}
          </div>
        ),
        duration: 8000,
        action: {
          label: "View Calendar",
          onClick: () => {
            window.location.href = "/dashboard/calendar";
          },
        },
      });
    } else {
      toast.info("📅 Today's Appointments", {
        description: `You have ${appointments.length} appointments scheduled for today`,
        duration: 6000,
        action: {
          label: "View All",
          onClick: () => {
            window.location.href = "/dashboard/calendar";
          },
        },
      });
    }
  };

  const showTomorrowAppointmentAlert = (appointments: Appointment[]) => {
    if (appointments.length === 1) {
      const apt = appointments[0];
      toast.info("🔔 Tomorrow's Appointment", {
        description: (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">
                {userRole === "client" ? apt.doctorName : apt.clientName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Slot {apt.slotNumber} - {apt.departmentName}</span>
            </div>
            {apt.notes && (
              <div className="text-sm text-muted-foreground">
                Note: {apt.notes}
              </div>
            )}
          </div>
        ),
        duration: 8000,
        action: {
          label: "View Calendar",
          onClick: () => {
            window.location.href = "/dashboard/calendar";
          },
        },
      });
    } else {
      toast.info("🔔 Tomorrow's Appointments", {
        description: `You have ${appointments.length} appointments scheduled for tomorrow`,
        duration: 6000,
        action: {
          label: "View All",
          onClick: () => {
            window.location.href = "/dashboard/calendar";
          },
        },
      });
    }
  };

  // This component doesn't render anything visible
  return null;
}
