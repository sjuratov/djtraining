import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById } from '../models/user-store.js';

interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getSecret()) as JwtPayload;
    const currentUser = getUserById(decoded.sub);
    if (!currentUser || currentUser.status !== 'active') {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    req.user = {
      sub: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

export function requireRole(role: 'admin' | 'user') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
