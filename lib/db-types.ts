// Database types based on the schema

export interface User {
  id: number;
  name: string;
  phone: string;
  role: "receptionist" | "admin" | "reviewer";
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
  icon?: string; // Icon name for UI display (optional, handled in frontend)
  slot_duration_minutes: number; // Duration of each slot in minutes (default 30)
  require_review: boolean; // Whether appointments require review before confirmation
  auto_confirm_staff_bookings: boolean; // Whether staff bookings skip review
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

export type AppointmentStatus =
  | "pending_review"
  | "booked"
  | "arrived"
  | "waiting"
  | "completed"
  | "no_show"
  | "cancelled"
  | "rescheduled";

export interface Appointment {
  id: number;
  client_id: number;
  department_id: number;
  doctor_id: number | null;
  appointment_date: Date;
  slot_number: number;
  slot_start_time: string | null; // Calculated slot start time (HH:MM:SS)
  slot_end_time: string | null; // Calculated slot end time (HH:MM:SS)
  status: AppointmentStatus;
  notes: string | null;
  booked_by: number;
  // Review fields
  reviewer_notes: string | null;
  reviewed_by: number | null;
  reviewed_at: Date | null;
  // Reschedule fields
  rescheduled_from_id: number | null;
  rescheduled_to_id: number | null;
  reschedule_reason: string | null;
  rescheduled_by: number | null;
  rescheduled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentStatusRecord {
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
  role?: "receptionist" | "admin" | "reviewer";
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
  status?: AppointmentStatus;
  notes?: string;
  doctor_id?: number; // assign specific doctor
  reviewer_notes?: string;
  reviewed_by?: number;
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
  slot_duration_minutes?: number;
  require_review?: boolean;
  auto_confirm_staff_bookings?: boolean;
}

export interface CreateDoctorInput {
  name: string;
  department_id: number;
}

// Notification types
export type NotificationType = "sms" | "push" | "email";
export type NotificationEventType =
  | "booking_confirmation"
  | "reschedule_request"
  | "reschedule_completed"
  | "reschedule_pending_review"
  | "review_confirmed"
  | "reminder";
export type NotificationStatus = "pending" | "sent" | "failed" | "delivered";

export interface NotificationLog {
  id: number;
  appointment_id: number | null;
  client_id: number;
  notification_type: NotificationType;
  event_type: NotificationEventType;
  recipient_contact: string;
  message_content: string | null;
  status: NotificationStatus;
  error_message: string | null;
  external_id: string | null;
  sent_at: Date | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNotificationLogInput {
  appointment_id?: number;
  client_id: number;
  notification_type: NotificationType;
  event_type: NotificationEventType;
  recipient_contact: string;
  message_content?: string;
}

// Reschedule input type
export interface RescheduleAppointmentInput {
  appointment_id: number;
  new_date: string; // YYYY-MM-DD format
  new_slot_number: number;
  reason?: string;
}
