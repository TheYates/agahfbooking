export const DEFAULT_REMINDER_OFFSETS_MINUTES = [1440, 60]; // 24h, 1h

export function buildReminderSchedule(
  appointmentDate: string,
  offsetsMinutes: number[] = DEFAULT_REMINDER_OFFSETS_MINUTES
) {
  const appointmentTime = new Date(appointmentDate).getTime();
  return offsetsMinutes
    .map((offsetMinutes) => {
      const scheduledAt = new Date(appointmentTime - offsetMinutes * 60 * 1000);
      return {
        offsetMinutes,
        scheduledAt,
      };
    })
    .filter(({ scheduledAt }) => scheduledAt.getTime() > Date.now());
}
