import { Request, Response } from 'express';
import { Role } from '../models/Role';
import { defaultRoles } from '../seeds/defaultRoles';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const roles = await Role.find(filter).sort({ name: 1 });
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }
    res.json({ role });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const role = new Role(req.body);
    await role.save();
    res.status(201).json({ role });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'Role with this name already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }
    res.json({ role });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'Role with this name already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    if (role.isSystem) {
      res.status(403).json({ message: 'System roles cannot be deactivated' });
      return;
    }

    role.status = 'inactive';
    await role.save();
    res.json({ message: 'Role deactivated successfully', role });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function toggleStatus(req: Request, res: Response): Promise<void> {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }
    role.status = role.status === 'active' ? 'inactive' : 'active';
    await role.save();
    res.json({ role });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
