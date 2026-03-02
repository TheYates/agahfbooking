import { QueryClient } from "@tanstack/react-query";

/**
 * TanStack Query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Query keys for cache management
 */
export const queryKeys = {
  // Auth
  session: ["session"],
  user: ["user"],

  // Appointments
  appointments: ["appointments"],
  appointment: (id: number) => ["appointments", id],
  clientAppointments: (clientId: number) => ["appointments", "client", clientId],
  availableSlots: (departmentId: number, date: string) =>
    ["appointments", "slots", departmentId, date],

  // Departments
  departments: ["departments"],
  department: (id: number) => ["departments", id],
  departmentSchedule: (departmentId: number, date: string) =>
    ["departments", "schedule", departmentId, date],

  // Dashboard
  dashboardStats: ["dashboard", "stats"],

  // Notifications
  notifications: ["notifications"],
  unreadCount: ["notifications", "unread-count"],
} as const;
