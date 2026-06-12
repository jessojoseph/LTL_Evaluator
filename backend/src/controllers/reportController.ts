import { Request, Response } from 'express';
import { Allocation } from '../models/Allocation';
import { Week } from '../models/Week';
import { Employee } from '../models/Employee';
import { Project } from '../models/Project';
import { ProjectLead } from '../models/ProjectLead';
import {
  calculateFreeWH,
  calculateOverbookedWH,
  calculateUtilization,
} from '../utils/helpers';

import { PopulatedDoc, AllocationPopulated } from '../types';

export async function dashboard(req: Request, res: Response): Promise<void> {
  try {
    const { weekId } = req.query;

    let week;
    if (weekId) {
      week = await Week.findById(weekId);
    } else {
      week = await Week.findOne().sort({ startDate: -1 });
    }

    if (!week) {
      res.json({
        totalEmployees: await Employee.countDocuments({ status: 'active' }),
        totalProjects: await Project.countDocuments({ status: 'active' }),
        totalWeeklyCapacity: 0,
        totalAllocatedWH: 0,
        totalFreeWH: 0,
        totalOverbookedWH: 0,
        averageUtilization: 0,
      });
      return;
    }

    const allocations = await Allocation.find({ weekId: week._id });
    const totalAllocatedWH = allocations.reduce((sum, a) => sum + a.allocatedWH, 0);
    const totalWeeklyCapacity = week.weeklyCapacity;
    const totalFreeWH = calculateFreeWH(totalWeeklyCapacity, totalAllocatedWH);
    const totalOverbookedWH = calculateOverbookedWH(totalWeeklyCapacity, totalAllocatedWH);
    const averageUtilization = calculateUtilization(totalAllocatedWH, totalWeeklyCapacity);
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const totalProjects = await Project.countDocuments({ status: { $ne: 'completed' } });

    // Lead-wise allocation
    const leadWiseAllocation = await Allocation.aggregate([
      { $match: { weekId: week._id } },
      { $group: { _id: '$projectLeadId', totalWH: { $sum: '$allocatedWH' } } },
      {
        $lookup: {
          from: 'projectleads',
          localField: '_id',
          foreignField: '_id',
          as: 'lead',
        },
      },
      { $unwind: { path: '$lead', preserveNullAndEmptyArrays: true } },
      { $project: { leadName: '$lead.name', totalWH: 1 } },
    ]);

    // Project-wise allocation
    const projectWiseAllocation = await Allocation.aggregate([
      { $match: { weekId: week._id } },
      { $group: { _id: '$projectId', totalWH: { $sum: '$allocatedWH' } } },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project',
        },
      },
      { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
      { $project: { projectName: '$project.name', totalWH: 1 } },
    ]);

    res.json({
      week: { id: week._id, name: week.weekName },
      totalEmployees,
      totalProjects,
      totalWeeklyCapacity,
      totalAllocatedWH,
      totalFreeWH,
      totalOverbookedWH,
      averageUtilization: Math.round(averageUtilization * 100) / 100,
      leadWiseAllocation,
      projectWiseAllocation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function employeeUtilization(req: Request, res: Response): Promise<void> {
  try {
    const { weekId, leadId, employeeId, status } = req.query;

    let week;
    if (weekId) {
      week = await Week.findById(weekId);
    } else {
      week = await Week.findOne().sort({ startDate: -1 });
    }

    if (!week) {
      res.json({ report: [] });
      return;
    }

    const employees = await Employee.find({ status: 'active' }).populate('defaultLeadId', 'name');
    const allocations = await Allocation.find({ weekId: week._id });

    const employeeMap = new Map<
      string,
      {
        employee: string;
        lead: string;
        capacityWH: number;
        allocatedWH: number;
        freeWH: number;
        overbookedWH: number;
        utilization: number;
        statusLabel: string;
        color: string;
      }
    >();

    for (const emp of employees) {
      const empAllocations = allocations.filter(
        (a) => a.employeeId.toString() === emp._id.toString()
      );
      const allocatedWH = empAllocations.reduce((sum, a) => sum + a.allocatedWH, 0);
      const capacityWH = week.weeklyCapacity;
      const freeWH = calculateFreeWH(capacityWH, allocatedWH);
      const overbookedWH = calculateOverbookedWH(capacityWH, allocatedWH);
      const utilization = calculateUtilization(allocatedWH, capacityWH);
      const { label: statusLabel, color } = utilization === 0
        ? { label: 'No Allocation', color: 'grey' }
        : utilization < 50
        ? { label: 'Underutilized', color: 'yellow' }
        : utilization <= 100
        ? { label: 'Normal', color: 'green' }
        : { label: 'Overbooked', color: 'red' };

      const defaultLead = emp.defaultLeadId as PopulatedDoc | null;
      employeeMap.set(emp._id.toString(), {
        employee: emp.name,
        lead: defaultLead?.name || '-',
        capacityWH,
        allocatedWH,
        freeWH,
        overbookedWH,
        utilization: Math.round(utilization * 100) / 100,
        statusLabel,
        color,
      });
    }

    let report = Array.from(employeeMap.values());

    // Apply filters
    if (leadId) {
      report = report.filter((r) => r.lead.toLowerCase().includes((leadId as string).toLowerCase()));
    }
    if (employeeId) {
      report = report.filter((r) =>
        r.employee.toLowerCase().includes((employeeId as string).toLowerCase())
      );
    }
    if (status) {
      report = report.filter((r) => r.statusLabel.toLowerCase() === (status as string).toLowerCase());
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function projectWise(req: Request, res: Response): Promise<void> {
  try {
    const { weekId } = req.query;

    let week;
    if (weekId) {
      week = await Week.findById(weekId);
    } else {
      week = await Week.findOne().sort({ startDate: -1 });
    }

    if (!week) {
      res.json({ report: [] });
      return;
    }

    const allocations = (await Allocation.find({ weekId: week._id })
      .populate('projectLeadId', 'name')
      .populate('projectId', 'name')
      .populate('employeeId', 'name')) as unknown as AllocationPopulated[];

    const report = allocations.map((a) => ({
      projectLead: a.projectLeadId.name || '',
      project: a.projectId.name || '',
      employee: a.employeeId.name || '',
      days: a.allocatedDays,
      extraHours: a.extraHours,
      allocatedWH: a.allocatedWH,
    }));

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function leadSummary(req: Request, res: Response): Promise<void> {
  try {
    const { weekId } = req.query;

    let week;
    if (weekId) {
      week = await Week.findById(weekId);
    } else {
      week = await Week.findOne().sort({ startDate: -1 });
    }

    if (!week) {
      res.json({ report: [] });
      return;
    }

    const leads = await ProjectLead.find({ status: 'active' });
    const allocations = (await Allocation.find({ weekId: week._id })
      .populate('projectLeadId', 'name')
      .populate('projectId', 'name')
      .populate('employeeId', 'name')) as unknown as AllocationPopulated[];

    const report = leads.map((lead) => {
      const leadAllocations = allocations.filter(
        (a) => a.projectLeadId._id.toString() === lead._id.toString()
      );

      const uniqueProjects = new Set(leadAllocations.map((a) => a.projectId.name));
      const uniqueEmployees = new Set(leadAllocations.map((a) => a.employeeId.name));
      const totalAllocatedWH = leadAllocations.reduce((sum, a) => sum + a.allocatedWH, 0);
      const totalCapacity = uniqueEmployees.size * week.weeklyCapacity;

      return {
        projectLead: lead.name,
        projectCount: uniqueProjects.size,
        employeeCount: uniqueEmployees.size,
        totalCapacity,
        allocatedWH: totalAllocatedWH,
        freeWH: calculateFreeWH(totalCapacity, totalAllocatedWH),
        utilization: Math.round(calculateUtilization(totalAllocatedWH, totalCapacity) * 100) / 100,
      };
    });

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function freeResources(req: Request, res: Response): Promise<void> {
  try {
    const { weekId } = req.query;

    let week;
    if (weekId) {
      week = await Week.findById(weekId);
    } else {
      week = await Week.findOne().sort({ startDate: -1 });
    }

    if (!week) {
      res.json({ report: [] });
      return;
    }

    const employees = await Employee.find({ status: 'active' }).populate('defaultLeadId', 'name');
    const allocations = await Allocation.find({ weekId: week._id });

    const report = employees
      .map((emp) => {
        const allocatedWH = allocations
          .filter((a) => a.employeeId.toString() === emp._id.toString())
          .reduce((sum, a) => sum + a.allocatedWH, 0);
        const freeWH = calculateFreeWH(week.weeklyCapacity, allocatedWH);
        const defaultLead = emp.defaultLeadId as PopulatedDoc | null;

        return {
          employee: emp.name,
          lead: defaultLead?.name || '-',
          capacityWH: week.weeklyCapacity,
          allocatedWH,
          freeWH,
        };
      })
      .filter((r) => r.freeWH > 0);

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function overbookedResources(req: Request, res: Response): Promise<void> {
  try {
    const { weekId } = req.query;

    let week;
    if (weekId) {
      week = await Week.findById(weekId);
    } else {
      week = await Week.findOne().sort({ startDate: -1 });
    }

    if (!week) {
      res.json({ report: [] });
      return;
    }

    const allocations = (await Allocation.find({ weekId: week._id })
      .populate('employeeId', 'name')
      .populate('projectId', 'name')) as unknown as AllocationPopulated[];

    const employeeMap = new Map<
      string,
      { employee: string; capacityWH: number; allocatedWH: number; overbookedWH: number; projects: string[] }
    >();

    for (const alloc of allocations) {
      const empId = alloc.employeeId._id.toString();
      const empName = alloc.employeeId.name || '';
      const projectName = alloc.projectId.name || '';

      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employee: empName,
          capacityWH: week.weeklyCapacity,
          allocatedWH: 0,
          overbookedWH: 0,
          projects: [],
        });
      }

      const entry = employeeMap.get(empId)!;
      entry.allocatedWH += alloc.allocatedWH;
      entry.projects.push(projectName);
    }

    const report = Array.from(employeeMap.values())
      .map((entry) => ({
        ...entry,
        overbookedWH: calculateOverbookedWH(entry.capacityWH, entry.allocatedWH),
      }))
      .filter((entry) => entry.overbookedWH > 0);

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function weekComparison(req: Request, res: Response): Promise<void> {
  try {
    const { weekIds } = req.query;

    if (!weekIds) {
      res.status(400).json({ message: 'weekIds query parameter is required (comma-separated)' });
      return;
    }

    const weekIdArray = (weekIds as string).split(',').filter(Boolean);
    const weeks = await Week.find({ _id: { $in: weekIdArray } }).sort({ startDate: 1 });

    if (weeks.length === 0) {
      res.json({ weeks: [], report: [] });
      return;
    }

    const employees = await Employee.find({ status: 'active' });

    // Build employee-week matrix
    const employeeWeekMap: Record<string, Record<string, number>> = {};

    for (const week of weeks) {
      const allocations = await Allocation.find({ weekId: week._id });
      for (const alloc of allocations) {
        const empId = alloc.employeeId.toString();
        if (!employeeWeekMap[empId]) {
          employeeWeekMap[empId] = {};
        }
        employeeWeekMap[empId][week._id.toString()] =
          (employeeWeekMap[empId][week._id.toString()] || 0) + alloc.allocatedWH;
      }
    }

    const enhancedReport = employees.map((emp) => {
      const row: Record<string, string | number> = { employee: emp.name };
      let prevWH = 0;

      weeks.forEach((week, index) => {
        const wh = employeeWeekMap[emp._id.toString()]?.[week._id.toString()] || 0;
        row[week.weekName] = wh;

        if (index === 0) {
          row['difference'] = 0;
        } else {
          row['difference'] = Math.round((wh - prevWH) * 100) / 100;
        }
        prevWH = wh;
      });

      return row;
    });

    res.json({
      weeks: weeks.map((w) => ({ id: w._id, name: w.weekName })),
      report: enhancedReport,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
