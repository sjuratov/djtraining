import { type Express, type Request, type Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  getAllPackageDefinitions,
  getPackageDefinitionById,
  createPackageDefinition,
  updatePackageDefinition,
  getClientPackages,
  assignPackage,
  adjustRemainingSessions,
  getPackagesOverview,
} from '../services/packages.js';

function isAdjustError(result: unknown): result is { error: string } {
  return typeof result === 'object' && result !== null && 'error' in result;
}

export function mapPackageEndpoints(app: Express): void {
  // ── Admin: Package Definitions ──

  app.get('/api/admin/package-definitions', authMiddleware, requireRole('admin'), (_req: Request, res: Response) => {
    const definitions = getAllPackageDefinitions(true);
    res.json(definitions);
  });

  app.post('/api/admin/package-definitions', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
    const { name, trainingCategory, totalSessions, priceChf, validityDays } = req.body;
    if (!name || !trainingCategory || totalSessions === undefined || priceChf === undefined) {
      res.status(400).json({ error: 'Name, Trainingskategorie, Sitzungen und Preis sind erforderlich' });
      return;
    }

    const validCategories = ['personal', 'gruppe', 'ernaehrung'];
    if (!validCategories.includes(trainingCategory)) {
      res.status(400).json({ error: 'Ungültige Trainingskategorie' });
      return;
    }

    const definition = createPackageDefinition({ name, trainingCategory, totalSessions, priceChf, validityDays });
    res.status(201).json(definition);
  });

  app.put('/api/admin/package-definitions/:id', authMiddleware, requireRole('admin'), (req: Request<{id: string}>, res: Response) => {
    const result = updatePackageDefinition(req.params.id, req.body);
    if (!result) {
      res.status(404).json({ error: 'Paketdefinition nicht gefunden' });
      return;
    }
    res.json(result);
  });

  // ── Admin: Client Packages ──

  app.get('/api/admin/users/:userId/packages', authMiddleware, requireRole('admin'), (req: Request<{userId: string}>, res: Response) => {
    const packages = getClientPackages(req.params.userId);
    res.json(packages);
  });

  app.post('/api/admin/users/:userId/packages', authMiddleware, requireRole('admin'), (req: Request<{userId: string}>, res: Response) => {
    const { packageDefId, notes } = req.body;
    if (!packageDefId) {
      res.status(400).json({ error: 'Paketdefinition-ID ist erforderlich' });
      return;
    }

    const pkgDef = getPackageDefinitionById(packageDefId);
    if (!pkgDef) {
      res.status(404).json({ error: 'Paketdefinition nicht gefunden' });
      return;
    }

    const pkg = assignPackage({ userId: req.params.userId, packageDefId, notes });
    res.status(201).json(pkg);
  });

  app.put('/api/admin/packages/:id/adjust', authMiddleware, requireRole('admin'), (req: Request<{id: string}>, res: Response) => {
    const { delta, reason } = req.body;
    if (typeof delta !== 'number' || typeof reason !== 'string') {
      res.status(400).json({ error: 'Delta (Zahl) und Grund (Text) sind erforderlich' });
      return;
    }

    const result = adjustRemainingSessions(req.params.id, delta, reason);
    if (isAdjustError(result)) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json(result);
  });

  // ── Admin: Overview ──

  app.get('/api/admin/packages/overview', authMiddleware, requireRole('admin'), (_req: Request, res: Response) => {
    const overview = getPackagesOverview();
    res.json(overview);
  });

  // ── Client: My packages ──

  app.get('/api/packages', authMiddleware, (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }
    const packages = getClientPackages(userId, true);
    res.json(packages);
  });
}
