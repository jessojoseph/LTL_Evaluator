import { Request, Response } from 'express';
import { Holiday } from '../models/Holiday';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { year } = req.query;
    const filter: Record<string, unknown> = { isActive: true };
    if (year) filter.year = parseInt(year as string);

    const holidays = await Holiday.find(filter).sort({ date: 1 });
    res.json({ holidays });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      res.status(404).json({ message: 'Holiday not found' });
      return;
    }
    res.json({ holiday });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { date, name, type } = req.body;
    const holidayDate = new Date(date);
    const year = holidayDate.getFullYear();

    // Check for duplicate date
    const existing = await Holiday.findOne({ date: holidayDate });
    if (existing) {
      res.status(409).json({ message: 'A holiday already exists on this date' });
      return;
    }

    const holiday = new Holiday({ date: holidayDate, name, type, year });
    await holiday.save();
    res.status(201).json({ holiday });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { date, name, type } = req.body;
    const updates: Record<string, unknown> = {};
    if (date) {
      updates.date = new Date(date);
      updates.year = new Date(date).getFullYear();
    }
    if (name) updates.name = name;
    if (type) updates.type = type;

    const holiday = await Holiday.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!holiday) {
      res.status(404).json({ message: 'Holiday not found' });
      return;
    }
    res.json({ holiday });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      res.status(404).json({ message: 'Holiday not found' });
      return;
    }
    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
