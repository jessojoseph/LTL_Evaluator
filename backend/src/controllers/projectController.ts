import { Request, Response } from 'express';
import { Project } from '../models/Project';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { status, leadId, type, search } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (leadId) filter.projectLeadId = leadId;
    if (type) filter.projectType = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(filter).populate('projectLeadId', 'name email');
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findById(req.params.id).populate('projectLeadId', 'name email');
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const project = new Project(req.body);
    await project.save();
    const populated = await project.populate('projectLeadId', 'name email');
    res.status(201).json({ project: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('projectLeadId', 'name email');

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
