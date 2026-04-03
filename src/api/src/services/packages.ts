import crypto from 'node:crypto';
import { getDb } from '../db/database.js';

// ── Types ──

export interface PackageDefinition {
  id: string;
  name: string;
  trainingCategory: 'personal' | 'gruppe' | 'ernaehrung';
  totalSessions: number;
  priceChf: number;
  validityDays: number | null;
  active: boolean;
  createdAt: string;
}

export interface ClientPackage {
  id: string;
  userId: string;
  packageDefId: string;
  totalSessions: number;
  remainingSessions: number;
  purchasedAt: string;
  expiresAt: string | null;
  effectiveExpiresAt: string | null;
  graceUntil: string | null;
  graceReason: string | null;
  graceSetBy: string | null;
  graceSetAt: string | null;
  status: 'active' | 'expired' | 'depleted';
  isExpired: boolean;
  isExpiringSoon: boolean;
  isBookable: boolean;
  daysUntilExpiry: number | null;
  notes: string | null;
  createdAt: string;
  // Joined fields
  packageName?: string;
  trainingCategory?: string;
  userEmail?: string;
  userDisplayName?: string;
}

const REMINDER_WINDOW_DAYS = 14;

function getTodayIsoDate(): string {
  return new Date().toISOString();
}

// ── Row types ──

interface PackageDefinitionRow {
  id: string;
  name: string;
  training_category: string;
  total_sessions: number;
  price_chf: number;
  validity_days: number | null;
  active: number;
  created_at: string;
}

interface ClientPackageRow {
  id: string;
  user_id: string;
  package_def_id: string;
  total_sessions: number;
  remaining_sessions: number;
  purchased_at: string;
  expires_at: string | null;
  grace_until: string | null;
  grace_reason: string | null;
  grace_set_by: string | null;
  grace_set_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  package_name?: string;
  training_category?: string;
  user_email?: string;
  user_display_name?: string;
}

// ── Mappers ──

function rowToPackageDefinition(row: PackageDefinitionRow): PackageDefinition {
  return {
    id: row.id,
    name: row.name,
    trainingCategory: row.training_category as PackageDefinition['trainingCategory'],
    totalSessions: row.total_sessions,
    priceChf: row.price_chf,
    validityDays: row.validity_days,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

function getEffectiveExpiry(expiresAt: string | null, graceUntil: string | null): string | null {
  return graceUntil ?? expiresAt;
}

function getDaysUntil(expiry: string | null): number | null {
  if (!expiry) {
    return null;
  }

  return Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function rowToClientPackage(row: ClientPackageRow): ClientPackage {
  const effectiveExpiresAt = getEffectiveExpiry(row.expires_at, row.grace_until);
  const daysUntilExpiry = getDaysUntil(effectiveExpiresAt);
  const isExpired = typeof daysUntilExpiry === 'number' ? daysUntilExpiry < 0 : false;
  const isExpiringSoon = typeof daysUntilExpiry === 'number'
    ? daysUntilExpiry >= 0 && daysUntilExpiry <= REMINDER_WINDOW_DAYS
    : false;
  const isBookable = row.status === 'active' && row.remaining_sessions > 0 && !isExpired;

  return {
    id: row.id,
    userId: row.user_id,
    packageDefId: row.package_def_id,
    totalSessions: row.total_sessions,
    remainingSessions: row.remaining_sessions,
    purchasedAt: row.purchased_at,
    expiresAt: row.expires_at,
    effectiveExpiresAt,
    graceUntil: row.grace_until,
    graceReason: row.grace_reason,
    graceSetBy: row.grace_set_by,
    graceSetAt: row.grace_set_at,
    status: row.status as ClientPackage['status'],
    isExpired,
    isExpiringSoon,
    isBookable,
    daysUntilExpiry,
    notes: row.notes,
    createdAt: row.created_at,
    packageName: row.package_name,
    trainingCategory: row.training_category,
    userEmail: row.user_email,
    userDisplayName: row.user_display_name,
  };
}

function syncClientPackageStatuses(): void {
  const db = getDb();
  db.prepare(`
    UPDATE client_packages
    SET status = CASE
      WHEN remaining_sessions <= 0 THEN 'depleted'
      WHEN COALESCE(grace_until, expires_at) IS NOT NULL AND COALESCE(grace_until, expires_at) < ? THEN 'expired'
      ELSE 'active'
    END
  `).run(getTodayIsoDate());
}

// ── Package Definitions (admin) ──

export function getAllPackageDefinitions(includeInactive = false): PackageDefinition[] {
  const db = getDb();
  const sql = includeInactive
    ? 'SELECT * FROM package_definitions ORDER BY training_category, name'
    : 'SELECT * FROM package_definitions WHERE active = 1 ORDER BY training_category, name';
  return (db.prepare(sql).all() as PackageDefinitionRow[]).map(rowToPackageDefinition);
}

export function getPackageDefinitionById(id: string): PackageDefinition | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM package_definitions WHERE id = ?').get(id) as PackageDefinitionRow | undefined;
  return row ? rowToPackageDefinition(row) : undefined;
}

export function createPackageDefinition(params: {
  name: string;
  trainingCategory: PackageDefinition['trainingCategory'];
  totalSessions: number;
  priceChf: number;
  validityDays?: number | null;
}): PackageDefinition {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO package_definitions (id, name, training_category, total_sessions, price_chf, validity_days, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, params.name, params.trainingCategory, params.totalSessions, params.priceChf, params.validityDays ?? null, now);
  return getPackageDefinitionById(id)!;
}

export function updatePackageDefinition(id: string, params: {
  name?: string;
  trainingCategory?: PackageDefinition['trainingCategory'];
  totalSessions?: number;
  priceChf?: number;
  validityDays?: number | null;
  active?: boolean;
}): PackageDefinition | undefined {
  const db = getDb();
  const existing = getPackageDefinitionById(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (params.name !== undefined) { fields.push('name = ?'); values.push(params.name); }
  if (params.trainingCategory !== undefined) { fields.push('training_category = ?'); values.push(params.trainingCategory); }
  if (params.totalSessions !== undefined) { fields.push('total_sessions = ?'); values.push(params.totalSessions); }
  if (params.priceChf !== undefined) { fields.push('price_chf = ?'); values.push(params.priceChf); }
  if (params.validityDays !== undefined) { fields.push('validity_days = ?'); values.push(params.validityDays); }
  if (params.active !== undefined) { fields.push('active = ?'); values.push(params.active ? 1 : 0); }

  if (fields.length === 0) return existing;

  values.push(id);
  db.prepare(`UPDATE package_definitions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getPackageDefinitionById(id);
}

// ── Client Packages ──

const CLIENT_PACKAGE_JOIN_SQL = `
  SELECT cp.*, pd.name as package_name, pd.training_category, u.email as user_email, u.display_name as user_display_name
  FROM client_packages cp
  JOIN package_definitions pd ON cp.package_def_id = pd.id
  JOIN users u ON cp.user_id = u.id
`;

export function getClientPackages(userId: string, activeOnly = false): ClientPackage[] {
  const db = getDb();
  syncClientPackageStatuses();
  let sql = `${CLIENT_PACKAGE_JOIN_SQL} WHERE cp.user_id = ?`;
  const values: unknown[] = [userId];
  if (activeOnly) {
    sql += " AND cp.status = 'active' AND (COALESCE(cp.grace_until, cp.expires_at) IS NULL OR COALESCE(cp.grace_until, cp.expires_at) >= ?)";
    values.push(getTodayIsoDate());
  }
  sql += ' ORDER BY cp.purchased_at DESC';
  return (db.prepare(sql).all(...values) as ClientPackageRow[]).map(rowToClientPackage);
}

export function getClientPackageById(id: string): ClientPackage | undefined {
  const db = getDb();
  syncClientPackageStatuses();
  const row = db.prepare(`${CLIENT_PACKAGE_JOIN_SQL} WHERE cp.id = ?`).get(id) as ClientPackageRow | undefined;
  return row ? rowToClientPackage(row) : undefined;
}

export function assignPackage(params: {
  userId: string;
  packageDefId: string;
  notes?: string;
}): ClientPackage {
  const db = getDb();
  const pkgDef = getPackageDefinitionById(params.packageDefId);
  if (!pkgDef) {
    throw new Error('Package definition not found');
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  let expiresAt: string | null = null;
  if (pkgDef.validityDays) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + pkgDef.validityDays);
    expiresAt = expiry.toISOString();
  }

  db.prepare(`
    INSERT INTO client_packages (id, user_id, package_def_id, total_sessions, remaining_sessions, purchased_at, expires_at, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(id, params.userId, params.packageDefId, pkgDef.totalSessions, pkgDef.totalSessions, now, expiresAt, params.notes ?? null, now);

  syncClientPackageStatuses();
  return getClientPackageById(id)!;
}

export function adjustRemainingSessions(packageId: string, delta: number, _reason: string): ClientPackage | { error: string } {
  const db = getDb();
  const pkg = getClientPackageById(packageId);
  if (!pkg) {
    return { error: 'Paket nicht gefunden' };
  }

  const newRemaining = pkg.remainingSessions + delta;
  if (newRemaining < 0) {
    return { error: 'Verbleibende Sitzungen können nicht negativ werden' };
  }
  if (newRemaining > pkg.totalSessions) {
    return { error: 'Verbleibende Sitzungen können nicht über das maximale Paketkontingent steigen' };
  }

  db.prepare('UPDATE client_packages SET remaining_sessions = ? WHERE id = ?').run(newRemaining, packageId);
  syncClientPackageStatuses();

  return getClientPackageById(packageId)!;
}

export function setPackageGrace(packageId: string, params: {
  graceUntil: string;
  reason: string;
  adminId: string;
}): ClientPackage | { error: string } {
  const db = getDb();
  const pkg = getClientPackageById(packageId);
  if (!pkg) {
    return { error: 'Paket nicht gefunden' };
  }

  if (!pkg.expiresAt) {
    return { error: 'Dieses Abo hat kein Ablaufdatum und benötigt keine Verlängerung.' };
  }

  const reason = params.reason.trim();
  if (!reason) {
    return { error: 'Bitte gib einen Grund für die Verlängerung an.' };
  }

  const graceDate = params.graceUntil.includes('T')
    ? new Date(params.graceUntil)
    : new Date(`${params.graceUntil}T23:59:59.999`);
  if (Number.isNaN(graceDate.getTime())) {
    return { error: 'Bitte gib ein gültiges neues Enddatum an.' };
  }

  if (graceDate.getTime() <= Date.now()) {
    return { error: 'Das neue Enddatum muss in der Zukunft liegen.' };
  }

  if (graceDate.getTime() <= new Date(pkg.expiresAt).getTime()) {
    return { error: 'Das neue Enddatum muss nach dem ursprünglichen Ablaufdatum liegen.' };
  }

  db.prepare(`
    UPDATE client_packages
    SET grace_until = ?, grace_reason = ?, grace_set_by = ?, grace_set_at = ?
    WHERE id = ?
  `).run(graceDate.toISOString(), reason, params.adminId, new Date().toISOString(), packageId);

  syncClientPackageStatuses();
  return getClientPackageById(packageId)!;
}

export function getActivePackageForBooking(userId: string, trainingCategory: string): ClientPackage | undefined {
  const db = getDb();
  syncClientPackageStatuses();
  const row = db.prepare(`
    ${CLIENT_PACKAGE_JOIN_SQL}
    WHERE cp.user_id = ? AND pd.training_category = ? AND cp.status = 'active' AND cp.remaining_sessions > 0
      AND (COALESCE(cp.grace_until, cp.expires_at) IS NULL OR COALESCE(cp.grace_until, cp.expires_at) >= ?)
    ORDER BY COALESCE(cp.grace_until, cp.expires_at) IS NULL, COALESCE(cp.grace_until, cp.expires_at) ASC, cp.purchased_at ASC
    LIMIT 1
  `).get(userId, trainingCategory, getTodayIsoDate()) as ClientPackageRow | undefined;
  return row ? rowToClientPackage(row) : undefined;
}

export function getPackageForCreditBack(userId: string, trainingCategory: string): ClientPackage | undefined {
  const db = getDb();
  syncClientPackageStatuses();
  // Find active or depleted package matching category (FIFO by expiry)
  const row = db.prepare(`
    ${CLIENT_PACKAGE_JOIN_SQL}
    WHERE cp.user_id = ? AND pd.training_category = ? AND cp.status IN ('active', 'depleted', 'expired')
    ORDER BY COALESCE(cp.grace_until, cp.expires_at) IS NULL, COALESCE(cp.grace_until, cp.expires_at) ASC, cp.purchased_at ASC
    LIMIT 1
  `).get(userId, trainingCategory) as ClientPackageRow | undefined;
  return row ? rowToClientPackage(row) : undefined;
}

export function deductSession(packageId: string): ClientPackage | undefined {
  const db = getDb();
  const pkg = getClientPackageById(packageId);
  if (!pkg || pkg.remainingSessions <= 0 || !pkg.isBookable) return undefined;

  const newRemaining = pkg.remainingSessions - 1;
  db.prepare('UPDATE client_packages SET remaining_sessions = ? WHERE id = ?').run(newRemaining, packageId);
  syncClientPackageStatuses();

  return getClientPackageById(packageId)!;
}

export function creditSession(packageId: string): ClientPackage | undefined {
  const db = getDb();
  const pkg = getClientPackageById(packageId);
  if (!pkg) return undefined;

  const newRemaining = Math.min(pkg.remainingSessions + 1, pkg.totalSessions);
  db.prepare('UPDATE client_packages SET remaining_sessions = ? WHERE id = ?').run(newRemaining, packageId);
  syncClientPackageStatuses();

  return getClientPackageById(packageId)!;
}

export function getPackagesOverview(): { expiringSoon: ClientPackage[]; depleted: ClientPackage[]; expired: ClientPackage[] } {
  const db = getDb();
  syncClientPackageStatuses();

  const allPackages = (db.prepare(`
    ${CLIENT_PACKAGE_JOIN_SQL}
    ORDER BY cp.purchased_at DESC
  `).all() as ClientPackageRow[]).map(rowToClientPackage);

  return {
    expiringSoon: allPackages.filter((pkg) => pkg.status === 'active' && pkg.isExpiringSoon),
    depleted: allPackages.filter((pkg) => pkg.status === 'depleted'),
    expired: allPackages.filter((pkg) => pkg.status === 'expired'),
  };
}

// ── Cleanup (for tests) ──

export function clearPackages(): void {
  const db = getDb();
  db.prepare('DELETE FROM client_packages').run();
}
