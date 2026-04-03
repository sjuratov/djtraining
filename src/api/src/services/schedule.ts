import crypto from 'node:crypto';
import { getDb } from '../db/database.js';

// ── Types ──

export interface TrainingType {
  id: string;
  name: string;
  category: 'personal' | 'gruppe' | 'ernaehrung';
  durationMinutes: number;
  maxCapacity: number;
  priceSingle: number | null;
  active: boolean;
  createdAt: string;
}

export interface ScheduleTemplate {
  id: string;
  trainingTypeId: string;
  dayOfWeek: number;
  startTime: string;
  active: boolean;
  createdAt: string;
  trainingTypeName?: string;
  trainingTypeCategory?: string;
}

export interface TimeSlot {
  id: string;
  templateId: string | null;
  trainingTypeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'cancelled' | 'full';
  maxCapacity: number;
  notes: string | null;
  createdAt: string;
  trainingTypeName?: string;
  trainingTypeCategory?: string;
}

// ── Row types ──

interface TrainingTypeRow {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
  max_capacity: number;
  price_single: number | null;
  active: number;
  created_at: string;
}

interface TemplateRow {
  id: string;
  training_type_id: string;
  day_of_week: number;
  start_time: string;
  active: number;
  created_at: string;
  training_type_name?: string;
  training_type_category?: string;
}

interface SlotRow {
  id: string;
  template_id: string | null;
  training_type_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  max_capacity: number;
  notes: string | null;
  created_at: string;
  training_type_name?: string;
  training_type_category?: string;
}

// ── Mappers ──

function rowToTrainingType(row: TrainingTypeRow): TrainingType {
  return {
    id: row.id,
    name: row.name,
    category: row.category as TrainingType['category'],
    durationMinutes: row.duration_minutes,
    maxCapacity: row.max_capacity,
    priceSingle: row.price_single,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

function rowToTemplate(row: TemplateRow): ScheduleTemplate {
  return {
    id: row.id,
    trainingTypeId: row.training_type_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    active: row.active === 1,
    createdAt: row.created_at,
    trainingTypeName: row.training_type_name,
    trainingTypeCategory: row.training_type_category,
  };
}

function rowToSlot(row: SlotRow): TimeSlot {
  return {
    id: row.id,
    templateId: row.template_id,
    trainingTypeId: row.training_type_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as TimeSlot['status'],
    maxCapacity: row.max_capacity,
    notes: row.notes,
    createdAt: row.created_at,
    trainingTypeName: row.training_type_name,
    trainingTypeCategory: row.training_type_category,
  };
}

// ── Training Types ──

export function getAllTrainingTypes(includeInactive = false): TrainingType[] {
  const db = getDb();
  const sql = includeInactive
    ? 'SELECT * FROM training_types ORDER BY category, name'
    : 'SELECT * FROM training_types WHERE active = 1 ORDER BY category, name';
  return (db.prepare(sql).all() as TrainingTypeRow[]).map(rowToTrainingType);
}

export function getTrainingTypeById(id: string): TrainingType | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM training_types WHERE id = ?').get(id) as TrainingTypeRow | undefined;
  return row ? rowToTrainingType(row) : undefined;
}

export function createTrainingType(params: {
  name: string;
  category: TrainingType['category'];
  durationMinutes: number;
  maxCapacity: number;
  priceSingle?: number | null;
}): TrainingType {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO training_types (id, name, category, duration_minutes, max_capacity, price_single, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, params.name, params.category, params.durationMinutes, params.maxCapacity, params.priceSingle ?? null, now);
  return getTrainingTypeById(id)!;
}

export function updateTrainingType(id: string, params: {
  name?: string;
  category?: TrainingType['category'];
  durationMinutes?: number;
  maxCapacity?: number;
  priceSingle?: number | null;
  active?: boolean;
}): TrainingType | undefined {
  const db = getDb();
  const existing = getTrainingTypeById(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (params.name !== undefined) { fields.push('name = ?'); values.push(params.name); }
  if (params.category !== undefined) { fields.push('category = ?'); values.push(params.category); }
  if (params.durationMinutes !== undefined) { fields.push('duration_minutes = ?'); values.push(params.durationMinutes); }
  if (params.maxCapacity !== undefined) { fields.push('max_capacity = ?'); values.push(params.maxCapacity); }
  if (params.priceSingle !== undefined) { fields.push('price_single = ?'); values.push(params.priceSingle); }
  if (params.active !== undefined) { fields.push('active = ?'); values.push(params.active ? 1 : 0); }

  if (fields.length === 0) return existing;

  values.push(id);
  db.prepare(`UPDATE training_types SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getTrainingTypeById(id);
}

// ── Schedule Templates ──

export function getAllTemplates(includeInactive = false): ScheduleTemplate[] {
  const db = getDb();
  const where = includeInactive ? '' : 'WHERE st.active = 1';
  const rows = db.prepare(`
    SELECT st.*, tt.name as training_type_name, tt.category as training_type_category
    FROM schedule_templates st
    JOIN training_types tt ON st.training_type_id = tt.id
    ${where}
    ORDER BY st.day_of_week, st.start_time
  `).all() as TemplateRow[];
  return rows.map(rowToTemplate);
}

export function getTemplateById(id: string): ScheduleTemplate | undefined {
  const db = getDb();
  const row = db.prepare(`
    SELECT st.*, tt.name as training_type_name, tt.category as training_type_category
    FROM schedule_templates st
    JOIN training_types tt ON st.training_type_id = tt.id
    WHERE st.id = ?
  `).get(id) as TemplateRow | undefined;
  return row ? rowToTemplate(row) : undefined;
}

export function createTemplate(params: {
  trainingTypeId: string;
  dayOfWeek: number;
  startTime: string;
}): ScheduleTemplate {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO schedule_templates (id, training_type_id, day_of_week, start_time, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, params.trainingTypeId, params.dayOfWeek, params.startTime, now);
  return getTemplateById(id)!;
}

export function updateTemplate(id: string, params: {
  dayOfWeek?: number;
  startTime?: string;
  active?: boolean;
}): ScheduleTemplate | undefined {
  const db = getDb();
  const existing = getTemplateById(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (params.dayOfWeek !== undefined) { fields.push('day_of_week = ?'); values.push(params.dayOfWeek); }
  if (params.startTime !== undefined) { fields.push('start_time = ?'); values.push(params.startTime); }
  if (params.active !== undefined) { fields.push('active = ?'); values.push(params.active ? 1 : 0); }

  if (fields.length === 0) return existing;

  values.push(id);
  db.prepare(`UPDATE schedule_templates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getTemplateById(id);
}

export function deactivateTemplate(id: string): ScheduleTemplate | undefined {
  return updateTemplate(id, { active: false });
}

// ── Time Slots ──

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m + minutes;
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function generateSlots(params: {
  fromDate: string;
  toDate: string;
}): TimeSlot[] {
  const db = getDb();
  const templates = getAllTemplates(false);
  const generated: TimeSlot[] = [];

  const from = new Date(params.fromDate);
  const to = new Date(params.toDate);

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();

    for (const tpl of templates) {
      if (tpl.dayOfWeek !== dayOfWeek) continue;

      const tt = getTrainingTypeById(tpl.trainingTypeId);
      if (!tt || !tt.active) continue;

      // Check if slot already exists for this template+date
      const existing = db.prepare(
        'SELECT id FROM time_slots WHERE template_id = ? AND date = ?'
      ).get(tpl.id, dateStr);
      if (existing) continue;

      const id = crypto.randomUUID();
      const endTime = addMinutes(tpl.startTime, tt.durationMinutes);
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO time_slots (id, template_id, training_type_id, date, start_time, end_time, max_capacity, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, tpl.id, tpl.trainingTypeId, dateStr, tpl.startTime, endTime, tt.maxCapacity, now);

      const slot = getSlotById(id);
      if (slot) generated.push(slot);
    }
  }

  return generated;
}

export function getSlotById(id: string): TimeSlot | undefined {
  const db = getDb();
  const row = db.prepare(`
    SELECT ts.*, tt.name as training_type_name, tt.category as training_type_category
    FROM time_slots ts
    JOIN training_types tt ON ts.training_type_id = tt.id
    WHERE ts.id = ?
  `).get(id) as SlotRow | undefined;
  return row ? rowToSlot(row) : undefined;
}

export function getAvailableSlots(params: {
  from: string;
  to: string;
  category?: string;
}): (TimeSlot & { currentBookings: number; availableSpots: number })[] {
  const db = getDb();
  let sql = `
    SELECT ts.*, tt.name as training_type_name, tt.category as training_type_category,
           COALESCE((SELECT COUNT(*) FROM bookings b WHERE b.time_slot_id = ts.id AND b.status = 'confirmed'), 0) as current_bookings
    FROM time_slots ts
    JOIN training_types tt ON ts.training_type_id = tt.id
    WHERE ts.date >= ? AND ts.date <= ? AND ts.status IN ('available', 'full')
  `;
  const values: unknown[] = [params.from, params.to];

  if (params.category) {
    sql += ' AND tt.category = ?';
    values.push(params.category);
  }

  sql += ' ORDER BY ts.date, ts.start_time';
  const rows = db.prepare(sql).all(...values) as (SlotRow & { current_bookings: number })[];
  return rows.map(row => {
    const slot = rowToSlot(row);
    const currentBookings = row.current_bookings;
    return {
      ...slot,
      currentBookings,
      availableSpots: Math.max(0, slot.maxCapacity - currentBookings),
    };
  });
}

export function cancelSlot(id: string): TimeSlot | undefined {
  const db = getDb();
  const result = db.prepare("UPDATE time_slots SET status = 'cancelled' WHERE id = ? AND status != 'cancelled'").run(id);
  if (result.changes === 0) return undefined;
  return getSlotById(id);
}

export function updateSlot(id: string, params: {
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string | null;
  status?: TimeSlot['status'];
}): TimeSlot | undefined {
  const db = getDb();
  const existing = getSlotById(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (params.date !== undefined) { fields.push('date = ?'); values.push(params.date); }
  if (params.startTime !== undefined) { fields.push('start_time = ?'); values.push(params.startTime); }
  if (params.endTime !== undefined) { fields.push('end_time = ?'); values.push(params.endTime); }
  if (params.notes !== undefined) { fields.push('notes = ?'); values.push(params.notes); }
  if (params.status !== undefined) { fields.push('status = ?'); values.push(params.status); }

  if (fields.length === 0) return existing;

  values.push(id);
  db.prepare(`UPDATE time_slots SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getSlotById(id);
}

// ── Cleanup (for tests) ──

export function clearScheduleData(): void {
  const db = getDb();
  db.prepare('DELETE FROM time_slots').run();
  db.prepare('DELETE FROM schedule_templates').run();
  db.prepare('DELETE FROM training_types').run();
}
