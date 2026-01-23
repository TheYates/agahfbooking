import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Schema for AGAHF Booking System
 * Migrated from PostgreSQL schema
 */

export default defineSchema({
  // Users table (staff: receptionists, admins)
  users: defineTable({
    name: v.string(),
    phone: v.string(),
    role: v.union(v.literal("receptionist"), v.literal("admin")),
    employee_id: v.optional(v.string()),
    password_hash: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_employee_id", ["employee_id"])
    .index("by_phone", ["phone"])
    .index("by_role", ["role"])
    .index("by_active", ["is_active"]),

  // Clients table (separate from users)
  clients: defineTable({
    x_number: v.string(), // Format: X12345/67
    name: v.string(),
    phone: v.string(),
    category: v.string(), // PRIVATE CASH, PUBLIC SPONSORED(NHIA), STAFF, etc.
    emergency_contact: v.optional(v.string()),
    address: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_x_number", ["x_number"])
    .index("by_phone", ["phone"])
    .index("by_category", ["category"])
    .index("by_active", ["is_active"]),

  // Departments/Specializations table
  departments: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    is_active: v.boolean(),
    slots_per_day: v.number(),
    working_days: v.array(v.string()), // ["monday", "tuesday", etc.]
    working_hours: v.object({
      start: v.string(), // "09:00"
      end: v.string(), // "17:00"
    }),
    color: v.string(), // Hex color code
    created_at: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["is_active"]),

  // Doctors table (for reference/tracking purposes)
  doctors: defineTable({
    name: v.string(),
    department_id: v.id("departments"),
    is_active: v.boolean(),
    created_at: v.number(),
  })
    .index("by_department", ["department_id"])
    .index("by_active", ["is_active"]),

  // System settings table
  system_settings: defineTable({
    setting_key: v.string(),
    setting_value: v.string(),
    description: v.optional(v.string()),
    updated_by: v.optional(v.id("users")),
    updated_at: v.number(),
  }).index("by_key", ["setting_key"]),

  // Department availability table
  department_availability: defineTable({
    department_id: v.id("departments"),
    date: v.string(), // YYYY-MM-DD format
    available_slots: v.number(),
    is_available: v.boolean(),
    reason: v.optional(v.string()), // holiday, reduced capacity, etc.
    created_by: v.optional(v.id("users")),
    created_at: v.number(),
  })
    .index("by_department", ["department_id"])
    .index("by_date", ["date"])
    .index("by_department_and_date", ["department_id", "date"]),

  // Appointments table
  appointments: defineTable({
    client_id: v.id("clients"),
    department_id: v.id("departments"),
    doctor_id: v.optional(v.id("doctors")),
    appointment_date: v.string(), // YYYY-MM-DD format
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
    booked_by: v.id("users"),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_client", ["client_id"])
    .index("by_department", ["department_id"])
    .index("by_doctor", ["doctor_id"])
    .index("by_date", ["appointment_date"])
    .index("by_status", ["status"])
    .index("by_department_and_date", ["department_id", "appointment_date"])
    .index("by_department_date_slot", [
      "department_id",
      "appointment_date",
      "slot_number",
    ])
    .index("by_booked_by", ["booked_by"]),

  // Appointment status types (configurable by admin)
  appointment_statuses: defineTable({
    status_name: v.string(),
    status_color: v.optional(v.string()), // hex color code
    is_active: v.boolean(),
    created_at: v.number(),
  })
    .index("by_name", ["status_name"])
    .index("by_active", ["is_active"]),

  // OTP codes for authentication (JWT-based, stored temporarily)
  otp_codes: defineTable({
    identifier: v.string(), // phone or x_number
    otp_code: v.string(),
    expires_at: v.number(),
    is_used: v.boolean(),
    created_at: v.number(),
  })
    .index("by_identifier", ["identifier"])
    .index("by_expires_at", ["expires_at"]),

  // Anti-abuse tracking
  rate_limits: defineTable({
    identifier: v.string(), // IP address, phone number, or x_number
    action: v.string(), // "otp_request", "login_attempt", "booking_attempt"
    count: v.number(),
    window_start: v.number(),
    last_attempt: v.number(),
    is_blocked: v.boolean(),
    blocked_until: v.optional(v.number()),
  })
    .index("by_identifier", ["identifier"])
    .index("by_action", ["action"])
    .index("by_identifier_and_action", ["identifier", "action"])
    .index("by_blocked", ["is_blocked"]),

  // Calendar configuration (for custom calendar settings)
  calendar_config: defineTable({
    config_key: v.string(),
    config_value: v.string(),
    description: v.optional(v.string()),
    updated_by: v.optional(v.id("users")),
    updated_at: v.number(),
  }).index("by_key", ["config_key"]),

  // OTP configuration (for OTP settings)
  otp_config: defineTable({
    config_key: v.string(),
    config_value: v.string(),
    description: v.optional(v.string()),
    updated_by: v.optional(v.id("users")),
    updated_at: v.number(),
  }).index("by_key", ["config_key"]),
});
