import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth';

function parseJwtExpiry(expiry: string): number {
  // Supports format like '7d', '24h', '30m', '60s', or a plain number string
  const match = expiry.match(/^(\d+)\s*(d|h|m|s)?$/);
  if (!match) return 7 * 24 * 60 * 60; // default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2] || 'd';

  switch (unit) {
    case 'd': return value * 24 * 60 * 60;
    case 'h': return value * 60 * 60;
    case 'm': return value * 60;
    case 's': return value;
    default: return 7 * 24 * 60 * 60;
  }
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, status: 'active' }).populate('roleId');
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const role = user.roleId as unknown as { name: string; permissions: string[] } | null;
    const roleName = role?.name || 'Unknown';
    const permissions = role?.permissions || [];

    const expiresInSeconds = parseJwtExpiry(env.jwtExpiresIn);
    const token = jwt.sign(
      { userId: user._id.toString() },
      env.jwtSecret,
      { expiresIn: expiresInSeconds }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: roleName,
        permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function logout(_req: AuthRequest, res: Response): Promise<void> {
  // For JWT, logout is handled client-side by discarding the token
  res.json({ message: 'Logged out successfully' });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user?._id)
      .select('-passwordHash')
      .populate('roleId');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const role = user.roleId as unknown as { name: string; permissions: string[] } | null;

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role?.name || 'Unknown',
        permissions: role?.permissions || [],
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
