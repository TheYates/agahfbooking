// Database types based on the schema

export interface User {
  id: number;
  name: string;
  phone: string;
  role: "receptionist" | "admin";
  employee_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Client {
  id: number;
  x_number: string;
  name: string;
  phone: string;
  category: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  slots_per_day: number;
  working_days: string[]; // ["monday", "tuesday", etc.]
  working_hours: { start: string; end: string }; // {"start": "09:00", "end": "17:00"}
  color?: string; // Hex color code for UI display
  created_at: Date;
}

export interface Doctor {
  id: number;
  name: string;
  department_id: number | null;
  is_active: boolean;
  created_at: Date;
}

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_by: number | null;
  updated_at: Date;
}

export interface DepartmentAvailability {
  id: number;
  department_id: number;
  date: Date;
  available_slots: number;
  is_available: boolean;
  reason: string | null;
  created_by: number | null;
  created_at: Date;
}

export interface Appointment {
  id: number;
  client_id: number;
  department_id: number;
  doctor_id: number | null;
  appointment_date: Date;
  slot_number: number;
  status:
    | "booked"
    | "arrived"
    | "waiting"
    | "completed"
    | "no_show"
    | "cancelled"
    | "rescheduled";
  notes: string | null;
  booked_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentStatus {
  id: number;
  status_name: string;
  status_color: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface OtpCode {
  id: number;
  x_number: string;
  otp_code: string;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
}

// Extended types with joined data
export interface AppointmentWithDetails extends Appointment {
  client_name: string;
  client_phone: string;
  client_category: string;
  department_name: string;
  department_description: string | null;
  doctor_name: string | null;
}

export interface DepartmentWithAvailability extends Department {
  available_slots_today?: number;
  is_available_today?: boolean;
  total_appointments_today?: number;
}

export interface DoctorWithDepartment extends Doctor {
  department_name: string | null;
  department_description: string | null;
}

// Input types for creating/updating records
export interface CreateUserInput {
  name: string;
  phone: string;
  role?: "receptionist" | "admin";
  employee_id?: string;
}

export interface CreateClientInput {
  x_number: string;
  name: string;
  phone: string;
  category: string;
  emergency_contact?: string | null;
  address?: string | null;
}

export interface CreateAppointmentInput {
  client_id: number;
  department_id: number;
  doctor_id?: number; // optional specific doctor assignment
  appointment_date: string; // YYYY-MM-DD format
  slot_number: number;
  notes?: string;
  booked_by: number;
}

export interface UpdateAppointmentInput {
  status?:
    | "booked"
    | "arrived"
    | "waiting"
    | "completed"
    | "no_show"
    | "cancelled"
    | "rescheduled";
  notes?: string;
  doctor_id?: number; // assign specific doctor
}

export interface CreateDepartmentAvailabilityInput {
  department_id: number;
  date: string; // YYYY-MM-DD format
  available_slots: number;
  is_available?: boolean;
  reason?: string;
  created_by?: number;
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
  slots_per_day?: number;
  working_days?: string[];
  working_hours?: { start: string; end: string };
  color?: string;
}

export interface CreateDoctorInput {
  name: string;
  department_id: number;
}
