# Design Document: PostgreSQL to Convex Migration

## Overview

This design document outlines the technical approach for migrating the AGAHF Hospital Booking Application from PostgreSQL with Next.js API routes to Convex, a serverless database platform with built-in real-time capabilities. The migration will modernize the application architecture while preserving all existing functionality.

### Migration Goals

1. **Replace PostgreSQL with Convex** - Migrate all database tables, relationships, and queries to Convex's document-based model
2. **Replace better-auth with Convex Auth** - Implement authentication using Convex's built-in auth system
3. **Replace TanStack Query with Convex React hooks** - Simplify state management with Convex's reactive hooks
4. **Replace Next.js API routes with Convex functions** - Centralize backend logic in Convex queries, mutations, and actions
5. **Implement real-time subscriptions** - Replace polling with Convex's built-in real-time updates
6. **Preserve all business logic** - Maintain SMS integration, rate limiting, anti-abuse, and working schedules
7. **Ensure data integrity** - Migrate all existing data without loss

### Key Benefits

- **Real-time by default** - Automatic UI updates without polling or manual cache invalidation
- **Simplified architecture** - No need for separate API routes, GraphQL resolvers, or query client configuration
- **Type safety** - End-to-end TypeScript types from database to UI
- **Reduced complexity** - Convex handles caching, subscriptions, and optimistic updates automatically
- **Better developer experience** - Colocated backend functions with automatic deployment

## Architecture

### Current Architecture (PostgreSQL)

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Components + TanStack Query                   │   │
│  │  - useQuery for data fetching                        │   │
│  │  - useMutation for updates                           │   │
│  │  - Manual cache invalidation                         │   │
│  │  - Polling for real-time updates                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  REST Endpoints + GraphQL (Apollo Server)            │   │
│  │  - /api/appointments/*                               │   │
│  │  - /api/auth/*                                       │   │
│  │  - /api/graphql                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  lib/db-services.ts                                  │   │
│  │  lib/auth.ts (better-auth)                           │   │
│  │  lib/rate-limiter.ts                                 │   │
│  │  lib/anti-abuse.ts                                   │   │
│  │  lib/hubtel-service.ts                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tables: users, clients, departments, doctors,       │   │
│  │  appointments, system_settings, etc.                 │   │
│  │  - pg Pool connections                               │   │
│  │  - Manual query construction                         │   │
│  │  - Transaction management                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture (Convex)

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Components + Convex React Hooks               │   │
│  │  - useQuery for reactive data                        │   │
│  │  - useMutation for updates                           │   │
│  │  - Automatic cache management                        │   │
│  │  - Real-time subscriptions by default                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Convex Backend                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Convex Functions (convex/ directory)                │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Queries (read operations)                     │  │   │
│  │  │  - appointments.ts                             │  │   │
│  │  │  - clients.ts                                  │  │   │
│  │  │  - departments.ts                              │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Mutations (write operations)                  │  │   │
│  │  │  - bookAppointment.ts                          │  │   │
│  │  │  - updateAppointmentStatus.ts                  │  │   │
│  │  │  - createClient.ts                             │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Actions (external API calls)                  │  │   │
│  │  │  - sendOTP.ts (Hubtel SMS)                     │  │   │
│  │  │  - rateLimiting.ts                             │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Auth (Convex Auth)                            │  │   │
│  │  │  - auth.ts                                     │  │   │
│  │  │  - Password provider (staff)                   │  │   │
│  │  │  - OTP provider (clients)                      │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Convex Database (schema.ts)                         │   │
│  │  - Type-safe document collections                    │   │
│  │  - Automatic indexing                                │   │
│  │  - Built-in real-time subscriptions                  │   │
│  │  - ACID transactions                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Changes

1. **No API Routes** - Convex functions replace Next.js API routes and GraphQL resolvers
2. **No Query Client** - Convex React hooks replace TanStack Query
3. **No Connection Pool** - Convex manages database connections automatically
4. **No Manual Caching** - Convex handles caching and invalidation
5. **No Polling** - Real-time subscriptions replace polling
6. **Colocated Backend** - Backend functions live in `convex/` directory alongside frontend

## Components and Interfaces

### 1. Convex Schema Definition

The schema will be defined in `convex/schema.ts` using Convex's schema builder.


#### Schema Structure

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  // Convex Auth tables (users, sessions, etc.)
  ...authTables,
  
  // Staff users (receptionists, admins)
  staff_users: defineTable({
    name: v.string(),
    phone: v.string(),
    role: v.union(v.literal("receptionist"), v.literal("admin")),
    employee_id: v.optional(v.string()),
    password_hash: v.string(),
    is_active: v.boolean(),
  })
    .index("by_employee_id", ["employee_id"])
    .index("by_phone", ["phone"]),
  
  // Clients (patients)
  clients: defineTable({
    x_number: v.string(),
    name: v.string(),
    phone: v.string(),
    category: v.string(),
    emergency_contact: v.optional(v.string()),
    address: v.optional(v.string()),
    is_active: v.boolean(),
  })
    .index("by_x_number", ["x_number"])
    .index("by_phone", ["phone"])
    .index("by_name", ["name"]),
  
  // Departments
  departments: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    slots_per_day: v.number(),
    working_days: v.array(v.string()), // ["monday", "tuesday", ...]
    working_hours: v.object({
      start: v.string(), // "09:00"
      end: v.string(),   // "17:00"
    }),
    color: v.string(), // hex color
    is_active: v.boolean(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["is_active"]),
  
  // Doctors
  doctors: defineTable({
    name: v.string(),
    department_id: v.id("departments"),
    is_active: v.boolean(),
  })
    .index("by_department", ["department_id"])
    .index("by_name", ["name"]),
  
  // Appointments
  appointments: defineTable({
    client_id: v.id("clients"),
    department_id: v.id("departments"),
    doctor_id: v.optional(v.id("doctors")),
    appointment_date: v.string(), // ISO date string "YYYY-MM-DD"
    slot_number: v.number(),
    status: v.union(
      v.literal("booked"),
      v.literal("arrived"),
      v.literal("waiting"),
      v.literal("completed"),
      v.literal("no_show"),
      v.literal("cancelled"),
      v.literal("rescheduled")
    ),
    notes: v.optional(v.string()),
    booked_by: v.union(v.id("staff_users"), v.id("clients")),
    booked_by_type: v.union(v.literal("staff"), v.literal("client")),
  })
    .index("by_date_department", ["appointment_date", "department_id"])
    .index("by_client", ["client_id"])
    .index("by_department_date_slot", ["department_id", "appointment_date", "slot_number"])
    .index("by_date_range", ["appointment_date"]),
  
  // Department availability overrides
  department_availability: defineTable({
    department_id: v.id("departments"),
    date: v.string(), // ISO date string
    available_slots: v.number(),
    is_available: v.boolean(),
    reason: v.optional(v.string()),
    created_by: v.optional(v.id("staff_users")),
  })
    .index("by_department_date", ["department_id", "date"]),
  
  // System settings
  system_settings: defineTable({
    setting_key: v.string(),
    setting_value: v.string(),
    description: v.optional(v.string()),
    updated_by: v.optional(v.id("staff_users")),
  })
    .index("by_key", ["setting_key"]),
  
  // Client penalties (anti-abuse)
  client_penalties: defineTable({
    client_id: v.id("clients"),
    penalty_type: v.union(
      v.literal("no_show"),
      v.literal("late_cancel"),
      v.literal("multiple_booking"),
      v.literal("abuse_detected")
    ),
    penalty_date: v.string(), // ISO date string
    penalty_duration_days: v.number(),
    reason: v.optional(v.string()),
    is_active: v.boolean(),
  })
    .index("by_client", ["client_id"])
    .index("by_client_active", ["client_id", "is_active"]),
  
  // Rate limiting tracking
  rate_limit_attempts: defineTable({
    ip: v.string(),
    x_number: v.optional(v.string()),
    timestamp: v.number(),
    success: v.boolean(),
    user_agent: v.optional(v.string()),
  })
    .index("by_ip_timestamp", ["ip", "timestamp"])
    .index("by_x_number_timestamp", ["x_number", "timestamp"]),
});

export default schema;
```

### 2. Authentication System


#### Convex Auth Configuration

```typescript
// convex/auth.ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    // Password provider for staff users
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
});
```

#### Custom OTP Provider

```typescript
// convex/auth/otpProvider.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { HubtelService } from "./services/hubtel";
import { JWTOTPService } from "./services/jwtOtp";

// Generate and send OTP
export const sendOTP = mutation({
  args: { xNumber: v.string() },
  handler: async (ctx, { xNumber }) => {
    // Find client by X-number
    const client = await ctx.db
      .query("clients")
      .withIndex("by_x_number", (q) => q.eq("x_number", xNumber))
      .first();
    
    if (!client) {
      throw new Error("Client not found");
    }
    
    // Generate JWT-based OTP
    const otpResult = JWTOTPService.generateOTP(xNumber);
    
    // Send via Hubtel or mock service
    const smsResult = await HubtelService.sendOTP(
      client.phone,
      otpResult.otp,
      "AGAHF Hospital"
    );
    
    return {
      success: true,
      maskedPhone: client.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2"),
      token: otpResult.token,
      expiresAt: otpResult.expiresAt,
    };
  },
});

// Verify OTP and create session
export const verifyOTP = mutation({
  args: { token: v.string(), otp: v.string() },
  handler: async (ctx, { token, otp }) => {
    // Verify JWT OTP
    const verificationResult = JWTOTPService.verifyOTP(token, otp);
    
    if (!verificationResult.isValid) {
      throw new Error(verificationResult.error || "Invalid OTP");
    }
    
    // Find client
    const client = await ctx.db
      .query("clients")
      .withIndex("by_x_number", (q) => 
        q.eq("x_number", verificationResult.xNumber!)
      )
      .first();
    
    if (!client) {
      throw new Error("Client not found");
    }
    
    // Create Convex Auth session
    await ctx.auth.signIn("client", {
      clientId: client._id,
      xNumber: client.x_number,
      role: "client",
    });
    
    return {
      success: true,
      client: {
        id: client._id,
        xNumber: client.x_number,
        name: client.name,
      },
    };
  },
});
```

#### Staff Login

```typescript
// convex/auth/staffLogin.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import bcrypt from "bcryptjs";

export const staffLogin = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { username, password }) => {
    // Find staff user by employee_id or name
    const staffUser = await ctx.db
      .query("staff_users")
      .filter((q) =>
        q.or(
          q.eq(q.field("employee_id"), username),
          q.eq(q.field("name"), username)
        )
      )
      .first();
    
    if (!staffUser || !staffUser.is_active) {
      throw new Error("Invalid credentials");
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, staffUser.password_hash);
    
    if (!isValid) {
      throw new Error("Invalid credentials");
    }
    
    // Create Convex Auth session
    await ctx.auth.signIn("staff", {
      staffId: staffUser._id,
      role: staffUser.role,
      employeeId: staffUser.employee_id,
    });
    
    return {
      success: true,
      user: {
        id: staffUser._id,
        name: staffUser.name,
        role: staffUser.role,
      },
    };
  },
});
```

### 3. Query Functions (Read Operations)


#### Appointments Queries

```typescript
// convex/appointments.ts
import { v } from "convex/values";
import { query } from "./_generated/server";

// Get appointments by date range
export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_date_range")
      .filter((q) =>
        q.and(
          q.gte(q.field("appointment_date"), startDate),
          q.lte(q.field("appointment_date"), endDate)
        )
      )
      .collect();
    
    // Enrich with related data
    return await Promise.all(
      appointments.map(async (apt) => {
        const client = await ctx.db.get(apt.client_id);
        const department = await ctx.db.get(apt.department_id);
        const doctor = apt.doctor_id ? await ctx.db.get(apt.doctor_id) : null;
        
        return {
          ...apt,
          client_name: client?.name,
          client_x_number: client?.x_number,
          client_phone: client?.phone,
          department_name: department?.name,
          department_color: department?.color,
          doctor_name: doctor?.name,
        };
      })
    );
  },
});

// Get available slots for a department and date
export const getAvailableSlots = query({
  args: {
    departmentId: v.id("departments"),
    date: v.string(),
  },
  handler: async (ctx, { departmentId, date }) => {
    const department = await ctx.db.get(departmentId);
    
    if (!department) {
      throw new Error("Department not found");
    }
    
    // Check if date is a working day
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[dayOfWeek];
    
    if (!department.working_days.includes(dayName)) {
      return []; // Not a working day
    }
    
    // Get booked slots
    const bookedAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_date_department", (q) =>
        q.eq("appointment_date", date).eq("department_id", departmentId)
      )
      .filter((q) =>
        q.neq(q.field("status"), "cancelled")
      )
      .collect();
    
    const bookedSlots = bookedAppointments.map((apt) => apt.slot_number);
    
    // Check for availability overrides
    const override = await ctx.db
      .query("department_availability")
      .withIndex("by_department_date", (q) =>
        q.eq("department_id", departmentId).eq("date", date)
      )
      .first();
    
    const totalSlots = override?.available_slots ?? department.slots_per_day;
    const isAvailable = override?.is_available ?? true;
    
    if (!isAvailable) {
      return [];
    }
    
    // Calculate available slots
    const availableSlots = [];
    for (let i = 1; i <= totalSlots; i++) {
      if (!bookedSlots.includes(i)) {
        availableSlots.push(i);
      }
    }
    
    return availableSlots;
  },
});

// Get client appointments
export const getClientAppointments = query({
  args: {
    clientId: v.id("clients"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, { clientId, startDate, endDate }) => {
    let appointmentsQuery = ctx.db
      .query("appointments")
      .withIndex("by_client", (q) => q.eq("client_id", clientId));
    
    if (startDate && endDate) {
      appointmentsQuery = appointmentsQuery.filter((q) =>
        q.and(
          q.gte(q.field("appointment_date"), startDate),
          q.lte(q.field("appointment_date"), endDate)
        )
      );
    }
    
    const appointments = await appointmentsQuery.collect();
    
    // Enrich with department and doctor info
    return await Promise.all(
      appointments.map(async (apt) => {
        const department = await ctx.db.get(apt.department_id);
        const doctor = apt.doctor_id ? await ctx.db.get(apt.doctor_id) : null;
        
        return {
          ...apt,
          department_name: department?.name,
          department_color: department?.color,
          doctor_name: doctor?.name,
        };
      })
    );
  },
});
```

#### Clients Queries

```typescript
// convex/clients.ts
import { v } from "convex/values";
import { query } from "./_generated/server";

// Search clients
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const clients = await ctx.db
      .query("clients")
      .filter((q) =>
        q.and(
          q.eq(q.field("is_active"), true),
          q.or(
            q.eq(q.field("x_number"), searchTerm),
            q.eq(q.field("name"), searchTerm),
            q.eq(q.field("phone"), searchTerm)
          )
        )
      )
      .collect();
    
    return clients;
  },
});

// Get client by X-number
export const getByXNumber = query({
  args: { xNumber: v.string() },
  handler: async (ctx, { xNumber }) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_x_number", (q) => q.eq("x_number", xNumber))
      .first();
  },
});

// Get all clients
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("is_active"), true))
      .order("asc")
      .collect();
  },
});
```

### 4. Mutation Functions (Write Operations)


#### Appointment Mutations

```typescript
// convex/mutations/appointments.ts
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Book appointment
export const bookAppointment = mutation({
  args: {
    clientId: v.id("clients"),
    departmentId: v.id("departments"),
    doctorId: v.optional(v.id("doctors")),
    appointmentDate: v.string(),
    slotNumber: v.number(),
    notes: v.optional(v.string()),
    bookedBy: v.union(v.id("staff_users"), v.id("clients")),
    bookedByType: v.union(v.literal("staff"), v.literal("client")),
  },
  handler: async (ctx, args) => {
    // Check if slot is already booked
    const existingAppointment = await ctx.db
      .query("appointments")
      .withIndex("by_department_date_slot", (q) =>
        q
          .eq("department_id", args.departmentId)
          .eq("appointment_date", args.appointmentDate)
          .eq("slot_number", args.slotNumber)
      )
      .first();
    
    if (existingAppointment) {
      throw new Error("Time slot is already booked");
    }
    
    // Validate booking rules (anti-abuse)
    await validateBookingRules(ctx, args.clientId, args.departmentId, args.appointmentDate);
    
    // Create appointment
    const appointmentId = await ctx.db.insert("appointments", {
      client_id: args.clientId,
      department_id: args.departmentId,
      doctor_id: args.doctorId,
      appointment_date: args.appointmentDate,
      slot_number: args.slotNumber,
      status: "booked",
      notes: args.notes,
      booked_by: args.bookedBy,
      booked_by_type: args.bookedByType,
    });
    
    return appointmentId;
  },
});

// Update appointment status
export const updateStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.union(
      v.literal("booked"),
      v.literal("arrived"),
      v.literal("waiting"),
      v.literal("completed"),
      v.literal("no_show"),
      v.literal("cancelled"),
      v.literal("rescheduled")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { appointmentId, status, notes }) => {
    const appointment = await ctx.db.get(appointmentId);
    
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    
    // Apply penalties for no-shows
    if (status === "no_show") {
      await applyNoShowPenalty(ctx, appointment.client_id);
    }
    
    await ctx.db.patch(appointmentId, {
      status,
      ...(notes && { notes }),
    });
    
    return appointmentId;
  },
});

// Helper: Validate booking rules
async function validateBookingRules(
  ctx: any,
  clientId: string,
  departmentId: string,
  appointmentDate: string
) {
  // Check for active penalties
  const activePenalty = await ctx.db
    .query("client_penalties")
    .withIndex("by_client_active", (q) =>
      q.eq("client_id", clientId).eq("is_active", true)
    )
    .first();
  
  if (activePenalty) {
    const endDate = new Date(activePenalty.penalty_date);
    endDate.setDate(endDate.getDate() + activePenalty.penalty_duration_days);
    
    if (endDate > new Date()) {
      throw new Error(`Account restricted until ${endDate.toLocaleDateString()}`);
    }
  }
  
  // Check pending appointments limit
  const pendingAppointments = await ctx.db
    .query("appointments")
    .withIndex("by_client", (q) => q.eq("client_id", clientId))
    .filter((q) =>
      q.and(
        q.neq(q.field("status"), "cancelled"),
        q.neq(q.field("status"), "completed"),
        q.neq(q.field("status"), "no_show")
      )
    )
    .collect();
  
  if (pendingAppointments.length >= 2) {
    throw new Error("Maximum 2 pending appointments allowed");
  }
  
  // Check same-day appointments
  const sameDayAppointments = pendingAppointments.filter(
    (apt) => apt.appointment_date === appointmentDate
  );
  
  if (sameDayAppointments.length >= 1) {
    throw new Error("Maximum 1 appointment per day allowed");
  }
}

// Helper: Apply no-show penalty
async function applyNoShowPenalty(ctx: any, clientId: string) {
  // Count recent no-shows
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentNoShows = await ctx.db
    .query("client_penalties")
    .withIndex("by_client", (q) => q.eq("client_id", clientId))
    .filter((q) =>
      q.and(
        q.eq(q.field("penalty_type"), "no_show"),
        q.gte(q.field("penalty_date"), thirtyDaysAgo.toISOString().split("T")[0])
      )
    )
    .collect();
  
  // Escalate penalty based on offense count
  let penaltyDays = 3; // First offense
  if (recentNoShows.length === 1) penaltyDays = 7; // Second offense
  else if (recentNoShows.length === 2) penaltyDays = 14; // Third offense
  else if (recentNoShows.length >= 3) penaltyDays = 30; // Chronic offender
  
  await ctx.db.insert("client_penalties", {
    client_id: clientId,
    penalty_type: "no_show",
    penalty_date: new Date().toISOString().split("T")[0],
    penalty_duration_days: penaltyDays,
    reason: "Automatic no-show penalty",
    is_active: true,
  });
}
```

#### Client Mutations

```typescript
// convex/mutations/clients.ts
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Create client
export const create = mutation({
  args: {
    xNumber: v.string(),
    name: v.string(),
    phone: v.string(),
    category: v.string(),
    emergencyContact: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if X-number already exists
    const existing = await ctx.db
      .query("clients")
      .withIndex("by_x_number", (q) => q.eq("x_number", args.xNumber))
      .first();
    
    if (existing) {
      throw new Error("Client with this X-number already exists");
    }
    
    const clientId = await ctx.db.insert("clients", {
      x_number: args.xNumber,
      name: args.name,
      phone: args.phone,
      category: args.category,
      emergency_contact: args.emergencyContact,
      address: args.address,
      is_active: true,
    });
    
    return clientId;
  },
});

// Update client
export const update = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    category: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, { clientId, ...updates }) => {
    await ctx.db.patch(clientId, updates);
    return clientId;
  },
});
```

### 5. Action Functions (External API Calls)


#### SMS Service Action

```typescript
// convex/actions/sms.ts
import { v } from "convex/values";
import { action } from "../_generated/server";

// Send SMS via Hubtel
export const sendSMS = action({
  args: {
    to: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { to, message }) => {
    const clientId = process.env.HUBTEL_CLIENT_ID;
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
    const senderId = process.env.HUBTEL_SENDER_ID || "AGAHF";
    
    if (!clientId || !clientSecret) {
      console.warn("Hubtel not configured");
      return { success: false, error: "SMS service not configured" };
    }
    
    try {
      const formattedTo = to.startsWith("+") ? to : `+${to}`;
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      
      const response = await fetch("https://smsc.hubtel.com/v1/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          From: senderId,
          To: formattedTo,
          Content: message,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.status === 0) {
        return { success: true, messageId: result.messageId };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error("SMS sending failed:", error);
      return { success: false, error: "Failed to send SMS" };
    }
  },
});
```

#### Rate Limiting Action

```typescript
// convex/actions/rateLimiting.ts
import { v } from "convex/values";
import { action, mutation } from "../_generated/server";

// Check rate limit
export const checkRateLimit = action({
  args: {
    ip: v.string(),
    xNumber: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { ip, xNumber, userAgent }) => {
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;
    
    // Get recent attempts for this IP
    const recentAttempts = await ctx.runQuery("internal:rateLimiting.getRecentAttempts", {
      ip,
      since: fifteenMinutesAgo,
    });
    
    const failedAttempts = recentAttempts.filter((a: any) => !a.success);
    
    // Check limits
    const maxAttemptsPerIP = 10;
    const captchaThreshold = 3;
    const blockThreshold = 8;
    
    if (failedAttempts.length >= blockThreshold) {
      return {
        allowed: false,
        requiresCaptcha: true,
        reason: "Too many failed attempts. IP temporarily blocked.",
      };
    }
    
    if (failedAttempts.length >= maxAttemptsPerIP) {
      return {
        allowed: false,
        requiresCaptcha: true,
        reason: "Rate limit exceeded. Please try again later.",
      };
    }
    
    return {
      allowed: true,
      requiresCaptcha: failedAttempts.length >= captchaThreshold,
      remainingAttempts: maxAttemptsPerIP - failedAttempts.length,
    };
  },
});

// Record attempt
export const recordAttempt = mutation({
  args: {
    ip: v.string(),
    xNumber: v.optional(v.string()),
    success: v.boolean(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("rate_limit_attempts", {
      ip: args.ip,
      x_number: args.xNumber,
      timestamp: Date.now(),
      success: args.success,
      user_agent: args.userAgent,
    });
  },
});
```

## Data Models

### Document Structure

Convex uses a document-based model where each table stores JSON-like documents. Unlike PostgreSQL's relational model with foreign keys, Convex uses document IDs for relationships.

#### Key Differences from PostgreSQL

1. **No Foreign Key Constraints** - Relationships are maintained through document IDs, not enforced constraints
2. **No Joins** - Related data is fetched separately and composed in application code
3. **Automatic IDs** - Convex generates unique `_id` fields automatically
4. **Timestamps** - Convex adds `_creationTime` automatically; we track updates manually
5. **No NULL** - Use `v.optional()` for nullable fields

#### Example Document

```typescript
// PostgreSQL row
{
  id: 123,
  client_id: 456,
  department_id: 789,
  appointment_date: '2024-01-15',
  slot_number: 3,
  status: 'booked',
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-10T10:00:00Z'
}

// Convex document
{
  _id: "jd7x8k9m2n3p4q5r6s7t8u9v",
  _creationTime: 1704880800000,
  client_id: "ab1c2d3e4f5g6h7i8j9k0l1m",
  department_id: "xy9z8a7b6c5d4e3f2g1h0i9j",
  appointment_date: "2024-01-15",
  slot_number: 3,
  status: "booked",
  notes: undefined, // optional field
  booked_by: "st1a2f3f4u5s6e7r8i9d0x1y",
  booked_by_type: "staff"
}
```

### Relationship Patterns

#### One-to-Many (Department → Doctors)

```typescript
// Query all doctors in a department
const doctors = await ctx.db
  .query("doctors")
  .withIndex("by_department", (q) => q.eq("department_id", departmentId))
  .collect();
```

#### Many-to-One (Appointment → Client)

```typescript
// Get appointment with client details
const appointment = await ctx.db.get(appointmentId);
const client = await ctx.db.get(appointment.client_id);
```

#### Composite Indexes for Uniqueness

```typescript
// Ensure unique slot booking (department + date + slot)
.index("by_department_date_slot", ["department_id", "appointment_date", "slot_number"])

// Check before insert
const existing = await ctx.db
  .query("appointments")
  .withIndex("by_department_date_slot", (q) =>
    q.eq("department_id", deptId)
     .eq("appointment_date", date)
     .eq("slot_number", slot)
  )
  .first();
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

- **Rate limiting properties (9.2, 9.3, 9.4)** can be combined into a comprehensive rate limiting property
- **Real-time update properties (6.1, 6.2, 6.4, 6.5, 12.2, 12.5, 13.2, 13.5, 14.5)** are all testing the same subscription mechanism
- **CRUD operation properties (14.2, 15.2)** can be generalized to a single data integrity property
- **Slot availability properties (10.4, 16.2, 16.3)** overlap in testing booking constraints

### Core Properties

#### Property 1: Authentication Credential Validation
*For any* staff user with valid credentials (username and password), authentication should succeed and create a valid session with the correct role.

**Validates: Requirements 2.1, 2.3**

#### Property 2: OTP Generation and Verification Round Trip
*For any* valid X-number, generating an OTP then verifying it with the correct code should create a valid client session.

**Validates: Requirements 3.1, 3.3**

#### Property 3: OTP Expiration Enforcement
*For any* OTP token, if more than 10 minutes have elapsed since generation, verification should fail with an expiration error.

**Validates: Requirements 3.5**

#### Property 4: Rate Limiting Enforcement
*For any* IP address or X-number, when the number of failed login attempts exceeds the configured threshold within the time window, subsequent attempts should be blocked or require CAPTCHA.

**Validates: Requirements 3.6, 9.2, 9.3, 9.4**

#### Property 5: Transaction Atomicity for Appointment Booking
*For any* appointment booking operation, either all steps (slot validation, availability check, appointment creation) succeed together, or all fail together with no partial state.

**Validates: Requirements 4.3**

#### Property 6: Pagination Consistency
*For any* large dataset, paginating through all pages should return each item exactly once with no duplicates or omissions.

**Validates: Requirements 4.7, 19.4**

#### Property 7: Business Logic Preservation
*For any* input to a migrated function, the output should match the output from the original PostgreSQL-based function (same inputs produce same outputs).

**Validates: Requirements 5.3, 5.6**

#### Property 8: Error Handling Consistency
*For any* invalid input to a Convex function, the system should return a user-friendly error message without crashing or exposing internal details.

**Validates: Requirements 5.4, 18.3**

#### Property 9: SMS Message Format Consistency
*For any* OTP code and hospital name, the generated SMS message should contain the OTP, hospital name, expiration warning, and security notice.

**Validates: Requirements 8.2**

#### Property 10: SMS Failure Graceful Handling
*For any* SMS sending failure, the system should log the error, return an appropriate error response, and not block the authentication flow.

**Validates: Requirements 8.5**

#### Property 11: Client Reliability Scoring
*For any* client, their reliability score should be calculated correctly based on their appointment history: completed appointments increase score, no-shows and late cancellations decrease score.

**Validates: Requirements 9.6**

#### Property 12: Penalty Escalation
*For any* client with multiple no-shows, the penalty duration should escalate: first offense = 3 days, second = 7 days, third = 14 days, chronic = 30 days.

**Validates: Requirements 9.7**

#### Property 13: Working Day Validation
*For any* department and date, if the date's day of week is not in the department's working_days array, booking attempts should be rejected.

**Validates: Requirements 10.2**

#### Property 14: Availability Override Application
*For any* department and date with an availability override, the available slots should equal the override's available_slots value, not the department's default slots_per_day.

**Validates: Requirements 10.3**

#### Property 15: Available Slots Calculation
*For any* department and date, the number of available slots should equal total slots minus booked slots (excluding cancelled and no-show appointments).

**Validates: Requirements 10.4**

#### Property 16: Working Hours Enforcement
*For any* booking attempt, if the requested time falls outside the department's working_hours range, the booking should be rejected.

**Validates: Requirements 10.5**

#### Property 17: Data Migration Relationship Preservation
*For any* record with foreign key relationships in PostgreSQL, after migration to Convex, all document ID references should point to the correct related documents.

**Validates: Requirements 11.2**

#### Property 18: Data Migration Timestamp Preservation
*For any* record migrated from PostgreSQL, the _creationTime in Convex should match the created_at timestamp from PostgreSQL (within reasonable precision).

**Validates: Requirements 11.6**

#### Property 19: Department Utilization Calculation
*For any* department and date, utilization percentage should equal (booked slots / total slots) × 100, excluding cancelled and no-show appointments.

**Validates: Requirements 12.3**

#### Property 20: Calendar Filtering Accuracy
*For any* department and date range filter, the returned appointments should only include appointments for that department within the specified date range.

**Validates: Requirements 13.3**

#### Property 21: Client Appointment History Completeness
*For any* client, querying their appointment history should return all appointments where client_id matches, ordered by date.

**Validates: Requirements 14.4**

#### Property 22: Doctor-Department Relationship Integrity
*For any* doctor, their department_id should reference a valid, existing department document.

**Validates: Requirements 15.2**

#### Property 23: Double-Booking Prevention
*For any* department, date, and slot number, at most one active appointment (not cancelled or no-show) should exist.

**Validates: Requirements 16.2, 16.3**

#### Property 24: Appointment Status Workflow Validity
*For any* appointment status transition, the new status should be a valid next state according to the workflow rules (e.g., "booked" → "arrived" → "completed" is valid, but "completed" → "booked" is not).

**Validates: Requirements 16.4**

#### Property 25: Booking Rules Enforcement
*For any* booking attempt, all booking rules should be enforced: maximum pending appointments, maximum daily appointments, advance booking limits, and same-day restrictions.

**Validates: Requirements 16.6**

#### Property 26: Data Consistency During Migration
*For any* point during the migration process, the total count of records in PostgreSQL should equal the total count of successfully migrated records in Convex plus remaining records to migrate.

**Validates: Requirements 21.5**

## Error Handling

### Error Categories

1. **Validation Errors** - Invalid input data (e.g., missing required fields, invalid formats)
2. **Business Logic Errors** - Rule violations (e.g., double-booking, rate limit exceeded)
3. **Authentication Errors** - Invalid credentials, expired sessions, insufficient permissions
4. **External Service Errors** - SMS sending failures, network timeouts
5. **Data Integrity Errors** - Missing related documents, constraint violations

### Error Handling Strategy


#### Convex Function Error Handling

```typescript
// Example error handling pattern
export const bookAppointment = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    try {
      // Validation
      if (!args.clientId || !args.departmentId) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Client ID and Department ID are required",
        });
      }
      
      // Business logic checks
      const existingAppointment = await checkSlotAvailability(ctx, args);
      if (existingAppointment) {
        throw new ConvexError({
          code: "SLOT_UNAVAILABLE",
          message: "This time slot is already booked",
        });
      }
      
      // Perform operation
      const appointmentId = await ctx.db.insert("appointments", { /* ... */ });
      
      return { success: true, appointmentId };
      
    } catch (error) {
      // Log error with context
      console.error("Appointment booking failed:", {
        error,
        args,
        timestamp: new Date().toISOString(),
      });
      
      // Re-throw with user-friendly message
      if (error instanceof ConvexError) {
        throw error;
      }
      
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: "Failed to book appointment. Please try again.",
      });
    }
  },
});
```

#### Client-Side Error Handling

```typescript
// React component error handling
function BookAppointmentForm() {
  const bookAppointment = useMutation(api.appointments.bookAppointment);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (data: FormData) => {
    try {
      setError(null);
      await bookAppointment(data);
      toast.success("Appointment booked successfully!");
    } catch (err) {
      const convexError = err as ConvexError;
      
      // Display user-friendly error messages
      switch (convexError.code) {
        case "SLOT_UNAVAILABLE":
          setError("This time slot is no longer available. Please choose another.");
          break;
        case "RATE_LIMIT_EXCEEDED":
          setError("Too many booking attempts. Please try again later.");
          break;
        case "VALIDATION_ERROR":
          setError(convexError.message);
          break;
        default:
          setError("An unexpected error occurred. Please try again.");
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorAlert message={error} />}
      {/* Form fields */}
    </form>
  );
}
```

### Retry Logic

For transient failures (network issues, temporary service unavailability), implement exponential backoff:

```typescript
// Retry helper for actions
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryable = isTransientError(error);
      
      if (isLastAttempt || !isRetryable) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("Max retries exceeded");
}

function isTransientError(error: any): boolean {
  return (
    error.code === "NETWORK_ERROR" ||
    error.code === "TIMEOUT" ||
    error.code === "SERVICE_UNAVAILABLE"
  );
}
```

## Testing Strategy

### Dual Testing Approach

The migration requires both unit tests and property-based tests to ensure correctness:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Together, these provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Unit Testing

Unit tests focus on:
- Specific examples that demonstrate correct behavior
- Integration points between Convex functions
- Edge cases (empty inputs, boundary values)
- Error conditions (invalid data, missing references)

```typescript
// Example unit test
describe("bookAppointment", () => {
  it("should book an appointment with valid data", async () => {
    const result = await bookAppointment({
      clientId: "client123",
      departmentId: "dept456",
      appointmentDate: "2024-02-15",
      slotNumber: 3,
      bookedBy: "staff789",
      bookedByType: "staff",
    });
    
    expect(result.success).toBe(true);
    expect(result.appointmentId).toBeDefined();
  });
  
  it("should reject booking for already booked slot", async () => {
    // Book first appointment
    await bookAppointment({ /* ... */ });
    
    // Attempt to book same slot
    await expect(
      bookAppointment({ /* same slot */ })
    ).rejects.toThrow("already booked");
  });
  
  it("should reject booking on non-working day", async () => {
    await expect(
      bookAppointment({
        /* ... */
        appointmentDate: "2024-02-18", // Sunday
      })
    ).rejects.toThrow("not a working day");
  });
});
```

### Property-Based Testing

Property tests verify universal properties using generated test data. Each property test should:
- Run minimum 100 iterations
- Generate random valid inputs
- Verify the property holds for all inputs
- Reference the design document property

```typescript
// Example property test using fast-check
import fc from "fast-check";

describe("Property Tests", () => {
  it("Property 15: Available slots calculation", async () => {
    /**
     * Feature: postgres-to-convex-migration
     * Property 15: For any department and date, the number of available slots
     * should equal total slots minus booked slots (excluding cancelled and no-show).
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          departmentId: fc.string(),
          date: fc.date(),
          totalSlots: fc.integer({ min: 1, max: 20 }),
          bookedSlots: fc.array(fc.integer({ min: 1, max: 20 })),
        }),
        async ({ departmentId, date, totalSlots, bookedSlots }) => {
          // Setup: Create department with totalSlots
          await createDepartment({ id: departmentId, slotsPerDay: totalSlots });
          
          // Setup: Book the specified slots
          for (const slot of bookedSlots) {
            await bookAppointment({ departmentId, date, slotNumber: slot });
          }
          
          // Test: Get available slots
          const availableSlots = await getAvailableSlots(departmentId, date);
          
          // Verify: Available = Total - Booked
          const expectedAvailable = totalSlots - new Set(bookedSlots).size;
          expect(availableSlots.length).toBe(expectedAvailable);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it("Property 23: Double-booking prevention", async () => {
    /**
     * Feature: postgres-to-convex-migration
     * Property 23: For any department, date, and slot number, at most one
     * active appointment should exist.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          departmentId: fc.string(),
          date: fc.date(),
          slotNumber: fc.integer({ min: 1, max: 20 }),
          numAttempts: fc.integer({ min: 2, max: 10 }),
        }),
        async ({ departmentId, date, slotNumber, numAttempts }) => {
          // Test: Attempt to book the same slot multiple times concurrently
          const bookingPromises = Array.from({ length: numAttempts }, () =>
            bookAppointment({
              departmentId,
              date: date.toISOString().split("T")[0],
              slotNumber,
              clientId: generateRandomClientId(),
              bookedBy: generateRandomStaffId(),
              bookedByType: "staff",
            }).catch(() => null) // Catch expected failures
          );
          
          const results = await Promise.all(bookingPromises);
          const successfulBookings = results.filter(r => r !== null);
          
          // Verify: Only one booking succeeded
          expect(successfulBookings.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Property-Based Testing Configuration

- **Library**: fast-check (TypeScript/JavaScript property-based testing library)
- **Minimum iterations**: 100 per property test
- **Test tagging**: Each test must reference its design document property
- **Tag format**: `Feature: postgres-to-convex-migration, Property {number}: {property_text}`

### Integration Testing

Integration tests verify critical workflows end-to-end:

1. **Authentication Flow**: Staff login → Session creation → Authorized access
2. **OTP Flow**: Request OTP → Receive SMS → Verify OTP → Client session
3. **Booking Flow**: Search client → Check availability → Book appointment → Confirm booking
4. **Real-time Updates**: Create appointment → Verify subscription update → UI reflects change
5. **Migration Flow**: Export PostgreSQL data → Import to Convex → Validate integrity

### Migration Validation Testing

Specific tests for data migration accuracy:

```typescript
describe("Migration Validation", () => {
  it("should preserve all client records", async () => {
    const pgClients = await fetchAllClientsFromPostgreSQL();
    const convexClients = await fetchAllClientsFromConvex();
    
    expect(convexClients.length).toBe(pgClients.length);
    
    for (const pgClient of pgClients) {
      const convexClient = convexClients.find(
        c => c.x_number === pgClient.x_number
      );
      
      expect(convexClient).toBeDefined();
      expect(convexClient.name).toBe(pgClient.name);
      expect(convexClient.phone).toBe(pgClient.phone);
      expect(convexClient.category).toBe(pgClient.category);
    }
  });
  
  it("should preserve appointment relationships", async () => {
    const pgAppointments = await fetchAllAppointmentsFromPostgreSQL();
    
    for (const pgApt of pgAppointments) {
      const convexApt = await getConvexAppointmentByOriginalId(pgApt.id);
      
      // Verify client relationship
      const client = await getConvexClient(convexApt.client_id);
      expect(client.x_number).toBe(pgApt.client_x_number);
      
      // Verify department relationship
      const department = await getConvexDepartment(convexApt.department_id);
      expect(department.name).toBe(pgApt.department_name);
    }
  });
});
```

### Real-Time Subscription Testing

```typescript
describe("Real-Time Subscriptions", () => {
  it("should broadcast appointment creation to subscribers", async () => {
    const updates: any[] = [];
    
    // Subscribe to appointments
    const unsubscribe = subscribeToAppointments(
      { date: "2024-02-15" },
      (data) => updates.push(data)
    );
    
    // Create appointment
    await bookAppointment({
      /* ... */
      appointmentDate: "2024-02-15",
    });
    
    // Wait for subscription update
    await waitFor(() => updates.length > 0, { timeout: 2000 });
    
    // Verify update received
    expect(updates.length).toBeGreaterThan(0);
    expect(updates[0].appointment_date).toBe("2024-02-15");
    
    unsubscribe();
  });
});
```

## Migration Implementation Plan

### Phase 1: Setup and Schema (Week 1)

1. Install Convex and dependencies
2. Initialize Convex project
3. Define complete schema in `convex/schema.ts`
4. Set up Convex Auth with providers
5. Configure development environment

### Phase 2: Core Functions (Week 2-3)

1. Implement query functions for all tables
2. Implement mutation functions for CRUD operations
3. Implement action functions for external services (SMS, rate limiting)
4. Add authentication helpers and middleware
5. Write unit tests for all functions

### Phase 3: Frontend Migration (Week 4)

1. Replace TanStack Query with Convex React hooks
2. Update authentication flows (staff login, OTP)
3. Migrate calendar component to use Convex subscriptions
4. Migrate dashboard to use Convex queries
5. Update all forms to use Convex mutations

### Phase 4: Data Migration (Week 5)

1. Create migration scripts
2. Export all data from PostgreSQL
3. Transform data for Convex schema
4. Import data to Convex (staging environment)
5. Validate data integrity
6. Run migration validation tests

### Phase 5: Testing and Validation (Week 6)

1. Run full test suite (unit + property + integration)
2. Perform manual testing of critical workflows
3. Load testing and performance validation
4. Security audit of authentication and authorization
5. Fix any issues discovered

### Phase 6: Deployment (Week 7)

1. Deploy to staging environment
2. Run smoke tests in staging
3. Perform final data migration to production Convex
4. Deploy frontend changes to production
5. Monitor system health and performance
6. Keep PostgreSQL as backup for 1 week

### Rollback Plan

If critical issues arise:

1. **Immediate**: Revert frontend deployment to use PostgreSQL API routes
2. **Data**: PostgreSQL remains as source of truth during transition
3. **Gradual**: Can roll back individual features while keeping others on Convex
4. **Complete**: Full rollback possible within 1 hour by reverting deployments

### Success Criteria

- All 26 correctness properties pass property-based tests
- All unit tests pass (target: 100% of critical paths)
- All integration tests pass
- Data migration validation shows 100% accuracy
- Real-time subscriptions work without performance degradation
- Authentication flows work for both staff and clients
- No increase in error rates compared to PostgreSQL version
- Response times equal or better than PostgreSQL version
