"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Custom hooks for common Convex queries
 * Replaces TanStack Query hooks and PostgreSQL queries
 */

// ============= USERS =============

export function useUsers(role?: "receptionist" | "admin", isActive?: boolean) {
  return useQuery(api.queries.getUsers, { role, isActive });
}

export function useUserById(id: Id<"users">) {
  return useQuery(api.queries.getUserById, { id });
}

// ============= CLIENTS =============

export function useClients(params?: {
  category?: string;
  isActive?: boolean;
  search?: string;
}) {
  return useQuery(api.queries.getClients, params || {});
}

export function useClientById(id: Id<"clients">) {
  return useQuery(api.queries.getClientById, { id });
}

export function useClientByXNumber(x_number: string) {
  return useQuery(api.queries.getClientByXNumber, { x_number });
}

export function useClientStats() {
  return useQuery(api.queries.getClientStats, {});
}

// ============= DEPARTMENTS =============

export function useDepartments(isActive?: boolean) {
  return useQuery(api.queries.getDepartments, { isActive });
}

export function useDepartmentById(id: Id<"departments">) {
  return useQuery(api.queries.getDepartmentById, { id });
}

export function useDepartmentWithStats(id: Id<"departments">, date: string) {
  return useQuery(api.queries.getDepartmentWithStats, { id, date });
}

// ============= DOCTORS =============

export function useDoctors(department_id?: Id<"departments">, isActive?: boolean) {
  return useQuery(api.queries.getDoctors, { department_id, isActive });
}

export function useDoctorById(id: Id<"doctors">) {
  return useQuery(api.queries.getDoctorById, { id });
}

// ============= APPOINTMENTS =============

export function useAppointments(params?: {
  client_id?: Id<"clients">;
  department_id?: Id<"departments">;
  date?: string;
  status?: "booked" | "arrived" | "waiting" | "completed" | "no_show" | "cancelled" | "rescheduled";
}) {
  return useQuery(api.queries.getAppointments, params || {});
}

export function useAppointmentById(id: Id<"appointments">) {
  return useQuery(api.queries.getAppointmentById, { id });
}

export function useAppointmentWithDetails(id: Id<"appointments">) {
  return useQuery(api.queries.getAppointmentWithDetails, { id });
}

export function useAvailableSlots(department_id: Id<"departments">, date: string) {
  return useQuery(api.queries.getAvailableSlots, { department_id, date });
}

// ============= DASHBOARD =============

export function useDashboardStats(startDate?: string, endDate?: string) {
  return useQuery(api.queries.getDashboardStats, { startDate, endDate });
}

// ============= SYSTEM SETTINGS =============

export function useSystemSettings() {
  return useQuery(api.queries.getSystemSettings, {});
}

export function useSystemSetting(key: string) {
  return useQuery(api.queries.getSystemSetting, { key });
}

// ============= SEARCH =============

export function useUniversalSearch(searchTerm: string) {
  return useQuery(api.queries.universalSearch, { searchTerm });
}

// ============= MUTATIONS =============

export function useCreateClient() {
  return useMutation(api.mutations.createClient);
}

export function useUpdateClient() {
  return useMutation(api.mutations.updateClient);
}

export function useDeleteClient() {
  return useMutation(api.mutations.deleteClient);
}

export function useCreateAppointment() {
  return useMutation(api.mutations.createAppointment);
}

export function useUpdateAppointment() {
  return useMutation(api.mutations.updateAppointment);
}

export function useCancelAppointment() {
  return useMutation(api.mutations.cancelAppointment);
}

export function useRescheduleAppointment() {
  return useMutation(api.mutations.rescheduleAppointment);
}

export function useCreateDepartment() {
  return useMutation(api.mutations.createDepartment);
}

export function useUpdateDepartment() {
  return useMutation(api.mutations.updateDepartment);
}

export function useCreateUser() {
  return useMutation(api.mutations.createUser);
}

export function useUpdateUser() {
  return useMutation(api.mutations.updateUser);
}

export function useToggleUserActive() {
  return useMutation(api.mutations.toggleUserActive);
}
