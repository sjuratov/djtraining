import crypto from 'node:crypto';
import { getDb } from '../db/database.js';
import { getSlotById, updateSlot } from './schedule.js';
import type { TimeSlot } from './schedule.js';
import { getActivePackageForBooking, deductSession, getPackageForCreditBack, creditSession } from './packages.js';

// ── Types ──

export interface Booking {
  id: string;
  userId: string;
  timeSlotId: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  bookedBy: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  slotDate?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  trainingTypeName?: string;
  trainingTypeCategory?: string;
}

export interface SlotBooking extends Booking {
  userEmail?: string;
  userDisplayName?: string;
}

interface BookingRow {
  id: string;
  user_id: string;
  time_slot_id: string;
  status: string;
  booked_by: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  slot_date?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  training_type_name?: string;
  training_type_category?: string;
}

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    userId: row.user_id,
    timeSlotId: row.time_slot_id,
    status: row.status as Booking['status'],
    bookedBy: row.booked_by,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slotDate: row.slot_date,
    slotStartTime: row.slot_start_time,
    slotEndTime: row.slot_end_time,
    trainingTypeName: row.training_type_name,
    trainingTypeCategory: row.training_type_category,
  };
}

// ── Booking queries ──

function getActiveBookingCount(timeSlotId: string): number {
  const db = getDb();
  const result = db.prepare(
    "SELECT COUNT(*) as count FROM bookings WHERE time_slot_id = ? AND status = 'confirmed'"
  ).get(timeSlotId) as { count: number };
  return result.count;
}

function hasActiveBooking(userId: string, timeSlotId: string): boolean {
  const db = getDb();
  const row = db.prepare(
    "SELECT 1 FROM bookings WHERE user_id = ? AND time_slot_id = ? AND status = 'confirmed'"
  ).get(userId, timeSlotId);
  return !!row;
}

function updateSlotCapacityStatus(slot: TimeSlot): void {
  const count = getActiveBookingCount(slot.id);
  if (count >= slot.maxCapacity && slot.status === 'available') {
    updateSlot(slot.id, { status: 'full' });
  } else if (count < slot.maxCapacity && slot.status === 'full') {
    updateSlot(slot.id, { status: 'available' });
  }
}

// ── Create booking ──

export interface CreateBookingError {
  code: 'SLOT_NOT_FOUND' | 'SLOT_CANCELLED' | 'SLOT_FULL' | 'DOUBLE_BOOKING' | 'PAST_SLOT';
  message: string;
}

export function createBooking(params: {
  userId: string;
  timeSlotId: string;
  bookedBy: string;
  notes?: string;
}): Booking | CreateBookingError {
  const db = getDb();

  const slot = getSlotById(params.timeSlotId);
  if (!slot) {
    return { code: 'SLOT_NOT_FOUND', message: 'Zeitfenster nicht gefunden' };
  }

  if (slot.status === 'cancelled') {
    return { code: 'SLOT_CANCELLED', message: 'Dieses Zeitfenster wurde abgesagt' };
  }

  // Check if slot is in the past
  const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
  if (slotDateTime < new Date()) {
    return { code: 'PAST_SLOT', message: 'Kann keinen Termin in der Vergangenheit buchen' };
  }

  if (hasActiveBooking(params.userId, params.timeSlotId)) {
    return { code: 'DOUBLE_BOOKING', message: 'Du hast diesen Termin bereits gebucht' };
  }

  const activeCount = getActiveBookingCount(params.timeSlotId);
  if (activeCount >= slot.maxCapacity) {
    return { code: 'SLOT_FULL', message: 'Dieses Zeitfenster ist ausgebucht' };
  }

  // Use transaction for atomicity
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const insertBooking = db.transaction(() => {
    db.prepare(`
      INSERT INTO bookings (id, user_id, time_slot_id, status, booked_by, notes, created_at, updated_at)
      VALUES (?, ?, ?, 'confirmed', ?, ?, ?, ?)
    `).run(id, params.userId, params.timeSlotId, params.bookedBy, params.notes ?? null, now, now);

    // Update slot status if now full
    if (activeCount + 1 >= slot.maxCapacity) {
      updateSlot(slot.id, { status: 'full' });
    }

    // Deduct session from active package if available
    const activePackage = getActivePackageForBooking(params.userId, slot.trainingTypeCategory ?? '');
    if (activePackage) {
      deductSession(activePackage.id);
    }
  });

  insertBooking();
  return getBookingById(id)!;
}

// ── Read bookings ──

export function getBookingById(id: string): Booking | undefined {
  const db = getDb();
  const row = db.prepare(`
    SELECT b.*, ts.date as slot_date, ts.start_time as slot_start_time, ts.end_time as slot_end_time,
           tt.name as training_type_name, tt.category as training_type_category
    FROM bookings b
    JOIN time_slots ts ON b.time_slot_id = ts.id
    JOIN training_types tt ON ts.training_type_id = tt.id
    WHERE b.id = ?
  `).get(id) as BookingRow | undefined;
  return row ? rowToBooking(row) : undefined;
}

export function getUserBookings(userId: string, params?: {
  status?: string;
  upcoming?: boolean;
}): Booking[] {
  const db = getDb();
  let sql = `
    SELECT b.*, ts.date as slot_date, ts.start_time as slot_start_time, ts.end_time as slot_end_time,
           tt.name as training_type_name, tt.category as training_type_category
    FROM bookings b
    JOIN time_slots ts ON b.time_slot_id = ts.id
    JOIN training_types tt ON ts.training_type_id = tt.id
    WHERE b.user_id = ?
  `;
  const values: unknown[] = [userId];

  if (params?.status) {
    sql += ' AND b.status = ?';
    values.push(params.status);
  }

  if (params?.upcoming) {
    sql += ' AND ts.date >= date(?)';
    values.push(new Date().toISOString().split('T')[0]);
  }

  sql += ' ORDER BY ts.date, ts.start_time';
  return (db.prepare(sql).all(...values) as BookingRow[]).map(rowToBooking);
}

export function getAdminBookings(params?: {
  from?: string;
  to?: string;
  userId?: string;
  category?: string;
}): Booking[] {
  const db = getDb();
  let sql = `
    SELECT b.*, ts.date as slot_date, ts.start_time as slot_start_time, ts.end_time as slot_end_time,
           tt.name as training_type_name, tt.category as training_type_category
    FROM bookings b
    JOIN time_slots ts ON b.time_slot_id = ts.id
    JOIN training_types tt ON ts.training_type_id = tt.id
    WHERE 1=1
  `;
  const values: unknown[] = [];

  if (params?.from) {
    sql += ' AND ts.date >= ?';
    values.push(params.from);
  }
  if (params?.to) {
    sql += ' AND ts.date <= ?';
    values.push(params.to);
  }
  if (params?.userId) {
    sql += ' AND b.user_id = ?';
    values.push(params.userId);
  }
  if (params?.category) {
    sql += ' AND tt.category = ?';
    values.push(params.category);
  }

  sql += ' ORDER BY ts.date, ts.start_time';
  return (db.prepare(sql).all(...values) as BookingRow[]).map(rowToBooking);
}

// ── Cancel booking ──

export interface CancelBookingError {
  code: 'NOT_FOUND' | 'ALREADY_CANCELLED' | 'NOT_AUTHORIZED';
  message: string;
}

export function cancelBooking(bookingId: string, params: {
  userId: string;
  isAdmin: boolean;
  reason?: string;
}): Booking | CancelBookingError {
  const booking = getBookingById(bookingId);
  if (!booking) {
    return { code: 'NOT_FOUND', message: 'Buchung nicht gefunden' };
  }

  if (booking.status === 'cancelled') {
    return { code: 'ALREADY_CANCELLED', message: 'Buchung bereits storniert' };
  }

  if (!params.isAdmin && booking.userId !== params.userId) {
    return { code: 'NOT_AUTHORIZED', message: 'Nicht autorisiert' };
  }

  const db = getDb();
  const now = new Date().toISOString();

  const cancel = db.transaction(() => {
    db.prepare(`
      UPDATE bookings SET status = 'cancelled', cancelled_at = ?, cancellation_reason = ?, updated_at = ?
      WHERE id = ?
    `).run(now, params.reason ?? null, now, bookingId);

    // Free up slot capacity
    const slot = getSlotById(booking.timeSlotId);
    if (slot) {
      updateSlotCapacityStatus(slot);

      // Credit session back to matching package
      const pkg = getPackageForCreditBack(booking.userId, slot.trainingTypeCategory ?? '');
      if (pkg) {
        creditSession(pkg.id);
      }
    }
  });

  cancel();
  return getBookingById(bookingId)!;
}

// ── Update booking status (admin) ──

export function updateBookingStatus(bookingId: string, status: Booking['status']): Booking | undefined {
  const db = getDb();
  const booking = getBookingById(bookingId);
  if (!booking) return undefined;

  const now = new Date().toISOString();
  db.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?').run(status, now, bookingId);

  if (status === 'cancelled') {
    const slot = getSlotById(booking.timeSlotId);
    if (slot) updateSlotCapacityStatus(slot);
  }

  return getBookingById(bookingId);
}

// ── Cancellation warning ──

export function isWithin24Hours(slotDate: string, slotStartTime: string): boolean {
  const slotDateTime = new Date(`${slotDate}T${slotStartTime}`);
  const hoursUntil = (slotDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil >= 0 && hoursUntil < 24;
}

// ── Slot bookings (for calendar) ──

export function getSlotBookings(timeSlotId: string): SlotBooking[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT b.*, ts.date as slot_date, ts.start_time as slot_start_time, ts.end_time as slot_end_time,
           tt.name as training_type_name, tt.category as training_type_category,
           u.email as user_email, u.display_name as user_display_name
    FROM bookings b
    JOIN time_slots ts ON b.time_slot_id = ts.id
    JOIN training_types tt ON ts.training_type_id = tt.id
    JOIN users u ON b.user_id = u.id
    WHERE b.time_slot_id = ?
    ORDER BY b.created_at
  `).all(timeSlotId) as (BookingRow & { user_email?: string; user_display_name?: string })[];
  return rows.map(row => ({
    ...rowToBooking(row),
    userEmail: row.user_email,
    userDisplayName: row.user_display_name,
  }));
}

// ── Cleanup (for tests) ──

export function clearBookings(): void {
  const db = getDb();
  db.prepare('DELETE FROM bookings').run();
}
