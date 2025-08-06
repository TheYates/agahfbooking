import { query, getClient, queryWithClient } from "./db";
import {
  User,
  Client,
  Department,
  Doctor,
  Appointment,
  AppointmentWithDetails,
  DepartmentWithAvailability,
  DoctorWithDepartment,
  CreateUserInput,
  CreateClientInput,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  CreateDepartmentAvailabilityInput,
  CreateDepartmentInput,
  CreateDoctorInput,
  SystemSetting,
} from "./db-types";

// User Services (for staff: receptionists, admins)
export class UserService {
  static async findById(id: number): Promise<User | null> {
    const result = await query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  static async findByEmployeeId(employeeId: string): Promise<User | null> {
    const result = await query("SELECT * FROM users WHERE employee_id = $1", [
      employeeId,
    ]);
    return result.rows[0] || null;
  }

  static async create(userData: CreateUserInput): Promise<User> {
    const result = await query(
      `INSERT INTO users (name, phone, role, employee_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        userData.name,
        userData.phone,
        userData.role || "receptionist",
        userData.employee_id,
      ]
    );
    return result.rows[0];
  }

  static async getAll(): Promise<User[]> {
    const result = await query(
      `SELECT id, name, phone, role, employee_id, is_active, created_at, updated_at
       FROM users
       WHERE role IN ('receptionist', 'admin')
       ORDER BY role, name`
    );
    return result.rows;
  }

  static async search(searchTerm: string): Promise<User[]> {
    const result = await query(
      `SELECT id, name, phone, role, employee_id, is_active, created_at, updated_at
       FROM users
       WHERE role IN ('receptionist', 'admin')
       AND (name ILIKE $1 OR employee_id ILIKE $1 OR phone ILIKE $1)
       ORDER BY role, name`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }

  static async update(
    id: number,
    userData: Partial<CreateUserInput>
  ): Promise<User> {
    const setParts = [];
    const values = [];
    let paramCount = 1;

    if (userData.name) {
      setParts.push(`name = $${paramCount}`);
      values.push(userData.name);
      paramCount++;
    }

    if (userData.phone) {
      setParts.push(`phone = $${paramCount}`);
      values.push(userData.phone);
      paramCount++;
    }

    if (userData.role) {
      setParts.push(`role = $${paramCount}`);
      values.push(userData.role);
      paramCount++;
    }

    if (userData.employee_id) {
      setParts.push(`employee_id = $${paramCount}`);
      values.push(userData.employee_id);
      paramCount++;
    }

    setParts.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${setParts.join(
        ", "
      )} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async toggleActive(id: number): Promise<User> {
    const result = await query(
      `UPDATE users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  static async setPassword(id: number, passwordHash: string): Promise<void> {
    await query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [passwordHash, id]
    );
  }

  static async updateLastLogin(id: number): Promise<void> {
    await query(
      "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
  }

  static async delete(id: number): Promise<void> {
    await query("UPDATE users SET is_active = false WHERE id = $1", [id]);
  }

  static async checkUserAppointments(
    id: number
  ): Promise<{ count: number; hasAppointments: boolean }> {
    const result = await query(
      "SELECT COUNT(*) as count FROM appointments WHERE booked_by = $1",
      [id]
    );
    const count = parseInt(result.rows[0].count);
    return { count, hasAppointments: count > 0 };
  }

  static async permanentDelete(
    id: number,
    cascadeDelete: boolean = false
  ): Promise<void> {
    // Check if user has appointments
    const appointmentCheck = await this.checkUserAppointments(id);
    if (appointmentCheck.hasAppointments) {
      if (cascadeDelete) {
        // Delete all appointments associated with this user
        await query("DELETE FROM appointments WHERE booked_by = $1", [id]);
        console.log(
          `Deleted ${appointmentCheck.count} appointment(s) for user ${id}`
        );
      } else {
        throw new Error(
          `Cannot delete user: they have ${appointmentCheck.count} appointment(s) associated with them. Please reassign or cancel these appointments first.`
        );
      }
    }

    await query("DELETE FROM users WHERE id = $1", [id]);
  }

  static async reassignUserAppointments(
    fromUserId: number,
    toUserId: number
  ): Promise<number> {
    const result = await query(
      "UPDATE appointments SET booked_by = $1 WHERE booked_by = $2",
      [toUserId, fromUserId]
    );
    return result.rowCount || 0;
  }
}

// Client Services (for patients)
export class ClientService {
  static async findByXNumber(xNumber: string): Promise<Client | null> {
    const result = await query("SELECT * FROM clients WHERE x_number = $1", [
      xNumber,
    ]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<Client | null> {
    const result = await query("SELECT * FROM clients WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  static async getAll(): Promise<Client[]> {
    const result = await query(
      "SELECT * FROM clients WHERE is_active = true ORDER BY name"
    );
    return result.rows;
  }

  static async search(searchTerm: string): Promise<Client[]> {
    const result = await query(
      `SELECT * FROM clients
       WHERE is_active = true
       AND (name ILIKE $1 OR x_number ILIKE $1)
       ORDER BY name`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }

  static async create(clientData: CreateClientInput): Promise<Client> {
    const result = await query(
      `INSERT INTO clients (x_number, name, phone, category, emergency_contact, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        clientData.x_number,
        clientData.name,
        clientData.phone,
        clientData.category,
        clientData.emergency_contact,
        clientData.address,
      ]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    clientData: Partial<CreateClientInput>
  ): Promise<Client> {
    const setParts = [];
    const values = [];
    let paramCount = 1;

    if (clientData.name) {
      setParts.push(`name = $${paramCount}`);
      values.push(clientData.name);
      paramCount++;
    }

    if (clientData.phone) {
      setParts.push(`phone = $${paramCount}`);
      values.push(clientData.phone);
      paramCount++;
    }

    if (clientData.category) {
      setParts.push(`category = $${paramCount}`);
      values.push(clientData.category);
      paramCount++;
    }

    values.push(id);

    const result = await query(
      `UPDATE clients SET ${setParts.join(
        ", "
      )}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<void> {
    await query("UPDATE clients SET is_active = false WHERE id = $1", [id]);
  }
}

// Department Services
export class DepartmentService {
  static async getAll(): Promise<Department[]> {
    // Optimized: Add index hint and limit fields for faster retrieval
    const result = await query(
      `SELECT id, name, description, color, slots_per_day, working_days, working_hours, is_active, created_at
       FROM departments
       WHERE is_active = true
       ORDER BY name`
    );
    return result.rows;
  }

  static async findById(id: number): Promise<Department | null> {
    const result = await query("SELECT * FROM departments WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  static async getDepartmentsWithAvailability(
    date: string
  ): Promise<DepartmentWithAvailability[]> {
    const result = await query(
      `
      SELECT
        d.*,
        COALESCE(da.available_slots, d.slots_per_day) as available_slots_today,
        COALESCE(da.is_available, true) as is_available_today,
        COUNT(a.id) as total_appointments_today
      FROM departments d
      LEFT JOIN department_availability da ON d.id = da.department_id AND da.date = $1
      LEFT JOIN appointments a ON d.id = a.department_id AND a.appointment_date = $1
        AND a.status NOT IN ('cancelled', 'no_show')
      WHERE d.is_active = true
      GROUP BY d.id, da.available_slots, da.is_available
      ORDER BY d.name
    `,
      [date]
    );
    return result.rows;
  }

  static async create(
    departmentData: CreateDepartmentInput
  ): Promise<Department> {
    const result = await query(
      `INSERT INTO departments (name, description, slots_per_day, working_days, working_hours, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        departmentData.name,
        departmentData.description,
        departmentData.slots_per_day || 10,
        JSON.stringify(
          departmentData.working_days || [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
          ]
        ),
        JSON.stringify(
          departmentData.working_hours || { start: "09:00", end: "17:00" }
        ),
        departmentData.color || "#3B82F6",
      ]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    departmentData: Partial<CreateDepartmentInput>
  ): Promise<Department> {
    const setParts = [];
    const values = [];
    let paramCount = 1;

    if (departmentData.name) {
      setParts.push(`name = $${paramCount}`);
      values.push(departmentData.name);
      paramCount++;
    }

    if (departmentData.description !== undefined) {
      setParts.push(`description = $${paramCount}`);
      values.push(departmentData.description);
      paramCount++;
    }

    if (departmentData.slots_per_day) {
      setParts.push(`slots_per_day = $${paramCount}`);
      values.push(departmentData.slots_per_day);
      paramCount++;
    }

    if (departmentData.working_days) {
      setParts.push(`working_days = $${paramCount}`);
      values.push(JSON.stringify(departmentData.working_days));
      paramCount++;
    }

    if (departmentData.working_hours) {
      setParts.push(`working_hours = $${paramCount}`);
      values.push(JSON.stringify(departmentData.working_hours));
      paramCount++;
    }

    values.push(id);

    const result = await query(
      `UPDATE departments SET ${setParts.join(
        ", "
      )} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<void> {
    await query("UPDATE departments SET is_active = false WHERE id = $1", [id]);
  }
}

// Doctor Services (now linked to departments)
export class DoctorService {
  static async getAll(): Promise<DoctorWithDepartment[]> {
    const result = await query(`
      SELECT
        d.*,
        dept.name as department_name,
        dept.description as department_description
      FROM doctors d
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE d.is_active = true
      ORDER BY d.name
    `);
    return result.rows;
  }

  static async findById(id: number): Promise<DoctorWithDepartment | null> {
    const result = await query(
      `
      SELECT
        d.*,
        dept.name as department_name,
        dept.description as department_description
      FROM doctors d
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = $1
    `,
      [id]
    );
    return result.rows[0] || null;
  }

  static async getByDepartment(departmentId: number): Promise<Doctor[]> {
    const result = await query(
      "SELECT * FROM doctors WHERE department_id = $1 AND is_active = true ORDER BY name",
      [departmentId]
    );
    return result.rows;
  }

  static async create(doctorData: CreateDoctorInput): Promise<Doctor> {
    const result = await query(
      `INSERT INTO doctors (name, department_id)
       VALUES ($1, $2)
       RETURNING *`,
      [doctorData.name, doctorData.department_id]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    doctorData: Partial<CreateDoctorInput>
  ): Promise<Doctor> {
    const setParts = [];
    const values = [];
    let paramCount = 1;

    if (doctorData.name) {
      setParts.push(`name = $${paramCount}`);
      values.push(doctorData.name);
      paramCount++;
    }

    if (doctorData.department_id) {
      setParts.push(`department_id = $${paramCount}`);
      values.push(doctorData.department_id);
      paramCount++;
    }

    values.push(id);

    const result = await query(
      `UPDATE doctors SET ${setParts.join(
        ", "
      )} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<void> {
    await query("UPDATE doctors SET is_active = false WHERE id = $1", [id]);
  }
}

// Appointment Services
export class AppointmentService {
  static async create(
    appointmentData: CreateAppointmentInput
  ): Promise<Appointment> {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // Check if slot is available
      const existingResult = await queryWithClient(
        client,
        "SELECT id FROM appointments WHERE department_id = $1 AND appointment_date = $2 AND slot_number = $3",
        [
          appointmentData.department_id,
          appointmentData.appointment_date,
          appointmentData.slot_number,
        ]
      );

      if (existingResult.rows.length > 0) {
        throw new Error("Time slot is already booked");
      }

      // Create appointment
      const result = await queryWithClient(
        client,
        `INSERT INTO appointments (client_id, department_id, doctor_id, appointment_date, slot_number, notes, booked_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          appointmentData.client_id,
          appointmentData.department_id,
          appointmentData.doctor_id || null,
          appointmentData.appointment_date,
          appointmentData.slot_number,
          appointmentData.notes,
          appointmentData.booked_by,
        ]
      );

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<AppointmentWithDetails[]> {
    const result = await query(
      `
      SELECT
        a.*,
        c.name as client_name,
        c.x_number as client_x_number,
        c.phone as client_phone,
        c.category as client_category,
        dept.name as department_name,
        dept.description as department_description,
        d.name as doctor_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN departments dept ON a.department_id = dept.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.appointment_date BETWEEN $1 AND $2
      ORDER BY a.appointment_date, a.slot_number
    `,
      [startDate, endDate]
    );
    return result.rows;
  }

  static async getByDepartmentAndDate(
    departmentId: number,
    date: string
  ): Promise<AppointmentWithDetails[]> {
    const result = await query(
      `
      SELECT
        a.*,
        c.name as client_name,
        c.x_number as client_x_number,
        c.phone as client_phone,
        c.category as client_category,
        dept.name as department_name,
        dept.description as department_description,
        d.name as doctor_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN departments dept ON a.department_id = dept.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.department_id = $1 AND a.appointment_date = $2
      ORDER BY a.slot_number
    `,
      [departmentId, date]
    );
    return result.rows;
  }

  static async updateStatus(
    id: number,
    updateData: UpdateAppointmentInput
  ): Promise<Appointment> {
    const setParts = [];
    const values = [];
    let paramCount = 1;

    if (updateData.status) {
      setParts.push(`status = $${paramCount}`);
      values.push(updateData.status);
      paramCount++;
    }

    if (updateData.notes !== undefined) {
      setParts.push(`notes = $${paramCount}`);
      values.push(updateData.notes);
      paramCount++;
    }

    setParts.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE appointments SET ${setParts.join(
        ", "
      )} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async getAvailableSlots(
    departmentId: number,
    date: string
  ): Promise<number[]> {
    // First check if the date is a working day for the department
    const isWorkingDay = await this.isWorkingDay(departmentId, date);
    if (!isWorkingDay) {
      return []; // Return empty array for non-working days
    }

    const result = await query(
      `
      SELECT slot_number
      FROM appointments
      WHERE department_id = $1 AND appointment_date = $2 AND status NOT IN ('cancelled', 'no_show')
    `,
      [departmentId, date]
    );

    // Get department's slots per day
    const deptResult = await query(
      "SELECT slots_per_day FROM departments WHERE id = $1",
      [departmentId]
    );

    const bookedSlots = result.rows.map(
      (row: { slot_number: number }) => row.slot_number
    );
    const totalSlots = deptResult.rows[0]?.slots_per_day || 10;
    const availableSlots = [];

    for (let i = 1; i <= totalSlots; i++) {
      if (!bookedSlots.includes(i)) {
        availableSlots.push(i);
      }
    }

    return availableSlots;
  }

  static async isWorkingDay(
    departmentId: number,
    date: string
  ): Promise<boolean> {
    const result = await query(
      "SELECT working_days FROM departments WHERE id = $1",
      [departmentId]
    );

    if (result.rows.length === 0) {
      return false; // Department not found
    }

    const workingDays = result.rows[0].working_days;
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Convert day number to day name
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = dayNames[dayOfWeek];

    return workingDays.includes(dayName);
  }

  static async getByClientAndDateRange(
    clientId: number,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    const result = await query(
      `
      SELECT
        a.*,
        c.name as client_name,
        c.x_number as client_x_number,
        d.name as department_name,
        COALESCE(d.color, '#3B82F6') as department_color,
        COALESCE(doc.name, 'Dr. Smith') as doctor_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN doctors doc ON a.doctor_id = doc.id
      WHERE a.client_id = $1 AND a.appointment_date BETWEEN $2 AND $3
      ORDER BY a.appointment_date ASC, a.slot_number ASC
    `,
      [clientId, startDate, endDate]
    );
    return result.rows;
  }
}

// System Settings Services
export class SystemSettingsService {
  static async get(key: string): Promise<string | null> {
    const result = await query(
      "SELECT setting_value FROM system_settings WHERE setting_key = $1",
      [key]
    );
    return result.rows[0]?.setting_value || null;
  }

  static async getAll(): Promise<SystemSetting[]> {
    const result = await query(
      "SELECT * FROM system_settings ORDER BY setting_key"
    );
    return result.rows;
  }

  static async update(
    key: string,
    value: string,
    updatedBy: number
  ): Promise<void> {
    await query(
      "UPDATE system_settings SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $3",
      [value, updatedBy, key]
    );
  }
}

// OTP Services - REMOVED
// OTP functionality now handled by JWT-based system (lib/jwt-otp-service.ts)
// No database storage needed for OTPs
