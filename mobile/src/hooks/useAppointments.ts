import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import { queryKeys } from "../lib/queryClient";
import {
  Department,
  DepartmentWithAvailability,
  Appointment,
  AppointmentWithDetails,
  CreateAppointmentInput,
} from "../types";

/**
 * Hook to fetch all departments
 */
export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: async () => {
      const response = await api.get<{ departments: DepartmentWithAvailability[] }>(
        "/api/departments"
      );
      return response.departments;
    },
  });
}

/**
 * Hook to fetch available slots for a department
 */
export function useAvailableSlots(departmentId: number, date: string) {
  return useQuery({
    queryKey: queryKeys.availableSlots(departmentId, date),
    queryFn: async () => {
      const response = await api.get<{ slots: number[] }>(
        `/api/appointments/available-slots?departmentId=${departmentId}&date=${date}`
      );
      return response.slots;
    },
    enabled: !!departmentId && !!date,
  });
}

/**
 * Hook to fetch client's appointments
 */
export function useClientAppointments(clientId: number, options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.clientAppointments(clientId), options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.status) params.append("status", options.status);

      const response = await api.get<{
        appointments: AppointmentWithDetails[];
        pagination: { total: number; page: number; pages: number };
      }>(`/api/appointments/client?${params.toString()}`);

      return response;
    },
    enabled: !!clientId,
  });
}

/**
 * Hook to book an appointment
 */
export function useBookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentInput) => {
      const response = await api.post<{ appointment: Appointment }>(
        "/api/appointments/book",
        data
      );
      return response.appointment;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

/**
 * Hook to cancel an appointment
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: number) => {
      await api.delete(`/api/appointments/cancel?id=${appointmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

/**
 * Hook to fetch dashboard stats
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const response = await api.get<{
        totalAppointments: number;
        upcomingAppointments: number;
        departments: number;
      }>("/api/dashboard/stats");
      return response;
    },
  });
}
