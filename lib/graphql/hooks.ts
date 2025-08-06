"use client";

import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { 
  GET_CALENDAR_DATA, 
  GET_DASHBOARD_STATS, 
  GET_BOOKING_DATA,
  GET_APPOINTMENTS,
  GET_AVAILABLE_SLOTS,
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT 
} from './queries';

// Calendar data hook - replaces multiple API calls
export function useCalendarData(
  userRole: string,
  currentUserId: string,
  view: string,
  date: string,
  includeStats: boolean = false
) {
  return useQuery(GET_CALENDAR_DATA, {
    variables: {
      userRole,
      currentUserId,
      view,
      date,
      includeStats,
    },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });
}

// Dashboard stats hook
export function useDashboardStats(clientId?: string) {
  return useQuery(GET_DASHBOARD_STATS, {
    variables: { clientId },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000, // Refresh every minute
  });
}

// Booking data hook
export function useBookingData(departmentId: string) {
  return useQuery(GET_BOOKING_DATA, {
    variables: { departmentId },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first', // Departments don't change often
  });
}

// Appointments with pagination hook
export function useAppointments(
  filter: any = {},
  limit: number = 20,
  offset: number = 0,
  orderBy: string = 'appointmentDate',
  orderDirection: string = 'DESC'
) {
  return useQuery(GET_APPOINTMENTS, {
    variables: {
      filter,
      limit,
      offset,
      orderBy,
      orderDirection,
    },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });
}

// Available slots hook
export function useAvailableSlots(departmentId: string, date: string) {
  return useQuery(GET_AVAILABLE_SLOTS, {
    variables: { departmentId, date },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    skip: !departmentId || !date,
  });
}

// Create appointment mutation hook
export function useCreateAppointment() {
  return useMutation(CREATE_APPOINTMENT, {
    errorPolicy: 'all',
    // Optimistic response for better UX
    optimisticResponse: (variables) => ({
      createAppointment: {
        __typename: 'Appointment',
        id: 'temp-id',
        ...variables.input,
        status: 'BOOKED',
        createdAt: new Date().toISOString(),
      },
    }),
    // Update cache after mutation
    update: (cache, { data }) => {
      if (data?.createAppointment) {
        // Invalidate relevant queries
        cache.evict({ fieldName: 'appointments' });
        cache.evict({ fieldName: 'calendarData' });
        cache.evict({ fieldName: 'dashboardStats' });
      }
    },
  });
}

// Update appointment mutation hook
export function useUpdateAppointment() {
  return useMutation(UPDATE_APPOINTMENT, {
    errorPolicy: 'all',
    // Update cache after mutation
    update: (cache, { data }) => {
      if (data?.updateAppointment) {
        // Update the appointment in cache
        cache.modify({
          id: cache.identify(data.updateAppointment),
          fields: {
            status: () => data.updateAppointment.status,
            notes: () => data.updateAppointment.notes,
            appointmentDate: () => data.updateAppointment.appointmentDate,
            slotNumber: () => data.updateAppointment.slotNumber,
            updatedAt: () => data.updateAppointment.updatedAt,
          },
        });
      }
    },
  });
}

// Custom hook for real-time calendar updates
export function useCalendarSubscription(departmentId?: string) {
  // This would use GraphQL subscriptions for real-time updates
  // For now, we'll use polling as a simpler alternative
  return useQuery(GET_CALENDAR_DATA, {
    variables: {
      userRole: 'ADMIN', // Default for staff view
      currentUserId: '1',
      view: 'DAY',
      date: new Date().toISOString().split('T')[0],
      includeStats: false,
    },
    pollInterval: 30000, // Poll every 30 seconds for real-time feel
    skip: !departmentId,
  });
}

// Utility hook for cache management
export function useGraphQLCache() {
  const { cache } = useQuery(GET_DASHBOARD_STATS, { skip: true });
  
  return {
    clearCache: () => {
      cache.reset();
    },
    evictAppointments: () => {
      cache.evict({ fieldName: 'appointments' });
    },
    evictCalendarData: () => {
      cache.evict({ fieldName: 'calendarData' });
    },
    evictDashboardStats: () => {
      cache.evict({ fieldName: 'dashboardStats' });
    },
  };
}

export default {
  useCalendarData,
  useDashboardStats,
  useBookingData,
  useAppointments,
  useAvailableSlots,
  useCreateAppointment,
  useUpdateAppointment,
  useCalendarSubscription,
  useGraphQLCache,
};
