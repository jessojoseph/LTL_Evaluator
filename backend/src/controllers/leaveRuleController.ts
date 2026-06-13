import { Request, Response } from 'express';
import { LeaveRule } from '../models/LeaveRule';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { employmentType, isActive } = req.query;
    const filter: Record<string, unknown> = {};
    if (employmentType) filter.employmentType = employmentType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const rules = await LeaveRule.find(filter).sort({ employmentType: 1, leaveType: 1 });
    res.json({ rules });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const rule = await LeaveRule.findById(req.params.id);
    if (!rule) {
      res.status(404).json({ message: 'Leave rule not found' });
      return;
    }
    res.json({ rule });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const rule = new LeaveRule(req.body);
    await rule.save();
    res.status(201).json({ rule });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'A rule for this employment type and leave type already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const rule = await LeaveRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rule) {
      res.status(404).json({ message: 'Leave rule not found' });
      return;
    }
    res.json({ rule });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'A rule for this employment type and leave type already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const rule = await LeaveRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      res.status(404).json({ message: 'Leave rule not found' });
      return;
    }
    res.json({ message: 'Leave rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
