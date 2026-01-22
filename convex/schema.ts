import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  // Convex Auth tables (users, sessions, authAccounts, etc.)
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
    .index("by_phone", ["phone"])
    .index("by_name", ["name"]),
  
  // Clients (patients)
  clients: defineTable({
    x_number: v.string(),
    name: v.string(),
    phone: v.string(),
    category: v.string(),
    emergency_contact: v.optional(v.string()),
    address: v.optional(v.string()),
    is_active: v.boolean(),
    reliability_score: v.optional(v.number()),
    booking_restrictions: v.optional(v.any()),
    last_penalty_date: v.optional(v.string()),
  })
    .index("by_x_number", ["x_number"])
    .index("by_phone", ["phone"])
    .index("by_name", ["name"])
    .index("by_active", ["is_active"])
    .index("by_reliability_score", ["reliability_score"]),
  
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
    .index("by_name", ["name"])
    .index("by_active", ["is_active"]),
  
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
    checked_in_at: v.optional(v.number()),
    actual_arrival_time: v.optional(v.number()),
    cancellation_reason: v.optional(v.string()),
    cancelled_at: v.optional(v.number()),
    cancelled_by: v.optional(v.union(v.id("staff_users"), v.id("clients"))),
  })
    .index("by_date_department", ["appointment_date", "department_id"])
    .index("by_client", ["client_id"])
    .index("by_department_date_slot", ["department_id", "appointment_date", "slot_number"])
    .index("by_date_range", ["appointment_date"])
    .index("by_doctor", ["doctor_id"])
    .index("by_client_status", ["client_id", "status"])
    .index("by_date_status", ["appointment_date", "status"]),
  
  // Department availability overrides
  department_availability: defineTable({
    department_id: v.id("departments"),
    date: v.string(), // ISO date string
    available_slots: v.number(),
    is_available: v.boolean(),
    reason: v.optional(v.string()),
    created_by: v.optional(v.id("staff_users")),
  })
    .index("by_department_date", ["department_id", "date"])
    .index("by_date", ["date"]),
  
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
    applied_by: v.optional(v.id("staff_users")),
  })
    .index("by_client", ["client_id"])
    .index("by_client_active", ["client_id", "is_active"])
    .index("by_client_date", ["client_id", "penalty_date"]),
  
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
  
  // Abuse detection logs
  abuse_detection_logs: defineTable({
    client_id: v.id("clients"),
    detection_type: v.union(
      v.literal("rapid_booking"),
      v.literal("cross_dept_conflict"),
      v.literal("proxy_suspected")
    ),
    details: v.any(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    is_resolved: v.boolean(),
    resolved_by: v.optional(v.id("staff_users")),
    resolved_at: v.optional(v.number()),
  })
    .index("by_client", ["client_id"])
    .index("by_client_date", ["client_id", "_creationTime"])
    .index("by_severity", ["severity"]),
});

export default schema;
