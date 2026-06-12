import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;

    const users = await User.find(filter)
      .select('-passwordHash')
      .populate('roleId', 'name permissions');

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate('roleId', 'name permissions');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, roleId } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({ name, email, passwordHash, roleId });
    await user.save();

    const populated = await User.findById(user._id)
      .select('-passwordHash')
      .populate('roleId', 'name permissions');

    res.status(201).json({ user: populated });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    // Whitelist allowed fields to prevent field injection
    const { name, email, password, roleId, status } = req.body;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (roleId !== undefined) data.roleId = roleId;
    if (status !== undefined) data.status = status;

    // Hash password if provided
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    })
      .select('-passwordHash')
      .populate('roleId', 'name permissions');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function toggleStatus(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    const populated = await User.findById(user._id)
      .select('-passwordHash')
      .populate('roleId', 'name permissions');

    res.json({ user: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
