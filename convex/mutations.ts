import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Convex Mutation Functions
 * Replaces PostgreSQL INSERT, UPDATE, DELETE queries
 */

// ============= USERS MUTATIONS =============

export const createUser = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    role: v.union(v.literal("receptionist"), v.literal("admin")),
    employee_id: v.optional(v.string()),
    password_hash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const userId = await ctx.db.insert("users", {
      name: args.name,
      phone: args.phone,
      role: args.role,
      employee_id: args.employee_id,
      password_hash: args.password_hash,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    return userId;
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    employee_id: v.optional(v.string()),
    password_hash: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updated_at: Date.now(),
    });

    return id;
  },
});

export const deleteUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const toggleUserActive = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.id, {
      is_active: !user.is_active,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

// ============= CLIENTS MUTATIONS =============

export const createClient = mutation({
  args: {
    x_number: v.string(),
    name: v.string(),
    phone: v.string(),
    category: v.string(),
    emergency_contact: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if x_number already exists
    const existing = await ctx.db
      .query("clients")
      .withIndex("by_x_number", (q) => q.eq("x_number", args.x_number))
      .first();

    if (existing) {
      throw new Error("Client with this X-number already exists");
    }

    const clientId = await ctx.db.insert("clients", {
      x_number: args.x_number,
      name: args.name,
      phone: args.phone,
      category: args.category,
      emergency_contact: args.emergency_contact,
      address: args.address,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    return clientId;
  },
});

export const updateClient = mutation({
  args: {
    id: v.id("clients"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    category: v.optional(v.string()),
    emergency_contact: v.optional(v.string()),
    address: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updated_at: Date.now(),
    });

    return id;
  },
});

export const deleteClient = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============= DEPARTMENTS MUTATIONS =============

export const createDepartment = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    slots_per_day: v.number(),
    working_days: v.array(v.string()),
    working_hours: v.object({
      start: v.string(),
      end: v.string(),
    }),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const departmentId = await ctx.db.insert("departments", {
      name: args.name,
      description: args.description,
      slots_per_day: args.slots_per_day,
      working_days: args.working_days,
      working_hours: args.working_hours,
      color: args.color,
      is_active: true,
      created_at: Date.now(),
    });

    return departmentId;
  },
});

export const updateDepartment = mutation({
  args: {
    id: v.id("departments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    slots_per_day: v.optional(v.number()),
    working_days: v.optional(v.array(v.string())),
    working_hours: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    })),
    color: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, updates);

    return id;
  },
});

export const deleteDepartment = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============= DOCTORS MUTATIONS =============

export const createDoctor = mutation({
  args: {
    name: v.string(),
    department_id: v.id("departments"),
  },
  handler: async (ctx, args) => {
    const doctorId = await ctx.db.insert("doctors", {
      name: args.name,
      department_id: args.department_id,
      is_active: true,
      created_at: Date.now(),
    });

    return doctorId;
  },
});

export const updateDoctor = mutation({
  args: {
    id: v.id("doctors"),
    name: v.optional(v.string()),
    department_id: v.optional(v.id("departments")),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, updates);

    return id;
  },
});

export const deleteDoctor = mutation({
  args: { id: v.id("doctors") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============= APPOINTMENTS MUTATIONS =============

export const createAppointment = mutation({
  args: {
    client_id: v.id("clients"),
    department_id: v.id("departments"),
    doctor_id: v.optional(v.id("doctors")),
    appointment_date: v.string(),
    slot_number: v.number(),
    notes: v.optional(v.string()),
    booked_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if slot is already booked
    const existing = await ctx.db
      .query("appointments")
      .withIndex("by_department_date_slot", (q) =>
        q
          .eq("department_id", args.department_id)
          .eq("appointment_date", args.appointment_date)
          .eq("slot_number", args.slot_number)
      )
      .first();

    if (existing && existing.status !== "cancelled") {
      throw new Error("This slot is already booked");
    }

    const appointmentId = await ctx.db.insert("appointments", {
      client_id: args.client_id,
      department_id: args.department_id,
      doctor_id: args.doctor_id,
      appointment_date: args.appointment_date,
      slot_number: args.slot_number,
      status: "booked",
      notes: args.notes,
      booked_by: args.booked_by,
      created_at: now,
      updated_at: now,
    });

    return appointmentId;
  },
});

export const updateAppointment = mutation({
  args: {
    id: v.id("appointments"),
    status: v.optional(
      v.union(
        v.literal("booked"),
        v.literal("arrived"),
        v.literal("waiting"),
        v.literal("completed"),
        v.literal("no_show"),
        v.literal("cancelled"),
        v.literal("rescheduled")
      )
    ),
    notes: v.optional(v.string()),
    doctor_id: v.optional(v.id("doctors")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updated_at: Date.now(),
    });

    return id;
  },
});

export const cancelAppointment = mutation({
  args: {
    id: v.id("appointments"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.id);
    if (!appointment) throw new Error("Appointment not found");

    await ctx.db.patch(args.id, {
      status: "cancelled",
      notes: args.reason ? `Cancelled: ${args.reason}` : "Cancelled",
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const rescheduleAppointment = mutation({
  args: {
    id: v.id("appointments"),
    new_date: v.string(),
    new_slot: v.number(),
  },
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.id);
    if (!appointment) throw new Error("Appointment not found");

    // Check if new slot is available
    const existing = await ctx.db
      .query("appointments")
      .withIndex("by_department_date_slot", (q) =>
        q
          .eq("department_id", appointment.department_id)
          .eq("appointment_date", args.new_date)
          .eq("slot_number", args.new_slot)
      )
      .first();

    if (existing && existing.status !== "cancelled") {
      throw new Error("This slot is already booked");
    }

    await ctx.db.patch(args.id, {
      appointment_date: args.new_date,
      slot_number: args.new_slot,
      status: "rescheduled",
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const deleteAppointment = mutation({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============= DEPARTMENT AVAILABILITY MUTATIONS =============

export const setDepartmentAvailability = mutation({
  args: {
    department_id: v.id("departments"),
    date: v.string(),
    available_slots: v.number(),
    is_available: v.boolean(),
    reason: v.optional(v.string()),
    created_by: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check if availability already exists
    const existing = await ctx.db
      .query("department_availability")
      .withIndex("by_department_and_date", (q) =>
        q.eq("department_id", args.department_id).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        available_slots: args.available_slots,
        is_available: args.is_available,
        reason: args.reason,
        created_by: args.created_by,
      });
      return existing._id;
    }

    const availabilityId = await ctx.db.insert("department_availability", {
      department_id: args.department_id,
      date: args.date,
      available_slots: args.available_slots,
      is_available: args.is_available,
      reason: args.reason,
      created_by: args.created_by,
      created_at: Date.now(),
    });

    return availabilityId;
  },
});

// ============= SYSTEM SETTINGS MUTATIONS =============

export const updateSystemSetting = mutation({
  args: {
    setting_key: v.string(),
    setting_value: v.string(),
    description: v.optional(v.string()),
    updated_by: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("system_settings")
      .withIndex("by_key", (q) => q.eq("setting_key", args.setting_key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        setting_value: args.setting_value,
        description: args.description,
        updated_by: args.updated_by,
        updated_at: Date.now(),
      });
      return existing._id;
    }

    const settingId = await ctx.db.insert("system_settings", {
      setting_key: args.setting_key,
      setting_value: args.setting_value,
      description: args.description,
      updated_by: args.updated_by,
      updated_at: Date.now(),
    });

    return settingId;
  },
});

// ============= APPOINTMENT STATUSES MUTATIONS =============

export const createAppointmentStatus = mutation({
  args: {
    status_name: v.string(),
    status_color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const statusId = await ctx.db.insert("appointment_statuses", {
      status_name: args.status_name,
      status_color: args.status_color,
      is_active: true,
      created_at: Date.now(),
    });

    return statusId;
  },
});

export const updateAppointmentStatus = mutation({
  args: {
    id: v.id("appointment_statuses"),
    status_name: v.optional(v.string()),
    status_color: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, updates);

    return id;
  },
});
