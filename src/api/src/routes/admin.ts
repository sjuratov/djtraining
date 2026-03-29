import { type Express } from 'express';
import { getAllUsers, getUserById, setUserRole } from '../models/user-store.js';
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

  app.post('/api/admin/users/:userId/promote', authMiddleware, requireRole('admin'), (req, res) => {
    const user = getUserById(req.params.userId as string);
    if (!user) {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
      return;
    }
    if (user.role === 'admin') {
      res.status(400).json({ error: 'Benutzer ist bereits Admin' });
      return;
    }
    setUserRole(user.id, 'admin');
    res.json({ message: 'Benutzer zum Admin befördert', role: 'admin' });
  });

  app.post('/api/admin/users/:userId/demote', authMiddleware, requireRole('admin'), (req, res) => {
    if ((req.params.userId as string) === req.user!.sub) {
      res.status(400).json({ error: 'Du kannst dich nicht selbst herabstufen' });
      return;
    }
    const user = getUserById(req.params.userId as string);
    if (!user) {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
      return;
    }
    if (user.role === 'user') {
      res.status(400).json({ error: 'Benutzer ist kein Admin' });
      return;
    }
    setUserRole(user.id, 'user');
    res.json({ message: 'Admin-Rechte entzogen', role: 'user' });
  });
}
