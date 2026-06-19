import { Request, Response } from 'express';
import { Allocation } from '../models/Allocation';
import { Week } from '../models/Week';
import { calculateAllocatedWH, getEmployeeTotalAllocatedWH } from '../utils/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { weekId, projectLeadId, projectId, employeeId } = req.query;
    const filter: Record<string, unknown> = {};

    if (weekId) filter.weekId = weekId;
    if (projectLeadId) filter.projectLeadId = projectLeadId;
    if (projectId) filter.projectId = projectId;
    if (employeeId) filter.employeeId = employeeId;

    const allocations = await Allocation.find(filter)
      .populate('projectLeadId', 'name designation')
      .populate('projectId', 'name')
      .populate('employeeId', 'name')
      .populate('weekId', 'weekName hoursPerDay');

    res.json({ allocations });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const allocation = await Allocation.findById(req.params.id)
      .populate('projectLeadId', 'name designation')
      .populate('projectId', 'name')
      .populate('employeeId', 'name')
      .populate('weekId', 'weekName hoursPerDay');

    if (!allocation) {
      res.status(404).json({ message: 'Allocation not found' });
      return;
    }
    res.json({ allocation });
  } catch (error) {
    console.error('Error in getAll:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;

    // Get week info for hoursPerDay
    const week = await Week.findById(data.weekId);
    if (!week) {
      res.status(404).json({ message: 'Week not found' });
      return;
    }

    // Calculate allocated WH
    data.allocatedWH = calculateAllocatedWH(data.allocatedDays, data.extraHours, week.hoursPerDay);

    // Check if employee exceeds weekly capacity
    const currentTotal = await getEmployeeTotalAllocatedWH(data.employeeId, data.weekId);
    const newTotal = currentTotal + data.allocatedWH;
    const isOverbooked = newTotal > week.weeklyCapacity;

    const allocation = await new Allocation(data).save();
    await allocation.populate([
      { path: 'projectLeadId', select: 'name' },
      { path: 'projectId', select: 'name' },
      { path: 'employeeId', select: 'name' },
      { path: 'weekId', select: 'weekName hoursPerDay weeklyCapacity' },
    ]);

    res.status(201).json({
      allocation,
      warning: isOverbooked
        ? `Employee would exceed weekly capacity (${week.weeklyCapacity} WH). Total after this allocation: ${newTotal} WH`
        : undefined,
    });
  } catch (error) {
    console.error('Error in create:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;

    // Get current allocation for week info
    const existing = await Allocation.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ message: 'Allocation not found' });
      return;
    }

    // If days or extra hours changed, recalculate WH
    if (data.allocatedDays !== undefined || data.extraHours !== undefined) {
      const week = await Week.findById(data.weekId || existing.weekId);
      if (!week) {
        res.status(404).json({ message: 'Week not found' });
        return;
      }

      const allocatedDays = data.allocatedDays ?? existing.allocatedDays;
      const extraHours = data.extraHours ?? existing.extraHours;
      data.allocatedWH = calculateAllocatedWH(allocatedDays, extraHours, week.hoursPerDay);
    }

    const allocation = await Allocation.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    })
      .populate('projectLeadId', 'name designation')
      .populate('projectId', 'name')
      .populate('employeeId', 'name')
      .populate('weekId', 'weekName hoursPerDay weeklyCapacity');

    if (!allocation) {
      res.status(404).json({ message: 'Allocation not found' });
      return;
    }

    const week = await Week.findById(allocation.weekId._id);
    const totalAllocated = await getEmployeeTotalAllocatedWH(
      allocation.employeeId._id.toString(),
      allocation.weekId._id.toString(),
      allocation._id.toString()
    );
    const isOverbooked = week && totalAllocated > week.weeklyCapacity;

    res.json({
      allocation,
      warning: isOverbooked
        ? `Employee exceeds weekly capacity (${week!.weeklyCapacity} WH). Total: ${totalAllocated} WH`
        : undefined,
    });
  } catch (error) {
    console.error('Error in update:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const allocation = await Allocation.findByIdAndDelete(req.params.id);
    if (!allocation) {
      res.status(404).json({ message: 'Allocation not found' });
      return;
    }
    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function toggleStatus(req: Request, res: Response): Promise<void> {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      res.status(404).json({ message: 'Allocation not found' });
      return;
    }
    allocation.status = allocation.status === 'active' ? 'inactive' : 'active';
    await allocation.save();
    await allocation.populate([
      { path: 'projectLeadId', select: 'name' },
      { path: 'projectId', select: 'name' },
      { path: 'employeeId', select: 'name' },
      { path: 'weekId', select: 'weekName hoursPerDay weeklyCapacity' },
    ]);
    res.json({ allocation });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function bulkCreate(req: Request, res: Response): Promise<void> {
  try {
    const { allocations: allocationsData } = req.body;

    if (!allocationsData || allocationsData.length === 0) {
      res.status(400).json({ message: 'No allocations provided' });
      return;
    }

    // Get week info for calculations
    const week = await Week.findById(allocationsData[0].weekId);
    if (!week) {
      res.status(404).json({ message: 'Week not found' });
      return;
    }

    const enriched = allocationsData.map((a: Record<string, unknown>) => ({
      ...a,
      allocatedWH: calculateAllocatedWH(
        a.allocatedDays as number,
        (a.extraHours as number) || 0,
        week.hoursPerDay
      ),
    }));

    const created = await Allocation.insertMany(enriched);
    const populated = await Allocation.find({ _id: { $in: created.map((c) => c._id) } })
      .populate('projectLeadId', 'name designation')
      .populate('projectId', 'name')
      .populate('employeeId', 'name')
      .populate('weekId', 'weekName');

    res.status(201).json({ allocations: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
