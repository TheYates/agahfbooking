/**
 * Slot Time Utilities
 *
 * Provides functions for calculating and formatting appointment slot times
 * based on department working hours and slot duration settings.
 */

export interface WorkingHours {
  start: string; // "09:00" or "9:00"
  end: string; // "17:00" or "5:00 PM"
}

export interface SlotTimeInfo {
  slotNumber: number;
  startTime: string; // "09:00:00" format for database
  endTime: string; // "09:30:00" format for database
  displayTime: string; // "9:00 AM - 9:30 AM" format for UI
  startTimeFormatted: string; // "9:00 AM" format
  endTimeFormatted: string; // "9:30 AM" format
}

/**
 * Parse time string to hours and minutes
 * Handles "09:00", "9:00", "09:00:00" formats
 */
export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  // Handle HH:MM:SS or HH:MM format
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);

  return { hours, minutes };
}

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * @param hours - 0-23
 * @param minutes - 0-59
 * @returns Formatted time like "9:00 AM" or "2:30 PM"
 */
export function formatTime12Hour(hours: number, minutes: number): string {
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12; // Convert 0 to 12, and 13-23 to 1-11
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Convert hours and minutes to database TIME format (HH:MM:SS)
 */
export function formatTimeDatabase(hours: number, minutes: number): string {
  const displayHours = hours.toString().padStart(2, "0");
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes}:00`;
}

/**
 * Calculate start and end times for a specific slot
 * @param workingHours - Department working hours
 * @param slotNumber - 1-based slot number
 * @param durationMinutes - Duration of each slot in minutes
 */
export function calculateSlotTimes(
  workingHours: WorkingHours,
  slotNumber: number,
  durationMinutes: number = 30
): { startTime: string; endTime: string; startHours: number; startMinutes: number; endHours: number; endMinutes: number } {
  const { hours: startHour, minutes: startMinute } = parseTimeString(workingHours.start);

  // Calculate offset for this slot (slot 1 starts at working hours start)
  const offsetMinutes = (slotNumber - 1) * durationMinutes;

  // Calculate start time
  const totalStartMinutes = startHour * 60 + startMinute + offsetMinutes;
  const slotStartHours = Math.floor(totalStartMinutes / 60);
  const slotStartMinutes = totalStartMinutes % 60;

  // Calculate end time
  const totalEndMinutes = totalStartMinutes + durationMinutes;
  const slotEndHours = Math.floor(totalEndMinutes / 60);
  const slotEndMinutes = totalEndMinutes % 60;

  return {
    startTime: formatTimeDatabase(slotStartHours, slotStartMinutes),
    endTime: formatTimeDatabase(slotEndHours, slotEndMinutes),
    startHours: slotStartHours,
    startMinutes: slotStartMinutes,
    endHours: slotEndHours,
    endMinutes: slotEndMinutes,
  };
}

/**
 * Format a time range for display
 * @param startTime - Start time in HH:MM:SS format
 * @param endTime - End time in HH:MM:SS format
 * @returns Formatted range like "9:00 AM - 9:30 AM"
 */
export function formatSlotTimeRange(startTime: string, endTime: string): string {
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);

  return `${formatTime12Hour(start.hours, start.minutes)} - ${formatTime12Hour(end.hours, end.minutes)}`;
}

/**
 * Get full slot time info for a specific slot
 */
export function getSlotTimeInfo(
  workingHours: WorkingHours,
  slotNumber: number,
  durationMinutes: number = 30
): SlotTimeInfo {
  const times = calculateSlotTimes(workingHours, slotNumber, durationMinutes);

  const startTimeFormatted = formatTime12Hour(times.startHours, times.startMinutes);
  const endTimeFormatted = formatTime12Hour(times.endHours, times.endMinutes);

  return {
    slotNumber,
    startTime: times.startTime,
    endTime: times.endTime,
    displayTime: `${startTimeFormatted} - ${endTimeFormatted}`,
    startTimeFormatted,
    endTimeFormatted,
  };
}

/**
 * Generate all slots for a department with their times
 * @param slotsPerDay - Number of slots per day
 * @param workingHours - Department working hours
 * @param durationMinutes - Duration of each slot in minutes
 */
export function generateDepartmentSlots(
  slotsPerDay: number,
  workingHours: WorkingHours,
  durationMinutes: number = 30
): SlotTimeInfo[] {
  const slots: SlotTimeInfo[] = [];

  for (let slotNum = 1; slotNum <= slotsPerDay; slotNum++) {
    slots.push(getSlotTimeInfo(workingHours, slotNum, durationMinutes));
  }

  return slots;
}

/**
 * Check if a slot's end time is within working hours
 */
export function isSlotWithinWorkingHours(
  workingHours: WorkingHours,
  slotNumber: number,
  durationMinutes: number = 30
): boolean {
  const { hours: endHour, minutes: endMinute } = parseTimeString(workingHours.end);
  const endOfDayMinutes = endHour * 60 + endMinute;

  const slotTimes = calculateSlotTimes(workingHours, slotNumber, durationMinutes);
  const slotEndMinutes = slotTimes.endHours * 60 + slotTimes.endMinutes;

  return slotEndMinutes <= endOfDayMinutes;
}

/**
 * Calculate the maximum number of slots that fit within working hours
 */
export function calculateMaxSlots(workingHours: WorkingHours, durationMinutes: number = 30): number {
  const { hours: startHour, minutes: startMinute } = parseTimeString(workingHours.start);
  const { hours: endHour, minutes: endMinute } = parseTimeString(workingHours.end);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const totalMinutes = endMinutes - startMinutes;

  return Math.floor(totalMinutes / durationMinutes);
}

/**
 * Format slot time for display from database time string
 * Converts "09:30:00" to "9:30 AM"
 */
export function formatDatabaseTimeForDisplay(dbTime: string | null): string | null {
  if (!dbTime) return null;

  const { hours, minutes } = parseTimeString(dbTime);
  return formatTime12Hour(hours, minutes);
}
