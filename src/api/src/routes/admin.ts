import { type Express } from 'express';
import { getAllUsers } from '../models/user-store.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

export function mapAdminEndpoints(app: Express): void {
  app.get('/api/admin/users', authMiddleware, requireRole('admin'), (_req, res) => {
    const users = getAllUsers().map(u => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      authProvider: u.authProvider,
      status: u.status,
      createdAt: u.createdAt,
      hasProfile: u.profile !== null,
    }));
    res.status(200).json(users);
  });
}
