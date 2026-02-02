/**
 * Appointment Status Utilities
 *
 * Centralized status labels and colors for consistent UI display.
 *
 * Database status values → UI display labels:
 * - "pending_review" → "Pending Confirmation"
 * - "booked" → "Confirmed"
 * - Other statuses display as formatted versions of their database values
 */

export type AppointmentStatus =
  | "pending_review"
  | "reschedule_requested"
  | "booked"
  | "confirmed"
  | "arrived"
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending_review: {
    label: "Pending Confirmation",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
  },
  reschedule_requested: {
    label: "Reschedule Requested",
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
  booked: {
    label: "Confirmed",
    color: "#3B82F6",
    bgColor: "#DBEAFE",
  },
  confirmed: {
    label: "Confirmed",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
  arrived: {
    label: "Arrived",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
  waiting: {
    label: "Waiting",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
  },
  in_progress: {
    label: "In Progress",
    color: "#06B6D4",
    bgColor: "#CFFAFE",
  },
  completed: {
    label: "Completed",
    color: "#059669",
    bgColor: "#D1FAE5",
  },
  cancelled: {
    label: "Cancelled",
    color: "#6B7280",
    bgColor: "#F3F4F6",
  },
  no_show: {
    label: "No Show",
    color: "#EF4444",
    bgColor: "#FEE2E2",
  },
  rescheduled: {
    label: "Rescheduled",
    color: "#F97316",
    bgColor: "#FFEDD5",
  },
};

/**
 * Get the display label for a status
 * e.g., "pending_review" → "Pending Confirmation", "booked" → "Confirmed"
 */
export function getStatusLabel(status: string): string {
  return STATUS_CONFIG[status]?.label || formatStatusFallback(status);
}

/**
 * Get the color for a status
 */
export function getStatusColor(status: string): string {
  return STATUS_CONFIG[status]?.color || "#6B7280";
}

/**
 * Get the background color for a status badge
 */
export function getStatusBgColor(status: string): string {
  return STATUS_CONFIG[status]?.bgColor || "#F3F4F6";
}

/**
 * Get full status config (label, color, bgColor)
 */
export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] || {
    label: formatStatusFallback(status),
    color: "#6B7280",
    bgColor: "#F3F4F6",
  };
}

/**
 * Fallback formatter for unknown statuses
 * Converts "some_status" to "Some Status"
 */
function formatStatusFallback(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Status options for dropdowns/selects
 */
export const STATUS_OPTIONS = [
  { value: "pending_review", label: "Pending Confirmation", color: "#F59E0B" },
  { value: "reschedule_requested", label: "Reschedule Requested", color: "#DC2626" },
  { value: "booked", label: "Confirmed", color: "#3B82F6" },
  { value: "arrived", label: "Arrived", color: "#10B981" },
  { value: "waiting", label: "Waiting", color: "#8B5CF6" },
  { value: "in_progress", label: "In Progress", color: "#06B6D4" },
  { value: "completed", label: "Completed", color: "#059669" },
  { value: "cancelled", label: "Cancelled", color: "#6B7280" },
  { value: "no_show", label: "No Show", color: "#EF4444" },
  { value: "rescheduled", label: "Rescheduled", color: "#F97316" },
];
