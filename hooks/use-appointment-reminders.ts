"use client";

import { useEffect } from "react";
import { useLocalReminders } from "./use-local-reminders";
import { buildReminderSchedule } from "@/lib/reminder-utils";

interface Appointment {
  id: number;
  appointment_date?: string;
  date?: string; // Alternative field name
  slot_start_time?: string;
  slotStartTime?: string; // Alternative field name
  title?: string;
  departmentName?: string;
  status: string;
}

export function useAppointmentReminders(appointments: Appointment[], userId?: number) {
  const { scheduleMultipleLocalReminders, clearScheduledReminders } = useLocalReminders();

  useEffect(() => {
    if (!appointments || appointments.length === 0 || !userId) return;

    const scheduleReminders = async () => {
      // Filter to upcoming confirmed appointments only
      const upcomingAppointments = appointments.filter((apt) => {
        if (apt.status === "cancelled" || apt.status === "rescheduled") return false;
        
        const dateStr = apt.appointment_date || apt.date;
        const timeStr = apt.slot_start_time || apt.slotStartTime;
        if (!dateStr) return false;
        
        const appointmentDateTime = `${dateStr.split('T')[0]}T${timeStr || "00:00:00"}`;
        const appointmentTime = new Date(appointmentDateTime).getTime();
        
        return appointmentTime > Date.now();
      });

      for (const appointment of upcomingAppointments) {
        const dateStr = appointment.appointment_date || appointment.date;
        const timeStr = appointment.slot_start_time || appointment.slotStartTime;
        if (!dateStr) continue;
        
        const appointmentDateTime = `${dateStr.split('T')[0]}T${timeStr || "00:00:00"}`;
        const reminderSchedules = buildReminderSchedule(appointmentDateTime);

        const localReminders = reminderSchedules.map(({ scheduledAt, offsetMinutes }) => ({
          appointmentId: appointment.id,
          title: "Appointment Reminder",
          body: `${appointment.title || appointment.departmentName || "Your appointment"} is in ${offsetMinutes / 60} hour${offsetMinutes === 60 ? "" : "s"}`,
          scheduledAt,
        }));

        await scheduleMultipleLocalReminders(localReminders);
      }
    };

    scheduleReminders();
  }, [appointments, userId, scheduleMultipleLocalReminders]);

  return { clearScheduledReminders };
}
