import { IWeek } from '../models/Week';

/**
 * Calculate weekly capacity based on working days and hours per day.
 */
export function calculateWeeklyCapacity(workingDays: number, hoursPerDay: number): number {
  return workingDays * hoursPerDay;
}

/**
 * Calculate allocated work hours based on days and extra hours.
 */
export function calculateAllocatedWH(
  allocatedDays: number,
  extraHours: number,
  hoursPerDay: number
): number {
  return allocatedDays * hoursPerDay + extraHours;
}

/**
 * Calculate free hours.
 */
export function calculateFreeWH(weeklyCapacity: number, allocatedWH: number): number {
  const free = weeklyCapacity - allocatedWH;
  return Math.max(0, free);
}

/**
 * Calculate overbooked hours.
 */
export function calculateOverbookedWH(weeklyCapacity: number, allocatedWH: number): number {
  const overbooked = allocatedWH - weeklyCapacity;
  return Math.max(0, overbooked);
}

/**
 * Calculate utilization percentage.
 */
export function calculateUtilization(allocatedWH: number, weeklyCapacity: number): number {
  if (weeklyCapacity === 0) return 0;
  return (allocatedWH / weeklyCapacity) * 100;
}

/**
 * Get utilization status label and color.
 */
export function getUtilizationStatus(utilization: number): {
  label: string;
  color: string;
} {
  if (utilization === 0) return { label: 'No Allocation', color: 'grey' };
  if (utilization < 50) return { label: 'Underutilized', color: 'yellow' };
  if (utilization <= 100) return { label: 'Normal', color: 'green' };
  return { label: 'Overbooked', color: 'red' };
}

/**
 * Get the total allocated WH for an employee in a given week.
 */
/**
 * Fetch holidays for a given year from the database.
 * Returns a Map of date-key → holiday type.
 */
async function getHolidaysForYear(year: number): Promise<Map<string, string>> {
  try {
    const { Holiday } = await import('../models/Holiday');
    const holidays = await Holiday.find({ year, isActive: true }).select('date type');
    const dateMap = new Map<string, string>();
    for (const h of holidays) {
      const d = new Date(h.date);
      dateMap.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, h.type);
    }
    return dateMap;
  } catch {
    return new Map();
  }
}

/**
 * Check if a date is the 2nd or 4th Saturday of its month (common off days).
 */
function isSecondOrFourthSaturday(date: Date): boolean {
  if (date.getDay() !== 6) return false; // Not a Saturday
  const year = date.getFullYear();
  const month = date.getMonth();
  const dayOfMonth = date.getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Day of month for the 1st Saturday
  const firstSaturday = (6 - firstDayOfMonth + 7) % 7 + 1;
  // 2nd Saturday = firstSaturday + 7, 4th Saturday = firstSaturday + 21
  return dayOfMonth === firstSaturday + 7 || dayOfMonth === firstSaturday + 21;
}

/**
 * Check if a date is a non-working day (Sunday, 2nd/4th Saturday, or holiday).
 * If a 2nd/4th Saturday is marked as 'working_saturday' in the holidays table, it overrides.
 */
function isNonWorkingDay(date: Date, holidayMap: Map<string, string>): boolean {
  if (date.getDay() === 0) return true; // Sunday
  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  // If this date is marked as 'working_saturday', it overrides the 2nd/4th Saturday rule
  if (holidayMap.get(dateKey) === 'working_saturday') return false;
  if (isSecondOrFourthSaturday(date)) return true; // 2nd/4th Saturday
  // Check if it's any other holiday type
  if (holidayMap.has(dateKey)) return true; // Marked holiday (national/optional/company)
  return false;
}

/**
 * Get the number of working days in a month (excluding Sundays, 2nd/4th Saturdays, and holidays).
 */
export async function getWorkingDaysInMonth(year: number, month: number): Promise<number> {
  const holidayMap = await getHolidaysForYear(year);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (!isNonWorkingDay(date, holidayMap)) workingDays++;
  }
  return workingDays;
}

/**
 * Count the number of overlapping working days between a leave period and a month.
 * Excludes Sundays, 2nd/4th Saturdays, and holidays.
 */
export async function countLeaveDaysInMonth(
  leaveStart: Date,
  leaveEnd: Date,
  monthStart: Date,
  monthEnd: Date
): Promise<number> {
  const start = leaveStart > monthStart ? leaveStart : monthStart;
  const end = leaveEnd < monthEnd ? leaveEnd : monthEnd;
  if (start > end) return 0;

  // Get holidays for the overlapping year range
  const yearSet = new Set<number>();
  const d = new Date(start);
  while (d <= end) {
    yearSet.add(d.getFullYear());
    d.setDate(d.getDate() + 1);
  }
  const allHolidays = new Map<string, string>();
  for (const y of yearSet) {
    const h = await getHolidaysForYear(y);
    for (const [k, v] of h) allHolidays.set(k, v);
  }

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (!isNonWorkingDay(cursor, allHolidays)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export async function getEmployeeTotalAllocatedWH(
  employeeId: string,
  weekId: string,
  excludeAllocationId?: string
): Promise<number> {
  const { Allocation } = await import('../models/Allocation');

  const filter: Record<string, unknown> = {
    employeeId,
    weekId,
  };

  if (excludeAllocationId) {
    filter._id = { $ne: excludeAllocationId };
  }

  const allocations = await Allocation.find(filter);
  return allocations.reduce((sum, a) => sum + a.allocatedWH, 0);
}
