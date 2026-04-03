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
  status: 'active' | 'expired' | 'depleted';
  notes: string | null;
  createdAt: string;
  // Joined fields
  packageName?: string;
  trainingCategory?: string;
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
  status: string;
  notes: string | null;
  created_at: string;
  package_name?: string;
  training_category?: string;
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

function rowToClientPackage(row: ClientPackageRow): ClientPackage {
  return {
    id: row.id,
    userId: row.user_id,
    packageDefId: row.package_def_id,
    totalSessions: row.total_sessions,
    remainingSessions: row.remaining_sessions,
    purchasedAt: row.purchased_at,
    expiresAt: row.expires_at,
    status: row.status as ClientPackage['status'],
    notes: row.notes,
    createdAt: row.created_at,
    packageName: row.package_name,
    trainingCategory: row.training_category,
  };
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
  SELECT cp.*, pd.name as package_name, pd.training_category
  FROM client_packages cp
  JOIN package_definitions pd ON cp.package_def_id = pd.id
`;

export function getClientPackages(userId: string, activeOnly = false): ClientPackage[] {
  const db = getDb();
  let sql = `${CLIENT_PACKAGE_JOIN_SQL} WHERE cp.user_id = ?`;
  if (activeOnly) {
    sql += " AND cp.status = 'active'";
  }
  sql += ' ORDER BY cp.purchased_at DESC';
  return (db.prepare(sql).all(userId) as ClientPackageRow[]).map(rowToClientPackage);
}

function getClientPackageById(id: string): ClientPackage | undefined {
  const db = getDb();
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

  const newStatus = newRemaining === 0 ? 'depleted' : 'active';
  db.prepare('UPDATE client_packages SET remaining_sessions = ?, status = ? WHERE id = ?').run(newRemaining, newStatus, packageId);

  return getClientPackageById(packageId)!;
}

export function getActivePackageForBooking(userId: string, trainingCategory: string): ClientPackage | undefined {
  const db = getDb();
  const row = db.prepare(`
    ${CLIENT_PACKAGE_JOIN_SQL}
    WHERE cp.user_id = ? AND pd.training_category = ? AND cp.status = 'active' AND cp.remaining_sessions > 0
    ORDER BY cp.expires_at IS NULL, cp.expires_at ASC, cp.purchased_at ASC
    LIMIT 1
  `).get(userId, trainingCategory) as ClientPackageRow | undefined;
  return row ? rowToClientPackage(row) : undefined;
}

export function getPackageForCreditBack(userId: string, trainingCategory: string): ClientPackage | undefined {
  const db = getDb();
  // Find active or depleted package matching category (FIFO by expiry)
  const row = db.prepare(`
    ${CLIENT_PACKAGE_JOIN_SQL}
    WHERE cp.user_id = ? AND pd.training_category = ? AND cp.status IN ('active', 'depleted')
    ORDER BY cp.expires_at IS NULL, cp.expires_at ASC, cp.purchased_at ASC
    LIMIT 1
  `).get(userId, trainingCategory) as ClientPackageRow | undefined;
  return row ? rowToClientPackage(row) : undefined;
}

export function deductSession(packageId: string): ClientPackage | undefined {
  const db = getDb();
  const pkg = getClientPackageById(packageId);
  if (!pkg || pkg.remainingSessions <= 0) return undefined;

  const newRemaining = pkg.remainingSessions - 1;
  const newStatus = newRemaining === 0 ? 'depleted' : pkg.status;
  db.prepare('UPDATE client_packages SET remaining_sessions = ?, status = ? WHERE id = ?').run(newRemaining, newStatus, packageId);

  return getClientPackageById(packageId)!;
}

export function creditSession(packageId: string): ClientPackage | undefined {
  const db = getDb();
  const pkg = getClientPackageById(packageId);
  if (!pkg) return undefined;

  const newRemaining = pkg.remainingSessions + 1;
  const newStatus = pkg.status === 'depleted' && newRemaining > 0 ? 'active' : pkg.status;
  db.prepare('UPDATE client_packages SET remaining_sessions = ?, status = ? WHERE id = ?').run(newRemaining, newStatus, packageId);

  return getClientPackageById(packageId)!;
}

export function getPackagesOverview(): { expiringSoon: ClientPackage[]; depleted: ClientPackage[] } {
  const db = getDb();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const cutoff = thirtyDaysFromNow.toISOString();

  const expiringSoon = (db.prepare(`
    ${CLIENT_PACKAGE_JOIN_SQL}
    WHERE cp.status = 'active' AND cp.expires_at IS NOT NULL AND cp.expires_at <= ?
    ORDER BY cp.expires_at ASC
  `).all(cutoff) as ClientPackageRow[]).map(rowToClientPackage);

  const depleted = (db.prepare(`
    ${CLIENT_PACKAGE_JOIN_SQL}
    WHERE cp.status = 'depleted'
    ORDER BY cp.purchased_at DESC
  `).all() as ClientPackageRow[]).map(rowToClientPackage);

  return { expiringSoon, depleted };
}

// ── Cleanup (for tests) ──

export function clearPackages(): void {
  const db = getDb();
  db.prepare('DELETE FROM client_packages').run();
}
