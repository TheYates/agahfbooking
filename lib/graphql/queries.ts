import { gql } from '@apollo/client';

// Calendar data query - replaces multiple API calls
export const GET_CALENDAR_DATA = gql`
  query GetCalendarData(
    $userRole: UserRole!
    $currentUserId: ID!
    $view: CalendarView!
    $date: Date!
    $includeStats: Boolean = false
  ) {
    calendarData(
      userRole: $userRole
      currentUserId: $currentUserId
      view: $view
      date: $date
      includeStats: $includeStats
    ) {
      appointments {
        id
        clientId
        client {
          id
          name
          xNumber
          phone
          category
        }
        departmentId
        department {
          id
          name
          color
        }
        doctorId
        doctor {
          id
          name
        }
        appointmentDate
        slotNumber
        status
        notes
        createdAt
      }
      departments {
        id
        name
        description
        color
        slotsPerDay
        workingDays
        workingHours
        isActive
      }
      doctors {
        id
        name
        departmentId
        department {
          id
          name
        }
        isActive
      }
      stats @include(if: $includeStats) {
        upcomingAppointments
        totalAppointments
        completedAppointments
        availableSlots
        daysUntilNext
        recentAppointments {
          id
          appointmentDate
          slotNumber
          status
          department {
            name
            color
          }
          doctor {
            name
          }
        }
      }
    }
  }
`;

// Dashboard stats query
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($clientId: ID) {
    dashboardStats(clientId: $clientId) {
      upcomingAppointments
      totalAppointments
      completedAppointments
      availableSlots
      daysUntilNext
      recentAppointments {
        id
        appointmentDate
        slotNumber
        status
        department {
          name
          color
        }
        doctor {
          name
        }
        client {
          name
          xNumber
        }
      }
    }
  }
`;

// Booking data query - everything needed for booking form
export const GET_BOOKING_DATA = gql`
  query GetBookingData($departmentId: ID!) {
    bookingData(departmentId: $departmentId) {
      department {
        id
        name
        description
        color
        slotsPerDay
        workingDays
        workingHours
      }
      doctors {
        id
        name
        departmentId
      }
      availableDates
      workingHours
    }
    availableSlots(departmentId: $departmentId, date: "2024-01-01") # Will be dynamic
  }
`;

// Appointments with pagination
export const GET_APPOINTMENTS = gql`
  query GetAppointments(
    $filter: AppointmentFilter
    $limit: Int = 20
    $offset: Int = 0
    $orderBy: String = "appointmentDate"
    $orderDirection: String = "DESC"
  ) {
    appointments(
      filter: $filter
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      edges {
        node {
          id
          clientId
          client {
            id
            name
            xNumber
            phone
            category
          }
          departmentId
          department {
            id
            name
            color
          }
          doctorId
          doctor {
            id
            name
          }
          appointmentDate
          slotNumber
          status
          notes
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

// Available slots for a specific date
export const GET_AVAILABLE_SLOTS = gql`
  query GetAvailableSlots($departmentId: ID!, $date: Date!) {
    availableSlots(departmentId: $departmentId, date: $date)
  }
`;

// Departments query
export const GET_DEPARTMENTS = gql`
  query GetDepartments($includeInactive: Boolean = false) {
    departments(includeInactive: $includeInactive) {
      id
      name
      description
      color
      slotsPerDay
      workingDays
      workingHours
      isActive
      createdAt
    }
  }
`;

// Doctors query
export const GET_DOCTORS = gql`
  query GetDoctors($departmentId: ID, $includeInactive: Boolean = false) {
    doctors(departmentId: $departmentId, includeInactive: $includeInactive) {
      id
      name
      departmentId
      department {
        id
        name
        color
      }
      isActive
      createdAt
    }
  }
`;

// Create appointment mutation
export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      id
      clientId
      client {
        id
        name
        xNumber
      }
      departmentId
      department {
        id
        name
        color
      }
      doctorId
      doctor {
        id
        name
      }
      appointmentDate
      slotNumber
      status
      notes
      createdAt
    }
  }
`;

// Update appointment mutation
export const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment($id: ID!, $input: UpdateAppointmentInput!) {
    updateAppointment(id: $id, input: $input) {
      id
      status
      notes
      appointmentDate
      slotNumber
      updatedAt
    }
  }
`;

// Bulk update appointments mutation
export const BULK_UPDATE_APPOINTMENTS = gql`
  mutation BulkUpdateAppointments($ids: [ID!]!, $input: UpdateAppointmentInput!) {
    bulkUpdateAppointments(ids: $ids, input: $input) {
      id
      status
      updatedAt
    }
  }
`;

export default {
  GET_CALENDAR_DATA,
  GET_DASHBOARD_STATS,
  GET_BOOKING_DATA,
  GET_APPOINTMENTS,
  GET_AVAILABLE_SLOTS,
  GET_DEPARTMENTS,
  GET_DOCTORS,
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT,
  BULK_UPDATE_APPOINTMENTS,
};
