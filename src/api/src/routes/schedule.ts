import { type Express, type Request, type Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  getAllTrainingTypes,
  getTrainingTypeById,
  createTrainingType,
  updateTrainingType,
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deactivateTemplate,
  getAvailableSlots,
  getSlotById,
  cancelSlot,
  updateSlot,
  generateSlots,
} from '../services/schedule.js';

export function mapScheduleEndpoints(app: Express): void {
  // ── Public endpoints ──

  app.get('/api/schedule/types', (_req: Request, res: Response) => {
    const types = getAllTrainingTypes(false);
    res.json(types);
  });

  app.get('/api/schedule/slots', (req: Request, res: Response) => {
    const { from, to, category } = req.query;
    if (!from || !to) {
      res.status(400).json({ error: 'Parameter "from" und "to" sind erforderlich' });
      return;
    }
    const slots = getAvailableSlots({
      from: from as string,
      to: to as string,
      category: category as string | undefined,
    });
    res.json(slots);
  });

  // ── Admin: Training Types ──

  app.get('/api/admin/training-types', authMiddleware, requireRole('admin'), (_req: Request, res: Response) => {
    const types = getAllTrainingTypes(true);
    res.json(types);
  });

  app.post('/api/admin/training-types', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
    const { name, category, durationMinutes, maxCapacity, priceSingle } = req.body;

    if (!name || !category || !durationMinutes) {
      res.status(400).json({ error: 'Name, Kategorie und Dauer sind erforderlich' });
      return;
    }

    const validCategories = ['personal', 'gruppe', 'ernaehrung'];
    if (!validCategories.includes(category)) {
      res.status(400).json({ error: `Ungültige Kategorie. Erlaubt: ${validCategories.join(', ')}` });
      return;
    }

    const tt = createTrainingType({
      name,
      category,
      durationMinutes,
      maxCapacity: maxCapacity ?? 1,
      priceSingle: priceSingle ?? null,
    });
    res.status(201).json(tt);
  });

  app.put('/api/admin/training-types/:id', authMiddleware, requireRole('admin'), (req: Request<{id: string}>, res: Response) => {
    const tt = updateTrainingType(req.params.id, req.body);
    if (!tt) {
      res.status(404).json({ error: 'Trainingsart nicht gefunden' });
      return;
    }
    res.json(tt);
  });

  // ── Admin: Schedule Templates ──

  app.get('/api/admin/schedule-templates', authMiddleware, requireRole('admin'), (_req: Request, res: Response) => {
    const templates = getAllTemplates(true);
    res.json(templates);
  });

  app.post('/api/admin/schedule-templates', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
    const { trainingTypeId, dayOfWeek, startTime } = req.body;

    if (!trainingTypeId || dayOfWeek === undefined || !startTime) {
      res.status(400).json({ error: 'Trainingsart, Wochentag und Startzeit sind erforderlich' });
      return;
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({ error: 'Wochentag muss zwischen 0 (Sonntag) und 6 (Samstag) liegen' });
      return;
    }

    const tt = getTrainingTypeById(trainingTypeId);
    if (!tt) {
      res.status(400).json({ error: 'Trainingsart nicht gefunden' });
      return;
    }

    const template = createTemplate({ trainingTypeId, dayOfWeek, startTime });
    res.status(201).json(template);
  });

  app.put('/api/admin/schedule-templates/:id', authMiddleware, requireRole('admin'), (req: Request<{id: string}>, res: Response) => {
    const template = updateTemplate(req.params.id, req.body);
    if (!template) {
      res.status(404).json({ error: 'Vorlage nicht gefunden' });
      return;
    }
    res.json(template);
  });

  app.delete('/api/admin/schedule-templates/:id', authMiddleware, requireRole('admin'), (req: Request<{id: string}>, res: Response) => {
    const template = deactivateTemplate(req.params.id);
    if (!template) {
      res.status(404).json({ error: 'Vorlage nicht gefunden' });
      return;
    }
    res.json(template);
  });

  // ── Admin: Time Slots ──

  app.post('/api/admin/time-slots/:id/cancel', authMiddleware, requireRole('admin'), (req: Request<{id: string}>, res: Response) => {
    const slot = getSlotById(req.params.id);
    if (!slot) {
      res.status(404).json({ error: 'Zeitfenster nicht gefunden' });
      return;
    }
    if (slot.status === 'cancelled') {
      res.status(400).json({ error: 'Zeitfenster bereits abgesagt' });
      return;
    }
    const cancelled = cancelSlot(req.params.id);
    res.json(cancelled);
  });

  app.put('/api/admin/time-slots/:id', authMiddleware, requireRole('admin'), (req: Request<{id: string}>, res: Response) => {
    const slot = updateSlot(req.params.id, req.body);
    if (!slot) {
      res.status(404).json({ error: 'Zeitfenster nicht gefunden' });
      return;
    }
    res.json(slot);
  });

  app.post('/api/admin/generate-slots', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      res.status(400).json({ error: 'Start- und Enddatum sind erforderlich' });
      return;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (from < now) {
      res.status(400).json({ error: 'Kann keine Zeitfenster in der Vergangenheit generieren' });
      return;
    }

    if (to < from) {
      res.status(400).json({ error: 'Enddatum muss nach Startdatum liegen' });
      return;
    }

    const generated = generateSlots({ fromDate, toDate });
    res.status(201).json({ generated: generated.length, slots: generated });
  });
}
