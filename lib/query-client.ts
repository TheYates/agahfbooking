import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Hospital data settings
      staleTime: 60 * 1000, // 1 minute default
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Query Keys Factory - Centralized query key management
export const queryKeys = {
  // Departments - rarely change, cache longer
  departments: ['departments'] as const,
  
  // Clients - medium cache, search-based
  clients: {
    all: ['clients'] as const,
    search: (searchTerm: string, userRole: string, userId?: number) => 
      ['clients', 'search', { searchTerm, userRole, userId }] as const,
    byId: (id: number) => ['clients', id] as const,
  },
  
  // Schedule data - frequently updated, shorter cache
  schedule: {
    all: ['schedule'] as const,
    department: (departmentId: number, weekOffset: number = 0) =>
      ['schedule', departmentId, weekOffset] as const,
  },
  
  // Appointments - real-time data
  appointments: {
    all: ['appointments'] as const,
    byClient: (clientId: number) => ['appointments', 'client', clientId] as const,
    byClientPaginated: (clientId: number, page: number, limit: number) => 
      ['appointments', 'client', clientId, 'page', page, limit] as const,
    byDepartment: (departmentId: number) => ['appointments', 'department', departmentId] as const,
    available: (departmentId: number, date: string) => 
      ['appointments', 'available', departmentId, date] as const,
    list: (filters: any, page: number, limit: number) =>
      ['appointments', 'list', filters, page, limit] as const,
  },

  // Dashboard stats
  dashboardStats: {
    byClient: (clientId: number) => ['dashboard', 'stats', 'client', clientId] as const,
    forStaff: () => ['dashboard', 'stats', 'staff'] as const,
  },
  
  // User-specific data
  user: {
    profile: (userId: number) => ['user', 'profile', userId] as const,
    permissions: (userId: number) => ['user', 'permissions', userId] as const,
  },

  // Calendar data - real-time scheduling
  calendar: {
    appointments: (userRole: string, userId: number | undefined, startDate: string, endDate: string) =>
      ['calendar', 'appointments', userRole, userId, startDate, endDate] as const,
    endpoint: (userRole: string, userId: number | undefined) =>
      ['calendar', 'endpoint', userRole, userId] as const,
  },

  // Doctors data  
  doctors: ['doctors'] as const,
}

// Prefetch commonly used data
export const prefetchHospitalData = async () => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.departments,
    queryFn: async () => {
      const response = await fetch('/api/departments')
      if (!response.ok) throw new Error('Failed to fetch departments')
      const data = await response.json()
      return data.success ? data.data : []
    },
    staleTime: 60 * 60 * 1000, // 1 hour - departments rarely change
  })
}