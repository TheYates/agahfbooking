"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  clientXNumber: string;
  doctorId: number;
  doctorName: string;
  departmentId: number;
  departmentName: string;
  slotNumber: number;
  date: string;
  status: string;
  statusColor: string;
  notes?: string;
}

interface DayAppointmentsPopoverProps {
  appointments: Appointment[];
  date: Date;
  getDepartmentColor: (departmentId: number) => string;
  maskXNumber: (xNumber: string, isOwn: boolean) => string;
  currentUserId?: number;
  userRole: "client" | "receptionist" | "admin";
  onAppointmentClick: (appointment: Appointment) => void;
  onDragStart: (e: React.DragEvent, appointment: Appointment) => void;
  children: React.ReactNode;
}

export function DayAppointmentsPopover({
  appointments,
  date,
  getDepartmentColor,
  maskXNumber,
  currentUserId,
  userRole,
  onAppointmentClick,
  onDragStart,
  children,
}: DayAppointmentsPopoverProps) {
  const [open, setOpen] = useState(false);

  const isPastAppointment = (appointment: Appointment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate < today;
  };

  const dateString = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">{dateString}</h3>
          <p className="text-xs text-muted-foreground">
            {appointments.length} appointment
            {appointments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <ScrollArea className="max-h-80">
          <div className="p-1 space-y-0.5">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className={cn(
                  "p-1 rounded border-l-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs"
                )}
                style={{
                  backgroundColor: getDepartmentColor(apt.departmentId) + "10",
                  borderLeftColor: getDepartmentColor(apt.departmentId),
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAppointmentClick(apt);
                  setOpen(false);
                }}
                draggable={!isPastAppointment(apt)}
                onDragStart={(e) => onDragStart(e, apt)}
              >
                <div className="font-xs text-xs truncate">
                  {userRole === "client" && apt.clientId !== currentUserId
                    ? maskXNumber(apt.clientXNumber, false)
                    : apt.clientXNumber}
                </div>
                <div className="font-semibold text-xs truncate">
                  {userRole === "client" && apt.clientId !== currentUserId
                    ? "***"
                    : apt.clientName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {apt.departmentName}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
