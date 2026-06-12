import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { Role, IRole } from '../models/Role';

export interface AuthRequest extends Request {
  user?: IUser;
  permissions?: string[];
}

interface JwtPayload {
  userId: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.userId)
      .select('-passwordHash')
      .populate('roleId');

    if (!user || user.status !== 'active') {
      res.status(401).json({ message: 'User not found or inactive' });
      return;
    }

    const role = user.roleId as unknown as IRole | undefined;
    if (!role || role.status !== 'active') {
      res.status(401).json({ message: 'User role not found or inactive' });
      return;
    }

    req.user = user;
    req.permissions = role.permissions || [];
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Middleware that checks if the authenticated user has the required permission.
 * Permissions are loaded from the user's role document.
 */
export function requirePermission(...permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!req.permissions || req.permissions.length === 0) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    const hasPermission = permissions.some((p) => req.permissions!.includes(p));
    if (!hasPermission) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
