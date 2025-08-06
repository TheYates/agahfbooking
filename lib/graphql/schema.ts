import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Date
  scalar JSON

  type User {
    id: ID!
    name: String!
    phone: String!
    role: UserRole!
    employeeId: String
    isActive: Boolean!
    createdAt: Date!
  }

  type Client {
    id: ID!
    xNumber: String!
    name: String!
    phone: String!
    category: String!
    isActive: Boolean!
    createdAt: Date!
    appointments(
      limit: Int = 10
      offset: Int = 0
      status: AppointmentStatus
      dateFrom: Date
      dateTo: Date
    ): AppointmentConnection!
  }

  type Department {
    id: ID!
    name: String!
    description: String
    color: String
    slotsPerDay: Int
    workingDays: [String!]
    workingHours: JSON
    isActive: Boolean!
    createdAt: Date!
    doctors: [Doctor!]!
    availableSlots(date: Date!): [Int!]!
    appointments(
      date: Date
      dateFrom: Date
      dateTo: Date
      limit: Int = 50
      offset: Int = 0
    ): AppointmentConnection!
  }

  type Doctor {
    id: ID!
    name: String!
    departmentId: ID!
    department: Department!
    isActive: Boolean!
    createdAt: Date!
    appointments(
      dateFrom: Date
      dateTo: Date
      limit: Int = 50
      offset: Int = 0
    ): AppointmentConnection!
  }

  type Appointment {
    id: ID!
    clientId: ID!
    client: Client!
    departmentId: ID!
    department: Department!
    doctorId: ID
    doctor: Doctor
    appointmentDate: Date!
    slotNumber: Int!
    status: AppointmentStatus!
    notes: String
    bookedBy: ID!
    bookedByUser: User!
    createdAt: Date!
    updatedAt: Date!
  }

  type AppointmentConnection {
    edges: [AppointmentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AppointmentEdge {
    node: Appointment!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type DashboardStats {
    upcomingAppointments: Int!
    totalAppointments: Int!
    completedAppointments: Int!
    availableSlots: Int!
    daysUntilNext: Int
    recentAppointments: [Appointment!]!
  }

  type CalendarData {
    appointments: [Appointment!]!
    departments: [Department!]!
    doctors: [Doctor!]!
    stats: DashboardStats
  }

  enum UserRole {
    CLIENT
    RECEPTIONIST
    ADMIN
  }

  enum AppointmentStatus {
    BOOKED
    CONFIRMED
    ARRIVED
    WAITING
    COMPLETED
    NO_SHOW
    CANCELLED
    RESCHEDULED
  }

  enum CalendarView {
    MONTH
    WEEK
    DAY
  }

  input AppointmentFilter {
    status: AppointmentStatus
    departmentId: ID
    doctorId: ID
    clientId: ID
    dateFrom: Date
    dateTo: Date
  }

  input CreateAppointmentInput {
    clientId: ID!
    departmentId: ID!
    doctorId: ID
    appointmentDate: Date!
    slotNumber: Int!
    notes: String
  }

  input UpdateAppointmentInput {
    status: AppointmentStatus
    notes: String
    appointmentDate: Date
    slotNumber: Int
  }

  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(limit: Int = 50, offset: Int = 0, search: String): [User!]!

    # Client queries
    client(id: ID!): Client
    clientByXNumber(xNumber: String!): Client
    clients(limit: Int = 50, offset: Int = 0, search: String): [Client!]!

    # Department queries
    department(id: ID!): Department
    departments(includeInactive: Boolean = false): [Department!]!
    departmentsWithAvailability(date: Date!): [Department!]!

    # Doctor queries
    doctor(id: ID!): Doctor
    doctors(departmentId: ID, includeInactive: Boolean = false): [Doctor!]!

    # Appointment queries
    appointment(id: ID!): Appointment
    appointments(
      filter: AppointmentFilter
      limit: Int = 50
      offset: Int = 0
      orderBy: String = "appointmentDate"
      orderDirection: String = "DESC"
    ): AppointmentConnection!

    # Dashboard queries
    dashboardStats(clientId: ID): DashboardStats!

    # Calendar queries - The main benefit of GraphQL!
    calendarData(
      userRole: UserRole!
      currentUserId: ID!
      view: CalendarView!
      date: Date!
      includeStats: Boolean = false
    ): CalendarData!

    # Booking queries
    availableSlots(departmentId: ID!, date: Date!): [Int!]!
    bookingData(departmentId: ID): BookingData!
  }

  type BookingData {
    department: Department!
    doctors: [Doctor!]!
    availableDates: [Date!]!
    workingHours: JSON!
  }

  type Mutation {
    # Appointment mutations
    createAppointment(input: CreateAppointmentInput!): Appointment!
    updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment!
    cancelAppointment(id: ID!, reason: String): Appointment!

    # Bulk operations
    bulkUpdateAppointments(
      ids: [ID!]!
      input: UpdateAppointmentInput!
    ): [Appointment!]!
  }

  type Subscription {
    # Real-time updates for calendar
    appointmentUpdated(departmentId: ID): Appointment!
    appointmentCreated(departmentId: ID): Appointment!
    appointmentCancelled(departmentId: ID): Appointment!
  }
`;

export default typeDefs;
