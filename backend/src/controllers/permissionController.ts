import { Request, Response } from 'express';
import { Permission } from '../models/Permission';
import { defaultPermissions } from '../seeds/defaultPermissions';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { status, module } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (module) filter.module = module;

    const permissions = await Permission.find(filter).sort({ module: 1, name: 1 });
    res.json({ permissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      res.status(404).json({ message: 'Permission not found' });
      return;
    }
    res.json({ permission });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const permission = new Permission(req.body);
    await permission.save();
    res.status(201).json({ permission });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'Permission with this name already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const permission = await Permission.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!permission) {
      res.status(404).json({ message: 'Permission not found' });
      return;
    }
    res.json({ permission });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'Permission with this name already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      res.status(404).json({ message: 'Permission not found' });
      return;
    }

    if (permission.isSystem) {
      res.status(403).json({ message: 'System permissions cannot be deleted' });
      return;
    }

    await Permission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function seed(_req: Request, res: Response): Promise<void> {
  try {
    const existingCount = await Permission.countDocuments();
    if (existingCount > 0) {
      res.json({ message: 'Permissions already seeded', count: existingCount });
      return;
    }

    await Permission.insertMany(defaultPermissions);
    res.status(201).json({
      message: 'Default permissions seeded successfully',
      count: defaultPermissions.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
