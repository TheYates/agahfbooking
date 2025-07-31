"use client";

import { useState, useEffect } from "react";
import { HospitalBookingCard } from "./hospital-booking-card";
import { toast } from "sonner";

interface TimeSlot {
  time: string;
  available: boolean;
  clientXNumber?: string;
}

interface DaySchedule {
  date: string; // ISO format (YYYY-MM-DD)
  displayDate: string; // Display format (e.g., "Aug 3")
  dayName: string;
  dayNumber: number;
  slots: TimeSlot[];
  hasAvailability: boolean;
}

interface Department {
  id: number;
  name: string;
  description: string;
  slots_per_day?: number;
}

interface Client {
  id: number;
  name: string;
  x_number: string;
  phone: string;
}

interface IntegratedBookingCardProps {
  userRole?: "staff" | "client";
  currentUserId?: number;
  className?: string;
}

export function IntegratedBookingCard({
  userRole = "client",
  currentUserId,
  className,
}: IntegratedBookingCardProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/departments");
        const data = await response.json();
        if (data.success) {
          setDepartments(data.data);
          if (data.data.length > 0) {
            setSelectedDepartment(data.data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        setError("Failed to load departments");
      }
    };

    fetchDepartments();
  }, []);

  // Fetch clients for staff users
  useEffect(() => {
    if (userRole === "staff") {
      const fetchClients = async () => {
        try {
          const response = await fetch("/api/clients");
          const data = await response.json();
          if (data.success) {
            setClients(data.data);
          }
        } catch (error) {
          console.error("Error fetching clients:", error);
        }
      };

      fetchClients();
    } else if (userRole === "client" && currentUserId) {
      // For client users, fetch their own data from the clients list
      const fetchClientData = async () => {
        try {
          const response = await fetch("/api/clients");
          const data = await response.json();
          if (data.success) {
            const clientData = data.data.find(
              (client: Client) => client.id === currentUserId
            );
            if (clientData) {
              setSelectedClient(clientData);
            }
          }
        } catch (error) {
          console.error("Error fetching client data:", error);
        }
      };

      fetchClientData();
    }
  }, [userRole, currentUserId]);

  // Fetch schedule when department or week changes
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedDepartment) return;

      setLoading(true);
      setError(null);

      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + currentWeekOffset * 7);

        const response = await fetch(
          `/api/appointments/schedule?departmentId=${
            selectedDepartment.id
          }&startDate=${startDate.toISOString()}`
        );
        const data = await response.json();

        if (data.success) {
          setWeekSchedule(data.data);
        } else {
          setError("Failed to load schedule");
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
        setError("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedDepartment, currentWeekOffset]);

  const handleDepartmentChange = (department: Department) => {
    setSelectedDepartment(department);
  };

  const handleClientChange = (client: Client) => {
    setSelectedClient(client);
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekOffset((prev) =>
      direction === "next" ? prev + 1 : prev - 1
    );
  };

  const handleBookingSuccess = async () => {
    // Refresh the schedule after successful booking
    if (selectedDepartment) {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + currentWeekOffset * 7);

        const response = await fetch(
          `/api/appointments/schedule?departmentId=${
            selectedDepartment.id
          }&startDate=${startDate.toISOString()}`
        );
        const data = await response.json();

        if (data.success) {
          setWeekSchedule(data.data);
        }
      } catch (error) {
        console.error("Error refreshing schedule:", error);
      }
    }
  };

  const handleTimeSlotSelect = async (day: string, time: string) => {
    if (!selectedDepartment || (userRole === "staff" && !selectedClient)) {
      setError("Please select all required fields");
      return;
    }

    // Check if the selected date is in the past
    const selectedDate = new Date(day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError("Cannot book appointments in the past");
      return;
    }

    // Let HospitalBookingCard handle the confirmation view
    // Don't show dialog - the HospitalBookingCard will show its inline confirmation
  };

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-lg p-6 max-w-2xl">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <HospitalBookingCard
        departments={departments}
        weekSchedule={weekSchedule}
        clients={clients}
        selectedClient={selectedClient}
        userRole={userRole}
        onDepartmentChange={handleDepartmentChange}
        onTimeSlotSelect={handleTimeSlotSelect}
        onWeekChange={handleWeekChange}
        onClientChange={handleClientChange}
        onBookingSuccess={handleBookingSuccess}
        loading={loading}
        className={className}
        currentUserId={currentUserId}
      />
    </>
  );
}
