'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

// Types (matching your existing interfaces)
export interface Department {
  id: number
  name: string
  description: string
  slots_per_day: number
  working_days: string[]
  working_hours: { start: string; end: string }
  color?: string
}

interface Client {
  id: number
  name: string
  x_number: string
  phone: string
  category: string
}

interface TimeSlot {
  time: string
  available: boolean
  clientXNumber?: string
  clientId?: number
  isNonWorkingDay?: boolean
}

interface DaySchedule {
  date: string
  fullDate: string
  dayName: string
  dayNumber: number
  slots: TimeSlot[]
  hasAvailability: boolean
  isWorkingDay?: boolean
}

interface DashboardStats {
  upcomingAppointments: number
  totalAppointments: number
  completedAppointments: number
  availableSlots: number
  daysUntilNext: number | null
  recentAppointments: Array<{
    id: number
    date: string
    slotNumber: number
    status: string
    doctorName: string
    departmentName: string
    departmentColor: string
    clientName?: string // For staff view
    clientXNumber?: string // For staff view
  }>
}

interface Appointment {
  id: number
  date: string
  slotNumber: number
  status: string
  doctorName: string
  departmentName: string
  departmentColor: string
  notes?: string
  location?: string
}

interface PaginatedAppointments {
  data: Appointment[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface AppointmentFilters {
  search?: string
  status?: string
  dateFilter?: string
}

export interface DesktopAppointment {
  id: number
  clientId: number
  clientName: string
  clientXNumber: string
  doctorId: number
  doctorName: string
  departmentId: number
  departmentName: string
  date: string
  slotNumber: number
  status: string
  statusColor: string
  notes?: string
  phone: string
  category: string
}

interface PaginatedDesktopAppointments {
  data: DesktopAppointment[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface CalendarAppointment {
  id: number
  clientId: number
  clientName: string
  clientXNumber: string
  doctorId: number
  doctorName: string
  departmentId: number
  departmentName: string
  date: string
  slotNumber: number
  status: string
  statusColor: string
  notes?: string
}

export interface Doctor {
  id: number
  name: string
  specialization: string
  departmentId?: number
}

interface CalendarEndpoint {
  endpoint: string
  userRole: string
  access: 'full' | 'limited'
}

// API Functions
const fetchDepartments = async (): Promise<Department[]> => {
  const response = await fetch('/api/departments')
  if (!response.ok) throw new Error('Failed to fetch departments')
  const data = await response.json()
  return data.success ? data.data : []
}

const fetchClients = async (
  searchTerm: string = '',
  userRole: string = 'receptionist',
  currentUserId?: number
): Promise<Client[]> => {
  if (userRole === 'client' && currentUserId) {
    const response = await fetch(`/api/clients/stats?clientId=${currentUserId}`)
    const data = await response.json()
    if (data.success && data.data.length > 0) {
      return data.data.map((client: any) => ({
        id: client.id,
        name: client.name,
        x_number: client.xNumber,
        phone: client.phone,
        category: client.category,
      }))
    }
    return []
  }

  const params = new URLSearchParams()
  if (searchTerm) params.append('search', searchTerm)
  params.append('limit', '20')

  const response = await fetch(`/api/clients/stats?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch clients')
  const data = await response.json()
  return data.success ? data.data.map((client: any) => ({
    id: client.id,
    name: client.name,
    x_number: client.xNumber,
    phone: client.phone,
    category: client.category,
  })) : []
}

const fetchWeekSchedule = async (
  departmentId: number,
  weekOffset: number = 0
): Promise<DaySchedule[]> => {
  let startDate = new Date()

  if (weekOffset === 0) {
    // First week: start from today
    // Keep startDate as today
  } else if (weekOffset > 0) {
    // Future weeks: calculate from the start of the next complete week after today
    const today = new Date()
    const daysUntilNextSunday = today.getDay() === 0 ? 7 : 7 - today.getDay() // Days until next Sunday
    const nextSunday = new Date(today)
    nextSunday.setDate(today.getDate() + daysUntilNextSunday) // Sunday is week start

    startDate = new Date(nextSunday)
    startDate.setDate(nextSunday.getDate() + (weekOffset - 1) * 7)
  } else {
    // Previous weeks: go back from today
    startDate.setDate(startDate.getDate() + weekOffset * 7)
  }

  const apiUrl = `/api/appointments/schedule?departmentId=${departmentId}&startDate=${startDate.toISOString()}`

  const response = await fetch(apiUrl)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

  const data = await response.json()
  return data.success ? data.data : []
}

const fetchDashboardStats = async (clientId: number): Promise<DashboardStats> => {
  const response = await fetch(`/api/dashboard/stats?clientId=${clientId}`)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  
  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch stats')
  
  return data.data
}

const fetchStaffDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch('/api/dashboard/staff-stats')
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  
  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch staff stats')
  
  return data.data
}

const fetchClientAppointmentsPaginated = async (
  clientId: number,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedAppointments> => {
  const response = await fetch(
    `/api/appointments/client?clientId=${clientId}&page=${page}&limit=${limit}`
  )
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  
  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch appointments')
  
  return {
    data: data.data || [],
    pagination: data.pagination || {
      currentPage: page,
      totalPages: 1,
      totalCount: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  }
}

const fetchAppointmentsList = async (
  filters: AppointmentFilters,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedDesktopAppointments> => {
  const params = new URLSearchParams()
  
  if (filters.search) params.append('search', filters.search)
  if (filters.status && filters.status !== 'all') params.append('status', filters.status)
  if (filters.dateFilter && filters.dateFilter !== 'all') params.append('dateFilter', filters.dateFilter)
  
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  
  const response = await fetch(`/api/appointments/list?${params.toString()}`)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  
  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch appointments')
  
  return {
    data: data.data || [],
    pagination: data.pagination || {
      currentPage: page,
      totalPages: 1,
      totalCount: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  }
}

const deleteAppointment = async (appointmentId: number) => {
  const response = await fetch(`/api/appointments?id=${appointmentId}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) throw new Error('Failed to delete appointment')
  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Delete failed')
  return data
}

const fetchCalendarEndpoint = async (
  userRole: string, 
  userId: number | undefined
): Promise<CalendarEndpoint> => {
  const response = await fetch(
    `/api/calendar/endpoint?userRole=${userRole}&currentUserId=${userId || ''}`
  )
  if (!response.ok) throw new Error('Failed to get calendar endpoint')
  
  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Failed to get calendar endpoint')
  
  return data.data
}

const fetchCalendarAppointments = async (
  userRole: string,
  userId: number | undefined,
  startDate: string,
  endDate: string
): Promise<CalendarAppointment[]> => {
  try {
    // First get the appropriate endpoint
    const endpointData = await fetchCalendarEndpoint(userRole, userId)
    
    // Construct the API URL with date range
    const url = new URL(endpointData.endpoint, window.location.origin)
    url.searchParams.set('startDate', startDate)
    url.searchParams.set('endDate', endDate)
    
    const response = await fetch(url.toString())
    if (!response.ok) throw new Error('Failed to fetch calendar appointments')
    
    const data = await response.json()
    if (!data.success) throw new Error(data.error || 'Failed to fetch appointments')
    
    // Transform the data to match the expected interface
    const transformedAppointments = data.data.map((appointment: any) => ({
      id: appointment.id,
      clientId: appointment.client_id || appointment.clientId,
      clientName: appointment.client_name || appointment.clientName,
      clientXNumber: appointment.client_x_number || appointment.clientXNumber,
      doctorId: appointment.doctor_id || appointment.doctorId || appointment.department_id || appointment.departmentId,
      doctorName: appointment.doctor_name || appointment.doctorName || 'Unassigned',
      departmentId: appointment.department_id || appointment.departmentId,
      departmentName: appointment.department_name || appointment.departmentName,
      date: appointment.appointment_date 
        ? appointment.appointment_date.split('T')[0] 
        : appointment.date,
      slotNumber: appointment.slot_number || appointment.slotNumber,
      status: appointment.status,
      statusColor: getStatusColor(appointment.status),
      notes: appointment.notes,
    }))
    
    return transformedAppointments
  } catch (error) {
    throw error
  }
}

const fetchDoctors = async (): Promise<Doctor[]> => {
  const response = await fetch('/api/doctors')
  if (!response.ok) throw new Error('Failed to fetch doctors')
  
  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Failed to fetch doctors')
  
  // Transform the data to match the expected interface
  const transformedDoctors = data.data.map((doctor: any) => ({
    id: doctor.id,
    name: doctor.name,
    specialization: doctor.department_name || 'General',
    departmentId: doctor.department_id,
  }))
  
  return transformedDoctors
}

// Helper function for status colors (moved from component)
const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    booked: '#3B82F6',
    arrived: '#10B981', 
    waiting: '#F59E0B',
    completed: '#059669',
    no_show: '#EF4444',
    cancelled: '#6B7280',
    rescheduled: '#8B5CF6',
  }
  return statusColors[status] || '#6B7280'
}

const bookAppointment = async (bookingData: {
  departmentId: number
  clientId: number
  date: string
  slotNumber: number
}) => {
  const response = await fetch('/api/appointments/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  })
  
  if (!response.ok) throw new Error('Failed to book appointment')
  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Booking failed')
  return data
}

const cancelAppointment = async (cancelData: {
  departmentId: number
  date: string
  slotNumber: number
  clientId: number
}) => {
  const { departmentId, date, slotNumber, clientId } = cancelData
  const response = await fetch(
    `/api/appointments/cancel?departmentId=${departmentId}&date=${date}&slotNumber=${slotNumber}&clientId=${clientId}`,
    { method: 'DELETE' }
  )
  
  if (!response.ok) throw new Error('Failed to cancel appointment')
  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Cancellation failed')
  return data
}

// Custom Hooks
export const useDepartments = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: fetchDepartments,
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour - departments rarely change
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  })
}

export const useClients = (
  searchTerm: string = '',
  userRole: string = 'receptionist',
  currentUserId?: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: queryKeys.clients.search(searchTerm, userRole, currentUserId),
    queryFn: () => fetchClients(searchTerm, userRole, currentUserId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - clients don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData, // Show previous results while searching
  })
}

export const useSchedule = (
  departmentId: number | undefined,
  weekOffset: number = 0,
  enabled: boolean = true
) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.schedule.department(departmentId!, weekOffset),
    queryFn: () => fetchWeekSchedule(departmentId!, weekOffset),
    enabled: enabled && !!departmentId,
    staleTime: 30 * 1000, // 30 seconds - schedule data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute for real-time updates
    refetchIntervalInBackground: true,
    placeholderData: (previousData) => previousData, // Show previous data while loading new week
  })

  // Prefetch adjacent weeks for instant navigation
  if (departmentId && enabled && query.data) {
    // Prefetch next week
    queryClient.prefetchQuery({
      queryKey: queryKeys.schedule.department(departmentId, weekOffset + 1),
      queryFn: () => fetchWeekSchedule(departmentId, weekOffset + 1),
      staleTime: 30 * 1000,
    })

    // Prefetch previous week
    queryClient.prefetchQuery({
      queryKey: queryKeys.schedule.department(departmentId, weekOffset - 1),
      queryFn: () => fetchWeekSchedule(departmentId, weekOffset - 1),
      staleTime: 30 * 1000,
    })
  }

  return query
}

export const useBookAppointment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: bookAppointment,
    onMutate: async (newBooking) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.schedule.department(newBooking.departmentId) 
      })
      
      // Get current schedule data
      const currentWeekOffset = 0 // You may need to pass this as parameter
      const queryKey = queryKeys.schedule.department(newBooking.departmentId, currentWeekOffset)
      const previousSchedule = queryClient.getQueryData(queryKey)
      
      // Optimistically update the schedule
      queryClient.setQueryData(queryKey, (old: DaySchedule[] | undefined) => {
        if (!old) return old
        
        return old.map(day => {
          const bookingDate = new Date(newBooking.date).toISOString().split('T')[0]
          if (day.fullDate === bookingDate) {
            return {
              ...day,
              slots: day.slots.map(slot => 
                slot.time === `Slot ${newBooking.slotNumber}` 
                  ? { ...slot, available: false, clientId: newBooking.clientId }
                  : slot
              ),
              hasAvailability: day.slots.some(slot => 
                slot.time !== `Slot ${newBooking.slotNumber}` && slot.available
              )
            }
          }
          return day
        })
      })
      
      return { previousSchedule, queryKey }
    },
    onError: (err, newBooking, context) => {
      // Rollback optimistic update
      if (context?.previousSchedule) {
        queryClient.setQueryData(context.queryKey, context.previousSchedule)
      }
      
      toast.error('Booking Failed', {
        description: err.message || 'Failed to book appointment. Please try again.',
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.schedule.department(variables.departmentId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.appointments.byClient(variables.clientId) 
      })
      
      toast.success('Booking Successful! 🎉', {
        description: 'Your appointment has been booked successfully.',
        duration: 5000,
      })
    },
  })
}

export const useCancelAppointment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: cancelAppointment,
    onMutate: async (cancelData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.schedule.department(cancelData.departmentId) 
      })
      
      // Get current schedule data
      const currentWeekOffset = 0 // You may need to pass this as parameter
      const queryKey = queryKeys.schedule.department(cancelData.departmentId, currentWeekOffset)
      const previousSchedule = queryClient.getQueryData(queryKey)
      
      // Optimistically update the schedule
      queryClient.setQueryData(queryKey, (old: DaySchedule[] | undefined) => {
        if (!old) return old
        
        return old.map(day => {
          if (day.fullDate === cancelData.date) {
            return {
              ...day,
              slots: day.slots.map(slot => 
                slot.time === `Slot ${cancelData.slotNumber}` 
                  ? { ...slot, available: true, clientId: undefined, clientXNumber: undefined }
                  : slot
              ),
              hasAvailability: true
            }
          }
          return day
        })
      })
      
      return { previousSchedule, queryKey }
    },
    onError: (err, cancelData, context) => {
      // Rollback optimistic update
      if (context?.previousSchedule) {
        queryClient.setQueryData(context.queryKey, context.previousSchedule)
      }
      
      toast.error('Cancellation Failed', {
        description: err.message || 'Failed to cancel appointment. Please try again.',
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.schedule.department(variables.departmentId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.appointments.byClient(variables.clientId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboardStats.byClient(variables.clientId) 
      })
      
      toast.success('Appointment Cancelled! ✅', {
        description: 'Your appointment has been cancelled successfully.',
        duration: 4000,
      })
    },
  })
}

// Dashboard Stats Hook
export const useDashboardStats = (clientId: number | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.dashboardStats.byClient(clientId!),
    queryFn: () => fetchDashboardStats(clientId!),
    enabled: enabled && !!clientId,
    staleTime: 30 * 1000, // 30 seconds - stats update frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refresh every minute for real-time stats
    refetchIntervalInBackground: true,
  })
}

// Staff Dashboard Stats Hook
export const useStaffDashboardStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.dashboardStats.forStaff(),
    queryFn: fetchStaffDashboardStats,
    enabled,
    staleTime: 30 * 1000, // 30 seconds - stats update frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refresh every minute for real-time stats
    refetchIntervalInBackground: true,
  })
}

// Unified Dashboard Stats Hook (handles both client and staff)
export const useUnifiedDashboardStats = (
  userRole: 'client' | 'staff' | 'receptionist' | 'admin',
  userId?: number,
  enabled: boolean = true
) => {
  const isClient = userRole === 'client'
  
  const clientStats = useDashboardStats(
    isClient ? userId : undefined, 
    enabled && isClient
  )
  
  const staffStats = useStaffDashboardStats(
    enabled && !isClient
  )
  
  return isClient ? clientStats : staffStats
}

// Paginated Appointments Hook
export const useClientAppointmentsPaginated = (
  clientId: number | undefined,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: queryKeys.appointments.byClientPaginated(clientId!, page, limit),
    queryFn: () => fetchClientAppointmentsPaginated(clientId!, page, limit),
    enabled: enabled && !!clientId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous page data while loading next page
  })
}

// Desktop Appointments List Hook (with filters)
export const useAppointmentsList = (
  filters: AppointmentFilters,
  page: number = 1,
  limit: number = 20,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: queryKeys.appointments.list(filters, page, limit),
    queryFn: () => fetchAppointmentsList(filters, page, limit),
    enabled,
    staleTime: 30 * 1000, // 30 seconds - appointments change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Smooth pagination experience
    refetchInterval: 60 * 1000, // Background refresh every minute
    refetchIntervalInBackground: true,
  })
}

// Doctors Hook
export const useDoctors = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.doctors,
    queryFn: fetchDoctors,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - doctors don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Calendar Appointments Hook (with real-time updates)
export const useCalendarAppointments = (
  userRole: string,
  userId: number | undefined,
  startDate: string,
  endDate: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: queryKeys.calendar.appointments(userRole, userId, startDate, endDate),
    queryFn: () => fetchCalendarAppointments(userRole, userId, startDate, endDate),
    enabled,
    staleTime: 30 * 1000, // 30 seconds - calendar data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Background refresh every 30 seconds for real-time calendar
    refetchIntervalInBackground: true,
  })
}

// Calendar Endpoint Hook (cached for session)
export const useCalendarEndpoint = (
  userRole: string,
  userId: number | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: queryKeys.calendar.endpoint(userRole, userId),
    queryFn: () => fetchCalendarEndpoint(userRole, userId),
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour - endpoint rarely changes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  })
}

// Combined Calendar Data Hook (departments + doctors + appointments)
export const useCalendarData = (
  userRole: string,
  userId: number | undefined,
  view: 'month' | 'week' | 'day',
  currentDate: Date,
  enabled: boolean = true
) => {
  // Calculate date range based on view
  const { startDate, endDate } = useMemo(() => {
    if (view === 'month') {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      return {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
      }
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0],
      }
    } else {
      // day view
      const dateStr = currentDate.toISOString().split('T')[0]
      return { startDate: dateStr, endDate: dateStr }
    }
  }, [view, currentDate])

  // Fetch departments (cached)
  const departmentsQuery = useDepartments(enabled)
  
  // Fetch doctors (cached)
  const doctorsQuery = useDoctors(enabled)
  
  // Fetch appointments (real-time)
  const appointmentsQuery = useCalendarAppointments(
    userRole,
    userId,
    startDate,
    endDate,
    enabled
  )

  return {
    departments: departmentsQuery.data || [],
    doctors: doctorsQuery.data || [],
    appointments: appointmentsQuery.data || [],
    isLoading: departmentsQuery.isLoading || doctorsQuery.isLoading || appointmentsQuery.isLoading,
    error: departmentsQuery.error || doctorsQuery.error || appointmentsQuery.error,
    isRefetching: departmentsQuery.isRefetching || doctorsQuery.isRefetching || appointmentsQuery.isRefetching,
    // Refetch function to manually refresh all calendar data
    refetch: async () => {
      await Promise.all([
        departmentsQuery.refetch(),
        doctorsQuery.refetch(),
        appointmentsQuery.refetch(),
      ])
    }
  }
}

// Delete Appointment Hook
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteAppointment,
    onMutate: async (appointmentId) => {
      // Cancel outgoing refetches for appointments list queries
      await queryClient.cancelQueries({ 
        queryKey: ['appointments', 'list'],
      })
      
      // Get all current appointments list queries
      const queryCache = queryClient.getQueryCache()
      const appointmentQueries = queryCache.findAll({ queryKey: ['appointments', 'list'] })
      const previousQueries: Array<{ queryKey: any; data: any }> = []
      
      // Optimistically remove appointment from all list queries
      appointmentQueries.forEach((query) => {
        const queryKey = query.queryKey
        const previousData = queryClient.getQueryData(queryKey)
        
        if (previousData) {
          previousQueries.push({ queryKey, data: previousData })
          
          queryClient.setQueryData(queryKey, (old: PaginatedDesktopAppointments | undefined) => {
            if (!old) return old
            
            return {
              ...old,
              data: old.data.filter(apt => apt.id !== appointmentId),
              pagination: {
                ...old.pagination,
                totalCount: old.pagination.totalCount - 1,
              }
            }
          })
        }
      })
      
      return { previousQueries }
    },
    onError: (err, appointmentId, context) => {
      // Rollback optimistic updates
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      toast.error('Delete Failed', {
        description: err.message || 'Failed to delete appointment. Please try again.',
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch appointments list queries
      queryClient.invalidateQueries({ 
        queryKey: ['appointments', 'list'],
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboardStats.forStaff(),
      })
      
      toast.success('Appointment Deleted! ✅', {
        description: 'The appointment has been successfully deleted.',
        duration: 4000,
      })
    },
  })
}

// ==========================================
// 📋 CLIENTS MANAGEMENT HOOKS
// ==========================================

interface ClientDetailed {
  id: number
  xNumber: string
  name: string
  phone: string
  category: string
  joinDate: string
  totalAppointments: number
  lastAppointment?: string
  status: 'active' | 'inactive'
  emergencyContact?: string
  address?: string
  medicalNotes?: string
}

interface ClientsQueryParams {
  search?: string
  category?: string
  status?: string
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface ClientsResponse {
  data: ClientDetailed[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasMore: boolean
  }
}

// Fetch Clients with Pagination and Filters (for management page)
const fetchClientsManagement = async (params: ClientsQueryParams): Promise<ClientsResponse> => {
  const queryParams = new URLSearchParams()
  if (params.search) queryParams.append('search', params.search)
  if (params.category && params.category !== 'all') queryParams.append('category', params.category)
  if (params.status && params.status !== 'all') queryParams.append('status', params.status)
  queryParams.append('page', params.page.toString())
  queryParams.append('limit', params.limit.toString())
  queryParams.append('sortBy', params.sortBy)
  queryParams.append('sortOrder', params.sortOrder)

  const response = await fetch(`/api/clients/stats?${queryParams.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch clients')
  }

  return response.json()
}

// useClientsManagement Hook - Main query hook with pagination and filters (Management Page)
export const useClientsManagement = (params: ClientsQueryParams) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['clients', 'list', params],
    queryFn: () => fetchClientsManagement(params),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Show previous data while loading
  })

  // Prefetch next page for instant navigation
  if (query.data && params.page < query.data.pagination.totalPages) {
    queryClient.prefetchQuery({
      queryKey: ['clients', 'list', { ...params, page: params.page + 1 }],
      queryFn: () => fetchClientsManagement({ ...params, page: params.page + 1 }),
    })
  }

  return query
}

// Add Client Mutation
const addClient = async (clientData: Partial<ClientDetailed>) => {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add client')
  }

  return response.json()
}

export const useAddClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addClient,
    onSuccess: () => {
      // Invalidate all clients list queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['clients', 'list'] })

      toast.success('Client Added! ✅', {
        description: 'The client has been successfully added.',
        duration: 4000,
      })
    },
    onError: (err: Error) => {
      toast.error('Add Failed', {
        description: err.message || 'Failed to add client. Please try again.',
      })
    },
  })
}

// Update Client Mutation
const updateClient = async ({ id, data }: { id: number; data: Partial<ClientDetailed> }) => {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update client')
  }

  return response.json()
}

export const useUpdateClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateClient,
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['clients', 'list'] })

      // Snapshot previous data
      const queryCache = queryClient.getQueryCache()
      const clientQueries = queryCache.findAll({ queryKey: ['clients', 'list'] })
      const previousQueries: Array<{ queryKey: any; data: any }> = []

      // Optimistically update all client list queries
      clientQueries.forEach((query) => {
        const data = query.state.data as ClientsResponse | undefined
        if (data) {
          previousQueries.push({ queryKey: query.queryKey, data })

          const updatedData = {
            ...data,
            data: data.data.map((client) =>
              client.id === id ? { ...client, ...data } : client
            ),
          }
          queryClient.setQueryData(query.queryKey, updatedData)
        }
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      toast.error('Update Failed', {
        description: err.message || 'Failed to update client. Please try again.',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', 'list'] })

      toast.success('Client Updated! ✅', {
        description: 'The client has been successfully updated.',
        duration: 4000,
      })
    },
  })
}

// Delete Client Mutation
const deleteClient = async (id: number) => {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete client')
  }

  return response.json()
}

export const useDeleteClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteClient,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['clients', 'list'] })

      // Snapshot previous data
      const queryCache = queryClient.getQueryCache()
      const clientQueries = queryCache.findAll({ queryKey: ['clients', 'list'] })
      const previousQueries: Array<{ queryKey: any; data: any }> = []

      // Optimistically remove from all client list queries
      clientQueries.forEach((query) => {
        const data = query.state.data as ClientsResponse | undefined
        if (data) {
          previousQueries.push({ queryKey: query.queryKey, data })

          const updatedData = {
            ...data,
            data: data.data.filter((client) => client.id !== id),
          }
          queryClient.setQueryData(query.queryKey, updatedData)
        }
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      toast.error('Delete Failed', {
        description: err.message || 'Failed to delete client. Please try again.',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', 'list'] })

      toast.success('Client Deleted! ✅', {
        description: 'The client has been successfully deleted.',
        duration: 4000,
      })
    },
  })
}

// ==========================================
// 📅 APPOINTMENTS LIST MANAGEMENT HOOKS
// ==========================================

interface AppointmentDetailed {
  id: number
  clientId: number
  clientName: string
  clientXNumber: string
  doctorId: number
  doctorName: string
  departmentId: number
  departmentName: string
  date: string
  slotNumber: number
  status: string
  statusColor: string
  notes?: string
  phone: string
  category: string
}

interface AppointmentsListQueryParams {
  search?: string
  status?: string
  dateFilter?: string
  page: number
  limit: number
}

interface AppointmentsListResponse {
  data: AppointmentDetailed[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasMore: boolean
  }
}

// Fetch Appointments List with Pagination and Filters (Management Page)
const fetchAppointmentsListManagement = async (params: AppointmentsListQueryParams): Promise<AppointmentsListResponse> => {
  const queryParams = new URLSearchParams()
  if (params.search) queryParams.append('search', params.search)
  if (params.status && params.status !== 'all') queryParams.append('status', params.status)
  if (params.dateFilter && params.dateFilter !== 'all') queryParams.append('dateFilter', params.dateFilter)
  queryParams.append('page', params.page.toString())
  queryParams.append('limit', params.limit.toString())

  const response = await fetch(`/api/appointments/list?${queryParams.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch appointments')
  }

  return response.json()
}

// useAppointmentsListManagement Hook - Main query hook with pagination and filters (Management Page)
export const useAppointmentsListManagement = (params: AppointmentsListQueryParams) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['appointments', 'list', params],
    queryFn: () => fetchAppointmentsListManagement(params),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Show previous data while loading
  })

  // Prefetch next page for instant navigation
  if (query.data && params.page < query.data.pagination.totalPages) {
    queryClient.prefetchQuery({
      queryKey: ['appointments', 'list', { ...params, page: params.page + 1 }],
      queryFn: () => fetchAppointmentsListManagement({ ...params, page: params.page + 1 }),
    })
  }

  return query
}

// Update Appointment Status Mutation
const updateAppointmentStatus = async ({ id, status }: { id: number; status: string }) => {
  const response = await fetch(`/api/appointments/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update appointment status')
  }

  return response.json()
}

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAppointmentStatus,
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['appointments', 'list'] })

      // Snapshot previous data
      const queryCache = queryClient.getQueryCache()
      const appointmentQueries = queryCache.findAll({ queryKey: ['appointments', 'list'] })
      const previousQueries: Array<{ queryKey: any; data: any }> = []

      // Optimistically update all appointment list queries
      appointmentQueries.forEach((query) => {
        const data = query.state.data as AppointmentsListResponse | undefined
        if (data) {
          previousQueries.push({ queryKey: query.queryKey, data })

          const updatedData = {
            ...data,
            data: data.data.map((apt) =>
              apt.id === id ? { ...apt, status } : apt
            ),
          }
          queryClient.setQueryData(query.queryKey, updatedData)
        }
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      toast.error('Update Failed', {
        description: err.message || 'Failed to update appointment. Please try again.',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'list'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.forStaff() })

      toast.success('Appointment Updated! ✅', {
        description: 'The appointment status has been updated.',
        duration: 4000,
      })
    },
  })
}

// ==========================================
// 👥 USERS MANAGEMENT HOOKS
// ==========================================

interface User {
  id: number
  name: string
  phone: string
  role: 'receptionist' | 'admin'
  employee_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserFormData {
  name: string
  phone: string
  role: 'receptionist' | 'admin'
  employee_id: string
  password?: string
}

interface UsersResponse {
  users: User[]
}

// Fetch Users
const fetchUsers = async (search?: string): Promise<UsersResponse> => {
  const url = search
    ? `/api/users?search=${encodeURIComponent(search)}`
    : '/api/users'

  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch users')
  }

  return response.json()
}

// useUsers Hook - Main query hook with search
export const useUsers = (searchTerm: string = '') => {
  return useQuery({
    queryKey: ['users', 'list', searchTerm],
    queryFn: () => fetchUsers(searchTerm),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Show previous data while searching
  })
}

// Add User Mutation
const addUser = async (userData: UserFormData) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create user')
  }

  return response.json()
}

export const useAddUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addUser,
    onSuccess: () => {
      // Invalidate all users queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })

      toast.success('User Created! ✅', {
        description: 'The user account has been successfully created.',
        duration: 4000,
      })
    },
    onError: (err: Error) => {
      toast.error('Creation Failed', {
        description: err.message || 'Failed to create user. Please try again.',
      })
    },
  })
}

// Update User Mutation
const updateUser = async ({ id, data }: { id: number; data: UserFormData }) => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update user')
  }

  return response.json()
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users', 'list'] })

      // Snapshot previous data
      const queryCache = queryClient.getQueryCache()
      const userQueries = queryCache.findAll({ queryKey: ['users', 'list'] })
      const previousQueries: Array<{ queryKey: any; data: any }> = []

      // Optimistically update all user list queries
      userQueries.forEach((query) => {
        const queryData = query.state.data as UsersResponse | undefined
        if (queryData) {
          previousQueries.push({ queryKey: query.queryKey, data: queryData })

          const updatedData = {
            ...queryData,
            users: queryData.users.map((user) =>
              user.id === id ? { ...user, ...data } : user
            ),
          }
          queryClient.setQueryData(query.queryKey, updatedData)
        }
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      toast.error('Update Failed', {
        description: err.message || 'Failed to update user. Please try again.',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })

      toast.success('User Updated! ✅', {
        description: 'The user account has been successfully updated.',
        duration: 4000,
      })
    },
  })
}

// Toggle User Active Status Mutation
const toggleUserActive = async (id: number) => {
  const response = await fetch(`/api/users/${id}/toggle-active`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to toggle user status')
  }

  return response.json()
}

export const useToggleUserActive = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleUserActive,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users', 'list'] })

      // Snapshot previous data
      const queryCache = queryClient.getQueryCache()
      const userQueries = queryCache.findAll({ queryKey: ['users', 'list'] })
      const previousQueries: Array<{ queryKey: any; data: any }> = []

      // Optimistically toggle active status in all user list queries
      userQueries.forEach((query) => {
        const queryData = query.state.data as UsersResponse | undefined
        if (queryData) {
          previousQueries.push({ queryKey: query.queryKey, data: queryData })

          const updatedData = {
            ...queryData,
            users: queryData.users.map((user) =>
              user.id === id ? { ...user, is_active: !user.is_active } : user
            ),
          }
          queryClient.setQueryData(query.queryKey, updatedData)
        }
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      toast.error('Toggle Failed', {
        description: err.message || 'Failed to toggle user status. Please try again.',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })

      toast.success('Status Updated! ✅', {
        description: 'User status has been successfully toggled.',
        duration: 4000,
      })
    },
  })
}

// Delete User Mutation
const deleteUser = async ({ id, cascade }: { id: number; cascade: boolean }) => {
  const url = cascade ? `/api/users/${id}?cascade=true` : `/api/users/${id}`

  const response = await fetch(url, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete user')
  }

  return response.json()
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users', 'list'] })

      // Snapshot previous data
      const queryCache = queryClient.getQueryCache()
      const userQueries = queryCache.findAll({ queryKey: ['users', 'list'] })
      const previousQueries: Array<{ queryKey: any; data: any }> = []

      // Optimistically remove from all user list queries
      userQueries.forEach((query) => {
        const queryData = query.state.data as UsersResponse | undefined
        if (queryData) {
          previousQueries.push({ queryKey: query.queryKey, data: queryData })

          const updatedData = {
            ...queryData,
            users: queryData.users.filter((user) => user.id !== id),
          }
          queryClient.setQueryData(query.queryKey, updatedData)
        }
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      toast.error('Delete Failed', {
        description: err.message || 'Failed to delete user. Please try again.',
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })

      toast.success('User Deleted! ✅', {
        description: data.message || 'The user has been successfully deleted.',
        duration: 4000,
      })
    },
  })
}

// ==========================================
// 🏥 DEPARTMENTS & DOCTORS MANAGEMENT HOOKS
// ==========================================

interface DepartmentDetailed {
  id: number
  name: string
  description: string
  slots_per_day: number
  working_days: string[]
  working_hours: { start: string; end: string }
  color: string
  is_active: boolean
}

interface DepartmentFormData {
  name: string
  description: string
  slots_per_day: number
  working_days: string[]
  working_hours: { start: string; end: string }
  color: string
}

interface DoctorDetailed {
  id: number
  name: string
  department_id: number
  department_name?: string
}

interface DoctorFormData {
  name: string
  department_id: number
}

// Fetch All Departments (for management page)
const fetchAllDepartments = async (): Promise<DepartmentDetailed[]> => {
  const response = await fetch('/api/departments')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch departments')
  }

  const data = await response.json()
  return data.success ? data.data : []
}

// useAllDepartments Hook - For management page (not booking)
export const useAllDepartments = () => {
  return useQuery({
    queryKey: ['departments', 'all'],
    queryFn: fetchAllDepartments,
    staleTime: 60 * 1000, // 1 minute - departments don't change often
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Fetch All Doctors
const fetchAllDoctors = async (): Promise<DoctorDetailed[]> => {
  const response = await fetch('/api/doctors')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch doctors')
  }

  const data = await response.json()
  return data.success ? data.data : []
}

// useAllDoctors Hook
export const useAllDoctors = () => {
  return useQuery({
    queryKey: ['doctors', 'all'],
    queryFn: fetchAllDoctors,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Add Department Mutation
const addDepartment = async (deptData: DepartmentFormData) => {
  const response = await fetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deptData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create department')
  }

  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Failed to create department')
  return data
}

export const useAddDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addDepartment,
    onSuccess: () => {
      // Invalidate both management and booking department queries
      queryClient.invalidateQueries({ queryKey: ['departments'] })

      toast.success('Department Created! ✅', {
        description: 'The department has been successfully created.',
        duration: 4000,
      })
    },
    onError: (err: Error) => {
      toast.error('Creation Failed', {
        description: err.message || 'Failed to create department. Please try again.',
      })
    },
  })
}

// Update Department Mutation
const updateDepartment = async ({ id, data }: { id: number; data: DepartmentFormData }) => {
  const response = await fetch(`/api/departments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update department')
  }

  const result = await response.json()
  if (!result.success) throw new Error(result.error || 'Failed to update department')
  return result
}

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDepartment,
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['departments', 'all'] })

      // Snapshot previous data
      const previousDepartments = queryClient.getQueryData(['departments', 'all'])

      // Optimistically update
      queryClient.setQueryData(['departments', 'all'], (old: DepartmentDetailed[] | undefined) => {
        if (!old) return old
        return old.map((dept) =>
          dept.id === id ? { ...dept, ...data } : dept
        )
      })

      return { previousDepartments }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousDepartments) {
        queryClient.setQueryData(['departments', 'all'], context.previousDepartments)
      }

      toast.error('Update Failed', {
        description: err.message || 'Failed to update department. Please try again.',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })

      toast.success('Department Updated! ✅', {
        description: 'The department has been successfully updated.',
        duration: 4000,
      })
    },
  })
}

// Delete Department Mutation
const deleteDepartment = async (id: number) => {
  const response = await fetch(`/api/departments/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete department')
  }

  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Failed to delete department')
  return data
}

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDepartment,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['departments', 'all'] })

      // Snapshot previous data
      const previousDepartments = queryClient.getQueryData(['departments', 'all'])

      // Optimistically remove from list
      queryClient.setQueryData(['departments', 'all'], (old: DepartmentDetailed[] | undefined) => {
        if (!old) return old
        return old.filter((dept) => dept.id !== id)
      })

      return { previousDepartments }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousDepartments) {
        queryClient.setQueryData(['departments', 'all'], context.previousDepartments)
      }

      toast.error('Delete Failed', {
        description: err.message || 'Failed to delete department. Please try again.',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })

      toast.success('Department Deleted! ✅', {
        description: 'The department has been successfully deleted.',
        duration: 4000,
      })
    },
  })
}

// Add Doctor Mutation
const addDoctor = async (doctorData: DoctorFormData) => {
  const response = await fetch('/api/doctors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctorData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add doctor')
  }

  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Failed to add doctor')
  return data
}

export const useAddDoctor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addDoctor,
    onSuccess: () => {
      // Invalidate doctors queries
      queryClient.invalidateQueries({ queryKey: ['doctors'] })

      toast.success('Doctor Added! ✅', {
        description: 'The doctor has been successfully added.',
        duration: 4000,
      })
    },
    onError: (err: Error) => {
      toast.error('Add Failed', {
        description: err.message || 'Failed to add doctor. Please try again.',
      })
    },
  })
}