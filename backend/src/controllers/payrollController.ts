import { Request, Response } from 'express';
import { Leave } from '../models/Leave';
import { Employee } from '../models/Employee';
import {
  getWorkingDaysInMonth,
  countLeaveDaysInMonth,
} from '../utils/helpers';

interface ReportRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  email: string;
  department: string;
  designation: string;
  employmentType: string;
  workingDays: number;
  leaveDays: number;
  lopDays: number;
  presentDays: number;
  netPayableDays: number;
  leaveTypeBreakdown: Record<string, { days: number; lopDays: number }>;
  leaveRecords: Record<string, unknown>[];
}

export async function monthlyLeaveSummary(req: Request, res: Response): Promise<void> {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    const totalWorkingDays = await getWorkingDaysInMonth(year, month);

    // Get all active employees
    const employees = await Employee.find({ status: 'active' }).sort({ name: 1 });

    // Get only approved leaves that overlap with this month for payroll calculation
    const leaves = await Leave.find({
      status: 'approved',
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart },
    })
      .populate('employeeId', 'name email employeeCode department designation employmentType')
      .populate('approvedBy', 'name');

    // Group leaves by employee
    const employeeLeaveMap = new Map<string, typeof leaves>();
    for (const leave of leaves) {
      const empId = leave.employeeId._id.toString();
      if (!employeeLeaveMap.has(empId)) {
        employeeLeaveMap.set(empId, []);
      }
      employeeLeaveMap.get(empId)!.push(leave);
    }

    // Build report — use for...of to allow async calls
    const report: ReportRow[] = [];
    for (const emp of employees) {
      const empLeaves = employeeLeaveMap.get(emp._id.toString()) || [];

      const leaveTypeBreakdown: Record<string, { days: number; lopDays: number }> = {};
      let totalLeaveDays = 0;
      let totalLopDays = 0;

      for (const leave of empLeaves) {
        const overlapDays = await countLeaveDaysInMonth(
          new Date(leave.startDate),
          new Date(leave.endDate),
          monthStart,
          monthEnd
        );

        if (overlapDays === 0) continue;

        const type = leave.type;
        if (!leaveTypeBreakdown[type]) {
          leaveTypeBreakdown[type] = { days: 0, lopDays: 0 };
        }
        leaveTypeBreakdown[type].days += overlapDays;
        totalLeaveDays += overlapDays;

        if (leave.isLop) {
          leaveTypeBreakdown[type].lopDays += overlapDays;
          totalLopDays += overlapDays;
        }
      }

      const netPayableDays = totalWorkingDays - totalLopDays;
      const presentDays = totalWorkingDays - totalLeaveDays;

      // Build leave records
      const leaveRecords: Record<string, unknown>[] = [];
      for (const l of empLeaves) {
        const days = await countLeaveDaysInMonth(
          new Date(l.startDate),
          new Date(l.endDate),
          monthStart,
          monthEnd
        );
        if (days === 0) continue;
        leaveRecords.push({
          type: l.type,
          startDate: l.startDate,
          endDate: l.endDate,
          status: l.status,
          isLop: l.isLop,
          lopReason: l.lopReason,
          days,
        });
      }

      report.push({
        employeeId: emp._id.toString(),
        employeeName: emp.name,
        employeeCode: emp.employeeCode || '-',
        email: emp.email,
        department: emp.department || '-',
        designation: emp.designation || '-',
        employmentType: emp.employmentType,
        workingDays: totalWorkingDays,
        leaveDays: totalLeaveDays,
        lopDays: totalLopDays,
        presentDays,
        netPayableDays,
        leaveTypeBreakdown,
        leaveRecords,
      });
    }

    // Summary stats
    const summary = {
      totalEmployees: employees.length,
      totalWorkingDays,

      totalLeaveDays: report.reduce((s, r) => s + r.leaveDays, 0),
      totalLopDays: report.reduce((s, r) => s + r.lopDays, 0),
      employeesWithLop: report.filter((r) => r.lopDays > 0).length,
    };

    res.json({
      year,
      month,
      monthName: new Date(year, month).toLocaleString('default', { month: 'long' }),
      summary,
      report,
    });
  } catch (error) {
    console.error('Payroll report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
