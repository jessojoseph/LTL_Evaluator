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
 * Get the number of working days in a month (excluding Sundays).
 */
export function getWorkingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month, d).getDay() !== 0) workingDays++;
  }
  return workingDays;
}

/**
 * Count the number of overlapping weekdays (Mon-Sat) between a leave period and a month.
 */
export function countLeaveDaysInMonth(
  leaveStart: Date,
  leaveEnd: Date,
  monthStart: Date,
  monthEnd: Date
): number {
  const start = leaveStart > monthStart ? leaveStart : monthStart;
  const end = leaveEnd < monthEnd ? leaveEnd : monthEnd;
  if (start > end) return 0;
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    if (d.getDay() !== 0) count++;
    d.setDate(d.getDate() + 1);
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
