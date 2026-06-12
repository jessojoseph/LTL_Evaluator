import { Request, Response } from 'express';
import { ProjectLead } from '../models/ProjectLead';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { status, search } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await ProjectLead.find(filter);
    res.json({ leads });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const lead = await ProjectLead.findById(req.params.id);
    if (!lead) {
      res.status(404).json({ message: 'Project lead not found' });
      return;
    }
    res.json({ lead });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const lead = new ProjectLead(req.body);
    await lead.save();
    res.status(201).json({ lead });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'Project lead with this email already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const lead = await ProjectLead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!lead) {
      res.status(404).json({ message: 'Project lead not found' });
      return;
    }
    res.json({ lead });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'Project lead with this email already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const lead = await ProjectLead.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    if (!lead) {
      res.status(404).json({ message: 'Project lead not found' });
      return;
    }
    res.json({ message: 'Project lead deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
