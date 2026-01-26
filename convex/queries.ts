import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Convex Query Functions
 * Replaces PostgreSQL SELECT queries
 */

// ============= USERS QUERIES =============

export const getUsers = query({
  args: {
    role: v.optional(v.union(v.literal("receptionist"), v.literal("admin"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let users;

    if (args.role !== undefined) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .collect();
    } else {
      users = await ctx.db.query("users").collect();
    }

    if (args.isActive !== undefined) {
      return users.filter((user) => user.is_active === args.isActive);
    }

    return users;
  },
});

export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserByEmployeeId = query({
  args: { employee_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_employee_id", (q) => q.eq("employee_id", args.employee_id))
      .first();
  },
});

// ============= CLIENTS QUERIES =============

export const getClients = query({
  args: {
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let clients = await ctx.db.query("clients").collect();

    if (args.category) {
      clients = clients.filter((client) => client.category === args.category);
    }

    if (args.isActive !== undefined) {
      clients = clients.filter((client) => client.is_active === args.isActive);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      clients = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchLower) ||
          client.x_number.toLowerCase().includes(searchLower) ||
          client.phone.includes(searchLower)
      );
    }

    return clients;
  },
});

export const getClientById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getClientByXNumber = query({
  args: { x_number: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_x_number", (q) => q.eq("x_number", args.x_number))
      .first();
  },
});

export const getClientStats = query({
  args: {},
  handler: async (ctx, args) => {
    const clients = await ctx.db.query("clients").collect();
    const activeClients = clients.filter((c) => c.is_active);

    const categoryCounts = clients.reduce((acc, client) => {
      acc[client.category] = (acc[client.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: clients.length,
      active: activeClients.length,
      inactive: clients.length - activeClients.length,
      by_category: categoryCounts,
    };
  },
});

// ============= DEPARTMENTS QUERIES =============

export const getDepartments = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let departments = await ctx.db.query("departments").collect();

    if (args.isActive !== undefined) {
      departments = departments.filter((dept) => dept.is_active === args.isActive);
    }

    return departments;
  },
});

export const getDepartmentById = query({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getDepartmentWithStats = query({
  args: { id: v.id("departments"), date: v.string() },
  handler: async (ctx, args) => {
    const department = await ctx.db.get(args.id);
    if (!department) return null;

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_department_and_date", (q) =>
        q.eq("department_id", args.id).eq("appointment_date", args.date)
      )
      .collect();

    const availability = await ctx.db
      .query("department_availability")
      .withIndex("by_department_and_date", (q) =>
        q.eq("department_id", args.id).eq("date", args.date)
      )
      .first();

    return {
      ...department,
      total_appointments: appointments.length,
      available_slots: availability?.available_slots ?? department.slots_per_day,
      is_available: availability?.is_available ?? true,
    };
  },
});

// ============= DOCTORS QUERIES =============

export const getDoctors = query({
  args: {
    department_id: v.optional(v.id("departments")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let doctors;

    if (args.department_id) {
      doctors = await ctx.db
        .query("doctors")
        .withIndex("by_department", (q) =>
          q.eq("department_id", args.department_id!)
        )
        .collect();
    } else {
      doctors = await ctx.db.query("doctors").collect();
    }

    if (args.isActive !== undefined) {
      return doctors.filter((doctor) => doctor.is_active === args.isActive);
    }

    return doctors;
  },
});

export const getDoctorById = query({
  args: { id: v.id("doctors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ============= APPOINTMENTS QUERIES =============

export const getAppointments = query({
  args: {
    client_id: v.optional(v.id("clients")),
    department_id: v.optional(v.id("departments")),
    date: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    let appointments: Doc<"appointments">[] = [];

    if (args.client_id) {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_client", (q) => q.eq("client_id", args.client_id!))
        .collect();
    } else if (args.department_id && args.date) {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_department_and_date", (q) =>
          q.eq("department_id", args.department_id!).eq("appointment_date", args.date!)
        )
        .collect();
    } else if (args.date) {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_date", (q) => q.eq("appointment_date", args.date!))
        .collect();
    } else {
      appointments = await ctx.db.query("appointments").collect();
    }

    if (args.status) {
      appointments = appointments.filter((apt) => apt.status === args.status);
    }

    return appointments;
  },
});

export const getAppointmentById = query({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAppointmentsByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    department_id: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    let appointments = await ctx.db.query("appointments").collect();

    // Filter by date range
    appointments = appointments.filter(
      (apt) =>
        apt.appointment_date >= args.startDate &&
        apt.appointment_date <= args.endDate
    );

    // Filter by department if specified
    if (args.department_id) {
      appointments = appointments.filter(
        (apt) => apt.department_id === args.department_id
      );
    }

    // Enrich with related data
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        const [client, department, doctor] = await Promise.all([
          ctx.db.get(appointment.client_id),
          ctx.db.get(appointment.department_id),
          appointment.doctor_id ? ctx.db.get(appointment.doctor_id) : null,
        ]);

        return {
          ...appointment,
          id: appointment._id, // Add id for backward compatibility
          client_name: client?.name || "Unknown",
          client_x_number: client?.x_number || "N/A",
          client_phone: client?.phone || "",
          department_name: department?.name || "Unknown",
          department_color: department?.color || "#3B82F6",
          doctor_name: doctor?.name || null,
        };
      })
    );

    // Sort by date and slot number
    return enrichedAppointments.sort((a, b) => {
      const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
      if (dateCompare !== 0) return dateCompare;
      return a.slot_number - b.slot_number;
    });
  },
});

export const getAppointmentWithDetails = query({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.id);
    if (!appointment) return null;

    const [client, department, doctor, bookedBy] = await Promise.all([
      ctx.db.get(appointment.client_id),
      ctx.db.get(appointment.department_id),
      appointment.doctor_id ? ctx.db.get(appointment.doctor_id) : null,
      ctx.db.get(appointment.booked_by),
    ]);

    return {
      ...appointment,
      client,
      department,
      doctor,
      booked_by: bookedBy,
    };
  },
});

export const getAvailableSlots = query({
  args: {
    department_id: v.id("departments"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const department = await ctx.db.get(args.department_id);
    if (!department) return [];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_department_and_date", (q) =>
        q.eq("department_id", args.department_id).eq("appointment_date", args.date)
      )
      .collect();

    const bookedSlots = appointments
      .filter((apt) => apt.status !== "cancelled")
      .map((apt) => apt.slot_number);

    const totalSlots = department.slots_per_day;
    const availableSlots = Array.from({ length: totalSlots }, (_, i) => i + 1).filter(
      (slot) => !bookedSlots.includes(slot)
    );

    return availableSlots;
  },
});

// ============= DASHBOARD STATS =============

/**
 * Get dashboard statistics for a specific client
 * Replaces /api/dashboard/stats?clientId=X
 */
export const getClientDashboardStats = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Get first day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];

    // Get all appointments for this client
    const allAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_client", (q) => q.eq("client_id", args.clientId))
      .collect();

    // Filter appointments for current month
    const monthAppointments = allAppointments.filter(
      (apt) => apt.appointment_date >= firstDayStr
    );

    // Count upcoming appointments (from today onwards)
    const upcomingAppointments = allAppointments.filter(
      (apt) =>
        apt.appointment_date >= todayStr &&
        apt.status !== "cancelled" &&
        apt.status !== "completed" &&
        apt.status !== "no_show"
    );

    // Count completed appointments this month
    const completedAppointments = monthAppointments.filter(
      (apt) => apt.status === "completed"
    );

    // Find next appointment
    const nextAppointment = upcomingAppointments
      .sort((a, b) => {
        if (a.appointment_date === b.appointment_date) {
          return a.slot_number - b.slot_number;
        }
        return a.appointment_date.localeCompare(b.appointment_date);
      })[0];

    // Calculate days until next appointment
    let daysUntilNext = null;
    if (nextAppointment) {
      const nextDate = new Date(nextAppointment.appointment_date);
      daysUntilNext = Math.ceil(
        (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Get recent appointments (last 5)
    const recentAppointments = allAppointments
      .sort((a, b) => {
        if (a.appointment_date === b.appointment_date) {
          return b.slot_number - a.slot_number;
        }
        return b.appointment_date.localeCompare(a.appointment_date);
      })
      .slice(0, 5);

    // Fetch department and doctor details for recent appointments
    const recentWithDetails = await Promise.all(
      recentAppointments.map(async (apt) => {
        const [department, doctor] = await Promise.all([
          ctx.db.get(apt.department_id),
          apt.doctor_id ? ctx.db.get(apt.doctor_id) : null,
        ]);

        return {
          id: apt._id,
          date: apt.appointment_date,
          slotNumber: apt.slot_number,
          status: apt.status,
          doctorName: doctor?.name || "",
          departmentName: department?.name || "",
          departmentColor: department?.color || "#3B82F6",
        };
      })
    );

    // Calculate available slots for the week (rough estimate)
    // Get all active departments
    const departments = await ctx.db
      .query("departments")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    const totalSlotsPerDay = departments.reduce(
      (sum, dept) => sum + dept.slots_per_day,
      0
    );
    const availableSlots = totalSlotsPerDay * 5; // Rough estimate for 5 weekdays

    return {
      upcomingAppointments: upcomingAppointments.length,
      totalAppointments: monthAppointments.length,
      completedAppointments: completedAppointments.length,
      availableSlots,
      daysUntilNext,
      recentAppointments: recentWithDetails,
    };
  },
});

/**
 * Get dashboard statistics for staff users (system-wide stats)
 * Replaces /api/dashboard/staff-stats
 */
export const getStaffDashboardStats = query({
  args: {},
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Get first day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];

    // Get end of current week (7 days from now)
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

    // Get all appointments
    const allAppointments = await ctx.db.query("appointments").collect();

    // Filter for different time periods
    const todayAppointments = allAppointments.filter(
      (apt) => apt.appointment_date === todayStr
    );

    const weekAppointments = allAppointments.filter(
      (apt) =>
        apt.appointment_date >= todayStr &&
        apt.appointment_date <= endOfWeekStr &&
        apt.status !== "cancelled" &&
        apt.status !== "completed" &&
        apt.status !== "no_show"
    );

    const monthAppointments = allAppointments.filter(
      (apt) => apt.appointment_date >= firstDayStr
    );

    // Count completed today
    const completedToday = todayAppointments.filter(
      (apt) => apt.status === "completed"
    );

    // Get recent appointments (last 5 for today/upcoming)
    const recentAppointments = allAppointments
      .filter((apt) => apt.appointment_date >= todayStr)
      .sort((a, b) => {
        if (a.appointment_date === b.appointment_date) {
          return a.slot_number - b.slot_number;
        }
        return a.appointment_date.localeCompare(b.appointment_date);
      })
      .slice(0, 5);

    // Fetch details for recent appointments
    const recentWithDetails = await Promise.all(
      recentAppointments.map(async (apt) => {
        const [client, department, doctor] = await Promise.all([
          ctx.db.get(apt.client_id),
          ctx.db.get(apt.department_id),
          apt.doctor_id ? ctx.db.get(apt.doctor_id) : null,
        ]);

        return {
          id: apt._id,
          date: apt.appointment_date,
          slotNumber: apt.slot_number,
          status: apt.status,
          doctorName: doctor?.name || "",
          departmentName: department?.name || "",
          departmentColor: department?.color || "#3B82F6",
          clientName: client?.name || "",
          clientXNumber: client?.x_number || "",
        };
      })
    );

    // Calculate available slots for today
    const departments = await ctx.db
      .query("departments")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    const totalSlotsToday = departments.reduce(
      (sum, dept) => sum + dept.slots_per_day,
      0
    );
    const bookedToday = todayAppointments.filter(
      (apt) => apt.status !== "cancelled"
    ).length;
    const availableSlots = totalSlotsToday - bookedToday;

    return {
      upcomingAppointments: weekAppointments.length,
      totalAppointments: monthAppointments.length,
      completedAppointments: completedToday.length,
      availableSlots: Math.max(0, availableSlots),
      daysUntilNext: null,
      recentAppointments: recentWithDetails,
    };
  },
});

/**
 * Legacy function - keeping for backward compatibility
 */
export const getDashboardStats = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appointments = await ctx.db.query("appointments").collect();

    let filteredAppointments = appointments;
    if (args.startDate && args.endDate) {
      filteredAppointments = appointments.filter(
        (apt) => apt.appointment_date >= args.startDate! && apt.appointment_date <= args.endDate!
      );
    }

    const total = filteredAppointments.length;
    const byStatus = filteredAppointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const departments = await ctx.db.query("departments").collect();
    const clients = await ctx.db.query("clients").collect();

    return {
      total_appointments: total,
      appointments_by_status: byStatus,
      total_departments: departments.filter((d) => d.is_active).length,
      total_clients: clients.filter((c) => c.is_active).length,
      appointments: filteredAppointments,
    };
  },
});

// ============= SYSTEM SETTINGS QUERIES =============

export const getSystemSettings = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("system_settings").collect();
  },
});

export const getSystemSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("system_settings")
      .withIndex("by_key", (q) => q.eq("setting_key", args.key))
      .first();
  },
});

// ============= OTP QUERIES =============

export const getLatestOTP = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("otp_codes")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .order("desc")
      .first();
  },
});

// ============= SEARCH QUERIES =============

export const universalSearch = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm.toLowerCase();

    const [clients, departments, doctors] = await Promise.all([
      ctx.db.query("clients").collect(),
      ctx.db.query("departments").collect(),
      ctx.db.query("doctors").collect(),
    ]);

    const clientResults = clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.x_number.toLowerCase().includes(searchLower) ||
          c.phone.includes(searchLower)
      )
      .map((c) => ({ type: "client" as const, data: c }));

    const departmentResults = departments
      .filter((d) => d.name.toLowerCase().includes(searchLower))
      .map((d) => ({ type: "department" as const, data: d }));

    const doctorResults = doctors
      .filter((d) => d.name.toLowerCase().includes(searchLower))
      .map((d) => ({ type: "doctor" as const, data: d }));

    return [...clientResults, ...departmentResults, ...doctorResults];
  },
});

// ============= SCHEDULE QUERIES =============

/**
 * Get weekly schedule for a department (for quick booking dialog)
 * This matches the TanStack Query API format
 */
export const getScheduleForDepartment = query({
  args: {
    departmentId: v.id("departments"),
    startDate: v.string(), // ISO date string
  },
  handler: async (ctx, args) => {
    const department = await ctx.db.get(args.departmentId);
    if (!department) return [];

    const startDate = new Date(args.startDate);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Generate 7 days of schedule
    const schedule = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayName = dayNames[currentDate.getDay()];
      const dayOfWeekLower = dayName.toLowerCase();
      const isWorkingDay = department.working_days.includes(dayOfWeekLower);

      // Get appointments for this day
      const appointments = await ctx.db
        .query("appointments")
        .withIndex("by_department_and_date", (q) =>
          q.eq("department_id", args.departmentId).eq("appointment_date", dateStr)
        )
        .collect();

      // Filter out cancelled appointments
      const activeAppointments = appointments.filter(
        (apt) => apt.status !== "cancelled"
      );

      // Build slot information
      const slots = [];
      for (let slotNum = 1; slotNum <= department.slots_per_day; slotNum++) {
        const appointment = activeAppointments.find(
          (apt) => apt.slot_number === slotNum
        );

        if (!isWorkingDay) {
          slots.push({
            time: `Slot ${slotNum}`,
            available: false,
            isNonWorkingDay: true,
          });
        } else if (appointment) {
          // Get client info for the booked slot
          const client = await ctx.db.get(appointment.client_id);
          slots.push({
            time: `Slot ${slotNum}`,
            available: false,
            clientXNumber: client?.x_number || "",
            clientId: client?._id,
            appointmentId: appointment._id,
            isNonWorkingDay: false,
          });
        } else {
          slots.push({
            time: `Slot ${slotNum}`,
            available: true,
            isNonWorkingDay: false,
          });
        }
      }

      const hasAvailability = slots.some((slot) => slot.available);

      schedule.push({
        date: `${months[currentDate.getMonth()]} ${currentDate.getDate()}`,
        fullDate: dateStr,
        dayName,
        dayNumber: currentDate.getDate(),
        slots,
        hasAvailability,
        isWorkingDay,
      });
    }

    return schedule;
  },
});

// ============= CLIENT APPOINTMENTS QUERIES =============

export const getClientAppointments = query({
  args: { 
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 1000;
    const offset = args.offset || 0;

    // Get all appointments for the client
    const allAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_client", (q) => q.eq("client_id", args.clientId))
      .collect();

    // Sort by date descending, then by slot number
    const sortedAppointments = allAppointments.sort((a, b) => {
      const dateCompare = b.appointment_date.localeCompare(a.appointment_date);
      if (dateCompare !== 0) return dateCompare;
      return a.slot_number - b.slot_number;
    });

    // Apply pagination
    const paginatedAppointments = sortedAppointments.slice(offset, offset + limit);

    // Enrich with related data
    const enrichedAppointments = await Promise.all(
      paginatedAppointments.map(async (appointment) => {
        const [client, department, doctor] = await Promise.all([
          ctx.db.get(appointment.client_id),
          ctx.db.get(appointment.department_id),
          appointment.doctor_id ? ctx.db.get(appointment.doctor_id) : null,
        ]);

        return {
          ...appointment,
          clientName: client?.name || "Unknown",
          clientXNumber: client?.x_number || "N/A",
          departmentName: department?.name || "Unknown",
          departmentColor: department?.color || "#3B82F6",
          doctorName: doctor?.name || "Dr. Smith",
        };
      })
    );

    return {
      appointments: enrichedAppointments,
      total: allAppointments.length,
    };
  },
});

// ============= APPOINTMENT STATUSES QUERIES =============

export const getAppointmentStatuses = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let statuses = await ctx.db.query("appointment_statuses").collect();

    if (args.isActive !== undefined) {
      statuses = statuses.filter((status) => status.is_active === args.isActive);
    }

    return statuses;
  },
});

// ============= CALENDAR CONFIG QUERIES =============

export const getCalendarSettings = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("calendar_config").collect();
  },
});

