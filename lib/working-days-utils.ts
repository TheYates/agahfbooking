// Utility functions for working days validation

export interface Department {
  id: number;
  name: string;
  working_days: string[];
  working_hours: { start: string; end: string };
  slots_per_day: number;
  color?: string;
}

/**
 * Check if a date is a working day for a department (client-side)
 * @param department - Department object with working_days
 * @param date - Date object or date string
 * @returns boolean - true if it's a working day
 */
export function isWorkingDay(department: Department, date: Date | string): boolean {
  if (!department || !department.working_days) {
    return false;
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Convert day number to day name
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  return department.working_days.includes(dayName);
}

/**
 * Check if a date is a working day for any department (when no specific department is selected)
 * @param departments - Array of departments
 * @param date - Date object or date string
 * @returns boolean - true if it's a working day for at least one department
 */
export function isWorkingDayForAnyDepartment(departments: Department[] | undefined | null, date: Date | string): boolean {
  // Safeguard: ensure departments is a valid array
  if (!departments || !Array.isArray(departments) || departments.length === 0) {
    return false;
  }

  return departments.some(dept => isWorkingDay(dept, date));
}

/**
 * Get working departments for a specific date
 * @param departments - Array of departments
 * @param date - Date object or date string
 * @returns Department[] - Array of departments that work on this date
 */
export function getWorkingDepartments(departments: Department[] | undefined | null, date: Date | string): Department[] {
  // Safeguard: ensure departments is a valid array
  if (!departments || !Array.isArray(departments) || departments.length === 0) {
    return [];
  }

  return departments.filter(dept => isWorkingDay(dept, date));
}

/**
 * Check if a date is in the past
 * @param date - Date object or date string
 * @returns boolean - true if the date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = typeof date === 'string' ? new Date(date) : new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * Check if a date is valid for booking (not in past and is a working day)
 * @param department - Department object (optional, if not provided checks any department)
 * @param departments - Array of all departments (used when department is not provided)
 * @param date - Date object or date string
 * @returns boolean - true if the date is valid for booking
 */
export function isValidBookingDate(
  date: Date | string,
  department?: Department,
  departments?: Department[] | undefined | null
): boolean {
  // Check if date is in the past
  if (isPastDate(date)) {
    return false;
  }

  // Check working days
  if (department) {
    return isWorkingDay(department, date);
  } else if (departments && Array.isArray(departments)) {
    return isWorkingDayForAnyDepartment(departments, date);
  }

  // If no department info provided, assume it's valid (fallback)
  return true;
}
