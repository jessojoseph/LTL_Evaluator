import { Request, Response } from 'express';
import { Week } from '../models/Week';
import { Allocation } from '../models/Allocation';
import { calculateWeeklyCapacity } from '../utils/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const weeks = await Week.find(filter).sort({ startDate: -1 });
    res.json({ weeks });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const week = await Week.findById(req.params.id);
    if (!week) {
      res.status(404).json({ message: 'Week not found' });
      return;
    }
    res.json({ week });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    data.weeklyCapacity = calculateWeeklyCapacity(data.workingDays, data.hoursPerDay);
    const week = new Week(data);
    await week.save();
    res.status(201).json({ week });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;

    // Recalculate capacity if working days or hours changed
    if (data.workingDays || data.hoursPerDay) {
      const existing = await Week.findById(req.params.id);
      if (existing) {
        const workingDays = data.workingDays ?? existing.workingDays;
        const hoursPerDay = data.hoursPerDay ?? existing.hoursPerDay;
        data.weeklyCapacity = calculateWeeklyCapacity(workingDays, hoursPerDay);
      }
    }

    const week = await Week.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!week) {
      res.status(404).json({ message: 'Week not found' });
      return;
    }
    res.json({ week });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const week = await Week.findByIdAndDelete(req.params.id);
    if (!week) {
      res.status(404).json({ message: 'Week not found' });
      return;
    }
    // Also remove associated allocations
    await Allocation.deleteMany({ weekId: week._id });
    res.json({ message: 'Week deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function copyFromPreviousWeek(req: Request, res: Response): Promise<void> {
  try {
    const { id, previousWeekId } = req.params;

    const week = await Week.findById(id);
    if (!week) {
      res.status(404).json({ message: 'Target week not found' });
      return;
    }

    const previousAllocations = await Allocation.find({ weekId: previousWeekId });
    if (previousAllocations.length === 0) {
      res.json({ message: 'No allocations found in previous week', allocations: [] });
      return;
    }

    const newAllocations = previousAllocations.map((alloc) => ({
      weekId: week._id,
      projectLeadId: alloc.projectLeadId,
      projectId: alloc.projectId,
      employeeId: alloc.employeeId,
      allocatedDays: alloc.allocatedDays,
      extraHours: alloc.extraHours,
      allocatedWH: alloc.allocatedWH,
      remarks: alloc.remarks,
    }));

    const created = await Allocation.insertMany(newAllocations);
    const populated = await Allocation.find({ _id: { $in: created.map((c) => c._id) } })
      .populate('projectLeadId', 'name')
      .populate('projectId', 'name')
      .populate('employeeId', 'name');

    res.status(201).json({
      message: `Copied ${created.length} allocations from previous week`,
      allocations: populated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
