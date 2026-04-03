import { type Express, type Request, type Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAdminBookings,
  updateBookingStatus,
  isWithin24Hours,
} from '../services/booking.js';
import type { CreateBookingError, CancelBookingError } from '../services/booking.js';

function isBookingError(result: unknown): result is CreateBookingError | CancelBookingError {
  return typeof result === 'object' && result !== null && 'code' in result;
}

const errorStatusMap: Record<string, number> = {
  SLOT_NOT_FOUND: 404,
  SLOT_CANCELLED: 400,
  SLOT_FULL: 409,
  DOUBLE_BOOKING: 409,
  PAST_SLOT: 400,
  NOT_FOUND: 404,
  ALREADY_CANCELLED: 400,
  NOT_AUTHORIZED: 403,
};

export function mapBookingEndpoints(app: Express): void {
  // ── Client: Create booking ──

  app.post('/api/bookings', authMiddleware, (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }

    const { timeSlotId, notes } = req.body;
    if (!timeSlotId) {
      res.status(400).json({ error: 'Zeitfenster-ID ist erforderlich' });
      return;
    }

    const result = createBooking({ userId, timeSlotId, bookedBy: userId, notes });
    if (isBookingError(result)) {
      const status = errorStatusMap[result.code] || 400;
      res.status(status).json({ error: result.message, code: result.code });
      return;
    }

    res.status(201).json(result);
  });

  // ── Client: List bookings ──

  app.get('/api/bookings', authMiddleware, (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }

    const status = req.query.status as string | undefined;
    const upcoming = req.query.upcoming === 'true';
    const bookings = getUserBookings(userId, { status, upcoming });
    res.json(bookings);
  });

  // ── Client: Cancel booking ──

  app.delete('/api/bookings/:id', authMiddleware, (req: Request<{id: string}>, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }

    const booking = getBookingById(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Buchung nicht gefunden' });
      return;
    }

    // Include 24h warning info in response
    const within24h = booking.slotDate && booking.slotStartTime
      ? isWithin24Hours(booking.slotDate, booking.slotStartTime)
      : false;

    const reason = req.body?.reason as string | undefined;
    const result = cancelBooking(req.params.id, { userId, isAdmin: false, reason });
    if (isBookingError(result)) {
      const status = errorStatusMap[result.code] || 400;
      res.status(status).json({ error: result.message, code: result.code });
      return;
    }

    res.json({ ...result, within24hWarning: within24h });
  });

  // ── Admin: List all bookings ──

  app.get('/api/admin/bookings', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const userId = req.query.userId as string | undefined;
    const category = req.query.category as string | undefined;
    const bookings = getAdminBookings({ from, to, userId, category });
    res.json(bookings);
  });

  // ── Admin: Book on behalf of client ──

  app.post('/api/admin/bookings', authMiddleware, requireRole('admin'), (req: Request, res: Response) => {
    const adminId = req.user?.sub;
    if (!adminId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }

    const { userId, timeSlotId, notes } = req.body;
    if (!userId || !timeSlotId) {
      res.status(400).json({ error: 'Benutzer-ID und Zeitfenster-ID sind erforderlich' });
      return;
    }

    const result = createBooking({ userId, timeSlotId, bookedBy: adminId, notes });
    if (isBookingError(result)) {
      const status = errorStatusMap[result.code] || 400;
      res.status(status).json({ error: result.message, code: result.code });
      return;
    }

    res.status(201).json(result);
  });

  // ── Admin: Cancel any booking ──

  app.delete('/api/admin/bookings/:id', authMiddleware, requireRole('admin'), (req: Request<{id: string}>, res: Response) => {
    const adminId = req.user?.sub;
    if (!adminId) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }

    const reason = req.body?.reason as string | undefined;
    const result = cancelBooking(req.params.id, { userId: adminId, isAdmin: true, reason });
    if (isBookingError(result)) {
      const status = errorStatusMap[result.code] || 400;
      res.status(status).json({ error: result.message, code: result.code });
      return;
    }

    res.json(result);
  });

  // ── Admin: Update booking status ──

  app.put('/api/admin/bookings/:id/status', authMiddleware, requireRole('admin'), (req: Request<{id: string}>, res: Response) => {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'cancelled', 'completed', 'no-show'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Ungültiger Status' });
      return;
    }

    const result = updateBookingStatus(req.params.id, status);
    if (!result) {
      res.status(404).json({ error: 'Buchung nicht gefunden' });
      return;
    }

    res.json(result);
  });
}
