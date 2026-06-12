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

    const projects = await Project.find(filter).populate('projectLeadId', 'name');
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findById(req.params.id).populate('projectLeadId', 'name');
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
    const populated = await project.populate('projectLeadId', 'name');
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
    }).populate('projectLeadId', 'name');

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
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json({ message: 'Project deactivated successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function toggleStatus(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    project.isActive = !project.isActive;
    await project.save();
    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
