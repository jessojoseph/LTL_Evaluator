import { Request, Response } from 'express';
import { generateWeeklyExport, generatePayrollExport } from '../utils/excel';
import { Week } from '../models/Week';
import { Allocation } from '../models/Allocation';
import { Leave } from '../models/Leave';
import { Employee } from '../models/Employee';
import { Project } from '../models/Project';

import {
  calculateFreeWH,
  calculateOverbookedWH,
  calculateUtilization,
  getWorkingDaysInMonth,
  countLeaveDaysInMonth,
} from '../utils/helpers';

import { PopulatedDoc, AllocationPopulated, EmployeeWiseItem } from '../types';

async function getReportData(weekId?: string) {
  const week = weekId
    ? await Week.findById(weekId)
    : await Week.findOne().sort({ startDate: -1 });

  if (!week) return null;

  const employees = await Employee.find({ status: 'active' }).populate('defaultLeadId', 'name');
  const allocations = (await Allocation.find({ weekId: week._id })
    .populate('projectLeadId', 'name')
    .populate('projectId', 'name')
    .populate('employeeId', 'name')) as unknown as AllocationPopulated[];
  const projects = await Project.find({ status: { $ne: 'completed' } });
  const leads = await Employee.find({ isLead: true, status: 'active' });

  const totalAllocatedWH = allocations.reduce((sum, a) => sum + a.allocatedWH, 0);
  const totalWeeklyCapacity = week.weeklyCapacity;
  const totalFreeWH = calculateFreeWH(totalWeeklyCapacity, totalAllocatedWH);
  const totalOverbookedWH = calculateOverbookedWH(totalWeeklyCapacity, totalAllocatedWH);
  const averageUtilization = Math.round(calculateUtilization(totalAllocatedWH, totalWeeklyCapacity) * 100) / 100;

  const dashboardRows = [
    { metric: 'Total Employees', value: employees.length },
    { metric: 'Total Projects', value: projects.length },
    { metric: 'Total Weekly Capacity', value: totalWeeklyCapacity },
    { metric: 'Total Allocated WH', value: totalAllocatedWH },
    { metric: 'Total Free WH', value: totalFreeWH },
    { metric: 'Total Overbooked WH', value: totalOverbookedWH },
    { metric: 'Average Utilization %', value: averageUtilization },
  ];

  const employeeUtilization = employees.map((emp) => {
    const empAllocations = allocations.filter(
      (a) => a.employeeId._id.toString() === emp._id.toString()
    );
    const empAllocatedWH = empAllocations.reduce((sum, a) => sum + a.allocatedWH, 0);
    const defaultLead = emp.defaultLeadId as PopulatedDoc | null;
    return {
      employee: emp.name,
      lead: defaultLead?.name || '-',
      capacityWH: week.weeklyCapacity,
      allocatedWH: empAllocatedWH,
      freeWH: calculateFreeWH(week.weeklyCapacity, empAllocatedWH),
      overbookedWH: calculateOverbookedWH(week.weeklyCapacity, empAllocatedWH),
      utilization: Math.round(calculateUtilization(empAllocatedWH, week.weeklyCapacity) * 100) / 100,
    };
  });

  const projectWise = allocations.map((a) => ({
    projectLead: a.projectLeadId.name || '',
    project: a.projectId.name || '',
    employee: a.employeeId.name || '',
    days: a.allocatedDays,
    extraHours: a.extraHours,
    allocatedWH: a.allocatedWH,
  }));

  const leadSummary = leads.map((lead) => {
    const leadAllocations = allocations.filter(
      (a) => a.projectLeadId._id.toString() === lead._id.toString()
    );
    const uniqueProjects = new Set(leadAllocations.map((a) => a.projectId.name));
    const uniqueEmployees = new Set(leadAllocations.map((a) => a.employeeId.name));
    const leadAllocatedWH = leadAllocations.reduce((sum, a) => sum + a.allocatedWH, 0);
    const leadCapacity = uniqueEmployees.size * week.weeklyCapacity;
    return {
      projectLead: lead.name,
      projectCount: uniqueProjects.size,
      employeeCount: uniqueEmployees.size,
      totalCapacity: leadCapacity,
      allocatedWH: leadAllocatedWH,
      freeWH: calculateFreeWH(leadCapacity, leadAllocatedWH),
      utilization: Math.round(calculateUtilization(leadAllocatedWH, leadCapacity) * 100) / 100,
    };
  });

  const freeResources = employees
    .map((emp) => {
      const empAllocatedWH = allocations
        .filter((a) => a.employeeId._id.toString() === emp._id.toString())
        .reduce((sum, a) => sum + a.allocatedWH, 0);
      const defaultLead = emp.defaultLeadId as PopulatedDoc | null;
      return {
        employee: emp.name,
        lead: defaultLead?.name || '-',
        capacityWH: week.weeklyCapacity,
        allocatedWH: empAllocatedWH,
        freeWH: calculateFreeWH(week.weeklyCapacity, empAllocatedWH),
      };
    })
    .filter((r) => r.freeWH > 0);

  const employeeOverbookedMap = new Map<string, {
    employee: string;
    capacityWH: number;
    allocatedWH: number;
    overbookedWH: number;
    projects: string[];
  }>();
  for (const alloc of allocations) {
    const empId = alloc.employeeId._id.toString();
    const empName = alloc.employeeId.name || '';
    if (!employeeOverbookedMap.has(empId)) {
      employeeOverbookedMap.set(empId, {
        employee: empName,
        capacityWH: week.weeklyCapacity,
        allocatedWH: 0,
        overbookedWH: 0,
        projects: [],
      });
    }
    const entry = employeeOverbookedMap.get(empId)!;
    entry.allocatedWH += alloc.allocatedWH;
    entry.projects.push(alloc.projectId.name || '');
  }
  const overbookedResources = Array.from(employeeOverbookedMap.values())
    .map((e) => ({ ...e, overbookedWH: calculateOverbookedWH(e.capacityWH, e.allocatedWH) }))
    .filter((e) => e.overbookedWH > 0);

  const employeeWiseData = employees
    .map((emp) => {
      const empAllocations = allocations.filter(
        (a) => a.employeeId._id.toString() === emp._id.toString()
      );
      if (empAllocations.length === 0) return null;
      const defaultLead = emp.defaultLeadId as PopulatedDoc | null;
      const projects = empAllocations.map((a) => ({
        project: a.projectId.name || '',
        lead: a.projectLeadId.name || '',
        days: a.allocatedDays,
        extraHours: a.extraHours,
        allocatedWH: a.allocatedWH,
      }));
      const totalWH = projects.reduce((s, p) => s + p.allocatedWH, 0);
      const capacityWH = week.weeklyCapacity;
      let statusLabel: string, color: string;
      if (totalWH === 0) {
        statusLabel = 'No Allocation';
        color = 'grey';
      } else if (totalWH > capacityWH) {
        statusLabel = 'Overbooked';
        color = 'red';
      } else if (totalWH < capacityWH) {
        statusLabel = 'Less Booked';
        color = 'yellow';
      } else {
        statusLabel = 'Fully Booked';
        color = 'green';
      }
      return {
        employee: emp.name,
        lead: defaultLead?.name || '-',
        projects,
        totalWH,
        statusLabel,
        color,
      };
    })
    .filter(Boolean) as EmployeeWiseItem[];

  return {
    week,
    dashboardRows,
    employeeUtilization,
    projectWise,
    leadSummary,
    freeResources,
    overbookedResources,
    employeeWise: employeeWiseData,
  };
}

export async function exportWeeklyReport(req: Request, res: Response): Promise<void> {
  try {
    const data = await getReportData(req.query.weekId as string | undefined);
    if (!data) {
      res.status(404).json({ message: 'No week found' });
      return;
    }

    const buffer = await generateWeeklyExport({
      dashboard: data.dashboardRows,
      employeeUtilization: data.employeeUtilization,
      projectWise: data.projectWise,
      leadSummary: data.leadSummary,
      freeResources: data.freeResources,
      overbookedResources: data.overbookedResources,
      employeeWise: data.employeeWise,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=weekly-report-${data.week.weekName}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to generate Excel report' });
  }
}

export async function exportEmployeeUtilization(req: Request, res: Response): Promise<void> {
  try {
    const data = await getReportData(req.query.weekId as string | undefined);
    if (!data) {
      res.status(404).json({ message: 'No week found' });
      return;
    }

    const buffer = await generateWeeklyExport({
      dashboard: [],
      employeeUtilization: data.employeeUtilization,
      projectWise: [],
      leadSummary: [],
      freeResources: [],
      overbookedResources: [],
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=employee-utilization-${data.week.weekName}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to generate Excel report' });
  }
}

export async function exportEmployeeWise(req: Request, res: Response): Promise<void> {
  try {
    const data = await getReportData(req.query.weekId as string | undefined);
    if (!data) {
      res.status(404).json({ message: 'No week found' });
      return;
    }

    const buffer = await generateWeeklyExport({
      dashboard: [],
      employeeUtilization: [],
      projectWise: [],
      leadSummary: [],
      freeResources: [],
      overbookedResources: [],
      employeeWise: data.employeeWise,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=employee-wise-${data.week.weekName}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to generate Excel report' });
  }
}

export async function exportProjectWise(req: Request, res: Response): Promise<void> {
  try {
    const data = await getReportData(req.query.weekId as string | undefined);
    if (!data) {
      res.status(404).json({ message: 'No week found' });
      return;
    }

    const buffer = await generateWeeklyExport({
      dashboard: [],
      employeeUtilization: [],
      projectWise: data.projectWise,
      leadSummary: [],
      freeResources: [],
      overbookedResources: [],
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=project-wise-${data.week.weekName}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to generate Excel report' });
  }
}

export async function exportMonthlyPayroll(req: Request, res: Response): Promise<void> {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    const totalWorkingDays = await getWorkingDaysInMonth(year, month);

    const employees = await Employee.find({ status: 'active' }).sort({ name: 1 });

    const leaves = await Leave.find({
      status: { $in: ['approved', 'pending'] },
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart },
    })
      .populate('employeeId', 'name employeeCode department')
      .populate('approvedBy', 'name');

    // Group by employee
    const leaveMap = new Map<string, typeof leaves>();
    for (const l of leaves) {
      const empId = l.employeeId._id.toString();
      if (!leaveMap.has(empId)) leaveMap.set(empId, []);
      leaveMap.get(empId)!.push(l);
    }

    const rows: Record<string, unknown>[] = [];
    const detailRows: Record<string, unknown>[] = [];

    for (const emp of employees) {
      const empLeaves = leaveMap.get(emp._id.toString()) || [];
      let totalLeaveDays = 0;
      let totalLopDays = 0;

      for (const l of empLeaves) {
        const overlapDays = await countLeaveDaysInMonth(
          new Date(l.startDate), new Date(l.endDate), monthStart, monthEnd
        );
        if (overlapDays === 0) continue;
        totalLeaveDays += overlapDays;
        if (l.isLop) totalLopDays += overlapDays;

        detailRows.push({
          employee: emp.name,
          code: emp.employeeCode || '-',
          department: emp.department || '-',
          type: l.type,
          startDate: l.startDate.toISOString().split('T')[0],
          endDate: l.endDate.toISOString().split('T')[0],
          days: overlapDays,
          status: l.status,
          isLop: l.isLop ? 'Yes' : 'No',
          approvedBy: (l.approvedBy as { name?: string })?.name || '-',
        });
      }

      rows.push({
        employee: emp.name,
        code: emp.employeeCode || '-',
        department: emp.department || '-',
        leaveDays: totalLeaveDays,
        lopDays: totalLopDays,
        netPayableDays: totalWorkingDays - totalLopDays,
      });
    }

    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    const buffer = await generatePayrollExport({
      month: `${monthName} ${year}`,
      summary: rows,
      details: detailRows,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=payroll-${monthName.toLowerCase()}-${year}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Payroll export error:', error);
    res.status(500).json({ message: 'Failed to generate payroll export' });
  }
}
