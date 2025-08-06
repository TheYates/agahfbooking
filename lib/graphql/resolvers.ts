import {
  AppointmentService,
  DepartmentService,
  DoctorService,
  ClientService,
  UserService,
} from "@/lib/db-services";
import { query } from "@/lib/db";

// Add missing method to AppointmentService
declare module "@/lib/db-services" {
  namespace AppointmentService {
    function getByClientAndDateRange(
      clientId: number,
      startDate: string,
      endDate: string
    ): Promise<any[]>;
  }
}

export const resolvers = {
  Query: {
    // Calendar data - The main GraphQL benefit!
    calendarData: async (
      _: any,
      args: {
        userRole: string;
        currentUserId: string;
        view: string;
        date: string;
        includeStats?: boolean;
      }
    ) => {
      const { userRole, currentUserId, view, date, includeStats } = args;

      // Calculate date range based on view
      const targetDate = new Date(date);
      let startDate: string, endDate: string;

      if (view === "MONTH") {
        const startOfMonth = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          1
        );
        const endOfMonth = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth() + 1,
          0
        );
        startDate = startOfMonth.toISOString().split("T")[0];
        endDate = endOfMonth.toISOString().split("T")[0];
      } else if (view === "WEEK") {
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        startDate = startOfWeek.toISOString().split("T")[0];
        endDate = endOfWeek.toISOString().split("T")[0];
      } else {
        startDate = endDate = targetDate.toISOString().split("T")[0];
      }

      // Fetch data in parallel
      const [appointments, departments, doctors, stats] = await Promise.all([
        // Appointments based on user role
        userRole === "CLIENT"
          ? AppointmentService.getByClientAndDateRange(
              parseInt(currentUserId),
              startDate,
              endDate
            )
          : AppointmentService.getByDateRange(startDate, endDate),

        // Departments
        DepartmentService.getAll(),

        // Doctors
        DoctorService.getAll(),

        // Stats (optional)
        includeStats
          ? resolvers.Query.dashboardStats(_, {
              clientId: userRole === "CLIENT" ? currentUserId : undefined,
            })
          : null,
      ]);

      return {
        appointments,
        departments,
        doctors,
        stats,
      };
    },

    // Dashboard stats with optimized single query
    dashboardStats: async (_: any, args: { clientId?: string }) => {
      const { clientId } = args;
      const today = new Date().toISOString().split("T")[0];

      if (clientId) {
        // Client stats - use our optimized query from the API
        const result = await query(
          `
          WITH appointment_stats AS (
            SELECT 
              COUNT(*) FILTER (WHERE appointment_date >= $2 AND status NOT IN ('cancelled', 'completed', 'no_show')) as upcoming_count,
              COUNT(*) FILTER (WHERE DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', $2::date)) as total_month_count,
              COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
              MIN(appointment_date) FILTER (WHERE appointment_date >= $2 AND status NOT IN ('cancelled', 'completed', 'no_show')) as next_appointment_date
            FROM appointments 
            WHERE client_id = $1
          ),
          recent_appointments AS (
            SELECT
              a.id, a.appointment_date, a.slot_number, a.status,
              d.name as doctor_name, dept.name as department_name, dept.color as department_color,
              ROW_NUMBER() OVER (ORDER BY a.appointment_date DESC, a.slot_number DESC) as rn
            FROM appointments a
            JOIN departments dept ON a.department_id = dept.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE a.client_id = $1
          )
          SELECT 
            ast.upcoming_count, ast.total_month_count, ast.completed_count, ast.next_appointment_date,
            COALESCE(json_agg(
              json_build_object(
                'id', ra.id, 'date', ra.appointment_date, 'slotNumber', ra.slot_number,
                'status', ra.status, 'doctorName', ra.doctor_name,
                'departmentName', ra.department_name, 'departmentColor', ra.department_color
              ) ORDER BY ra.appointment_date DESC, ra.slot_number DESC
            ) FILTER (WHERE ra.rn <= 5), '[]'::json) as recent_appointments
          FROM appointment_stats ast
          LEFT JOIN recent_appointments ra ON ra.rn <= 5
          GROUP BY ast.upcoming_count, ast.total_month_count, ast.completed_count, ast.next_appointment_date
        `,
          [clientId, today]
        );

        const row = result.rows[0];
        return {
          upcomingAppointments: parseInt(row.upcoming_count || "0"),
          totalAppointments: parseInt(row.total_month_count || "0"),
          completedAppointments: parseInt(row.completed_count || "0"),
          availableSlots: 0, // Calculate separately if needed
          daysUntilNext: row.next_appointment_date
            ? Math.ceil(
                (new Date(row.next_appointment_date).getTime() -
                  new Date(today).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
          recentAppointments: row.recent_appointments || [],
        };
      } else {
        // Staff stats - system-wide
        const result = await query(
          `
          SELECT 
            COUNT(*) FILTER (WHERE DATE(appointment_date) = $1 AND status NOT IN ('cancelled')) as today_appointments,
            COUNT(*) FILTER (WHERE DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', $1::date)) as total_month,
            COUNT(*) FILTER (WHERE DATE(appointment_date) = $1 AND status = 'completed') as completed_today,
            COALESCE(SUM(dept.slots_per_day), 0) as total_slots
          FROM appointments a
          RIGHT JOIN departments dept ON a.department_id = dept.id AND DATE(a.appointment_date) = $1
          WHERE dept.is_active = true
        `,
          [today]
        );

        const row = result.rows[0];
        return {
          upcomingAppointments: parseInt(row.today_appointments || "0"),
          totalAppointments: parseInt(row.total_month || "0"),
          completedAppointments: parseInt(row.completed_today || "0"),
          availableSlots: Math.max(
            0,
            parseInt(row.total_slots || "0") -
              parseInt(row.today_appointments || "0")
          ),
          daysUntilNext: null,
          recentAppointments: [],
        };
      }
    },

    // Booking data - everything needed for booking form
    bookingData: async (_: any, args: { departmentId?: string }) => {
      const { departmentId } = args;

      if (!departmentId) {
        throw new Error("Department ID is required");
      }

      const [department, doctors] = await Promise.all([
        DepartmentService.findById(parseInt(departmentId)),
        DoctorService.getByDepartment(parseInt(departmentId)),
      ]);

      if (!department) {
        throw new Error("Department not found");
      }

      // Generate available dates for next 30 days
      const availableDates = [];
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = date.toLocaleDateString("en-US", {
          weekday: "lowercase",
        });

        if (department.working_days.includes(dayName)) {
          availableDates.push(date.toISOString().split("T")[0]);
        }
      }

      return {
        department,
        doctors,
        availableDates,
        workingHours: department.working_hours,
      };
    },

    // Individual entity queries
    departments: async () => {
      const departments = await DepartmentService.getAll();
      // Handle null values and provide defaults
      return departments.map((dept) => ({
        ...dept,
        color: dept.color || "#3B82F6",
        slotsPerDay: dept.slots_per_day || 10,
        workingDays: dept.working_days || [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
        ],
        workingHours: dept.working_hours || { start: "09:00", end: "17:00" },
        isActive: dept.is_active !== false, // Default to true if null
      }));
    },
    doctors: (_: any, args: { departmentId?: string }) =>
      args.departmentId
        ? DoctorService.getByDepartment(parseInt(args.departmentId))
        : DoctorService.getAll(),

    appointments: async (_: any, args: any) => {
      const { filter = {}, limit = 50, offset = 0 } = args;

      // Build dynamic query based on filters
      let whereConditions = ["1=1"];
      let queryParams: any[] = [];
      let paramCount = 0;

      if (filter.clientId) {
        paramCount++;
        whereConditions.push(`a.client_id = $${paramCount}`);
        queryParams.push(filter.clientId);
      }

      if (filter.departmentId) {
        paramCount++;
        whereConditions.push(`a.department_id = $${paramCount}`);
        queryParams.push(filter.departmentId);
      }

      if (filter.status) {
        paramCount++;
        whereConditions.push(`a.status = $${paramCount}`);
        queryParams.push(filter.status.toLowerCase());
      }

      if (filter.dateFrom) {
        paramCount++;
        whereConditions.push(`a.appointment_date >= $${paramCount}`);
        queryParams.push(filter.dateFrom);
      }

      if (filter.dateTo) {
        paramCount++;
        whereConditions.push(`a.appointment_date <= $${paramCount}`);
        queryParams.push(filter.dateTo);
      }

      // Add pagination
      queryParams.push(limit, offset);

      const appointmentsQuery = `
        SELECT a.*, c.name as client_name, c.x_number, 
               dept.name as department_name, dept.color as department_color,
               d.name as doctor_name
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN departments dept ON a.department_id = dept.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        WHERE ${whereConditions.join(" AND ")}
        ORDER BY a.appointment_date DESC, a.slot_number ASC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM appointments a
        WHERE ${whereConditions.join(" AND ")}
      `;

      const [appointmentsResult, countResult] = await Promise.all([
        query(appointmentsQuery, queryParams),
        query(countQuery, queryParams.slice(0, -2)), // Remove limit/offset for count
      ]);

      const totalCount = parseInt(countResult.rows[0]?.total || "0");
      const hasNextPage = offset + limit < totalCount;
      const hasPreviousPage = offset > 0;

      return {
        edges: appointmentsResult.rows.map((row: any, index: number) => ({
          node: {
            id: row.id,
            clientId: row.client_id,
            departmentId: row.department_id,
            doctorId: row.doctor_id,
            appointmentDate: row.appointment_date,
            slotNumber: row.slot_number,
            status: row.status.toUpperCase(),
            notes: row.notes,
            bookedBy: row.booked_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          },
          cursor: Buffer.from(`${offset + index}`).toString("base64"),
        })),
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor:
            appointmentsResult.rows.length > 0
              ? Buffer.from(`${offset}`).toString("base64")
              : null,
          endCursor:
            appointmentsResult.rows.length > 0
              ? Buffer.from(
                  `${offset + appointmentsResult.rows.length - 1}`
                ).toString("base64")
              : null,
        },
        totalCount,
      };
    },

    availableSlots: async (
      _: any,
      args: { departmentId: string; date: string }
    ) => {
      return AppointmentService.getAvailableSlots(
        parseInt(args.departmentId),
        args.date
      );
    },
  },

  Mutation: {
    createAppointment: async (_: any, args: { input: any }) => {
      const appointment = await AppointmentService.create({
        client_id: parseInt(args.input.clientId),
        department_id: parseInt(args.input.departmentId),
        doctor_id: args.input.doctorId
          ? parseInt(args.input.doctorId)
          : undefined,
        appointment_date: args.input.appointmentDate,
        slot_number: args.input.slotNumber,
        notes: args.input.notes,
        booked_by: 1, // TODO: Get from context
      });

      return appointment;
    },

    updateAppointment: async (_: any, args: { id: string; input: any }) => {
      const appointment = await AppointmentService.update(parseInt(args.id), {
        status: args.input.status?.toLowerCase(),
        notes: args.input.notes,
        appointment_date: args.input.appointmentDate,
        slot_number: args.input.slotNumber,
      });

      return appointment;
    },
  },
};

export default resolvers;
