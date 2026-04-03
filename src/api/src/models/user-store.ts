import crypto from 'node:crypto';
import { getDb } from '../db/database.js';

export type Gender = 'männlich' | 'weiblich' | 'divers';
export type TrainingGoal = 'abnehmen' | 'muskelaufbau' | 'fitness' | 'reha' | 'wohlbefinden';
export type ExperienceLevel = 'anfänger' | 'fortgeschritten' | 'profi';
export type TrainingType = 'personal' | 'gruppe' | 'beides';
export type PreferredTime = 'morgens' | 'mittags' | 'abends';

export interface MemberProfile {
  // Personal
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string | null;
  gender: Gender | null;

  // Fitness
  trainingGoal: TrainingGoal | null;
  experienceLevel: ExperienceLevel | null;
  healthNotes: string;

  // Membership
  trainingType: TrainingType | null;
  sessionsPerWeek: number | null;
  preferredTimes: PreferredTime[];
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'active';
  authProvider: 'local' | 'google';
  confirmationToken: string | null;
  tokenExpiresAt: string | null;
  googleId: string | null;
  createdAt: string;
  profile: MemberProfile | null;
}

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string | null;
  role: string;
  status: string;
  auth_provider: string;
  confirmation_token: string | null;
  token_expires_at: string | null;
  google_id: string | null;
  created_at: string;
}

interface ProfileRow {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string | null;
  gender: string | null;
  training_goal: string | null;
  experience_level: string | null;
  health_notes: string;
  training_type: string | null;
  sessions_per_week: number | null;
  preferred_times: string;
}

function rowToProfile(row: ProfileRow): MemberProfile {
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    birthDate: row.birth_date,
    gender: row.gender as Gender | null,
    trainingGoal: row.training_goal as TrainingGoal | null,
    experienceLevel: row.experience_level as ExperienceLevel | null,
    healthNotes: row.health_notes,
    trainingType: row.training_type as TrainingType | null,
    sessionsPerWeek: row.sessions_per_week,
    preferredTimes: JSON.parse(row.preferred_times) as PreferredTime[],
  };
}

function rowToUser(row: UserRow, profileRow?: ProfileRow | null): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    role: row.role as 'admin' | 'user',
    status: row.status as 'pending' | 'active',
    authProvider: row.auth_provider as 'local' | 'google',
    confirmationToken: row.confirmation_token,
    tokenExpiresAt: row.token_expires_at,
    googleId: row.google_id,
    createdAt: row.created_at,
    profile: profileRow ? rowToProfile(profileRow) : null,
  };
}

function loadUserWithProfile(userRow: UserRow): User {
  const db = getDb();
  const profileRow = db.prepare('SELECT * FROM member_profiles WHERE user_id = ?').get(userRow.id) as ProfileRow | undefined;
  return rowToUser(userRow, profileRow ?? null);
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export function getUsers(): Map<string, User> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM users').all() as UserRow[];
  const map = new Map<string, User>();
  for (const row of rows) {
    map.set(row.id, loadUserWithProfile(row));
  }
  return map;
}

export function getAllUsers(): User[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM users').all() as UserRow[];
  return rows.map(row => loadUserWithProfile(row));
}

export function getUserById(id: string): User | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  if (!row) return undefined;
  return loadUserWithProfile(row);
}

export function getUserByEmail(email: string): User | undefined {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);
  const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail) as UserRow | undefined;
  if (!row) return undefined;
  return loadUserWithProfile(row);
}

export function getUserByConfirmationToken(token: string): User | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE confirmation_token = ?').get(token) as UserRow | undefined;
  if (!row) return undefined;
  return loadUserWithProfile(row);
}

export function getUserByGoogleId(googleId: string): User | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId) as UserRow | undefined;
  if (!row) return undefined;
  return loadUserWithProfile(row);
}

export function activateUser(userId: string): User | undefined {
  const db = getDb();
  const result = db.prepare(
    'UPDATE users SET status = ?, confirmation_token = NULL WHERE id = ?'
  ).run('active', userId);
  if (result.changes === 0) return undefined;
  return getUserById(userId);
}

export function createUser(params: {
  email: string;
  displayName: string;
  passwordHash: string | null;
  authProvider: 'local' | 'google';
  confirmationToken: string | null;
  googleId: string | null;
}): User {
  const db = getDb();
  const adminEmail = process.env.ADMIN_EMAIL ? normalizeEmail(process.env.ADMIN_EMAIL) : null;
  const isAdmin = adminEmail !== null && normalizeEmail(params.email) === adminEmail;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const tokenExpiresAt = params.confirmationToken
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  db.prepare(`
    INSERT INTO users (id, email, display_name, password_hash, role, status, auth_provider, confirmation_token, token_expires_at, google_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.email,
    params.displayName,
    params.passwordHash,
    isAdmin ? 'admin' : 'user',
    params.authProvider === 'google' ? 'active' : 'pending',
    params.authProvider,
    params.confirmationToken,
    tokenExpiresAt,
    params.googleId,
    now,
  );

  return getUserById(id)!;
}

export function deleteUser(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function clearUsers(): void {
  const db = getDb();
  db.prepare('DELETE FROM member_profiles').run();
  db.prepare('DELETE FROM users').run();
}

export function setUserRole(userId: string, role: 'admin' | 'user'): User | undefined {
  const db = getDb();
  const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  if (result.changes === 0) return undefined;
  return getUserById(userId);
}

export function getProfile(userId: string): MemberProfile | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM member_profiles WHERE user_id = ?').get(userId) as ProfileRow | undefined;
  return row ? rowToProfile(row) : null;
}

export function updateProfile(userId: string, profile: MemberProfile): User | undefined {
  const db = getDb();
  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!userRow) return undefined;

  db.prepare(`
    INSERT INTO member_profiles (user_id, first_name, last_name, phone, birth_date, gender, training_goal, experience_level, health_notes, training_type, sessions_per_week, preferred_times)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      phone = excluded.phone,
      birth_date = excluded.birth_date,
      gender = excluded.gender,
      training_goal = excluded.training_goal,
      experience_level = excluded.experience_level,
      health_notes = excluded.health_notes,
      training_type = excluded.training_type,
      sessions_per_week = excluded.sessions_per_week,
      preferred_times = excluded.preferred_times
  `).run(
    userId,
    profile.firstName,
    profile.lastName,
    profile.phone,
    profile.birthDate,
    profile.gender,
    profile.trainingGoal,
    profile.experienceLevel,
    profile.healthNotes,
    profile.trainingType,
    profile.sessionsPerWeek,
    JSON.stringify(profile.preferredTimes),
  );

  return getUserById(userId);
}

export function createDefaultProfile(): MemberProfile {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: null,
    gender: null,
    trainingGoal: null,
    experienceLevel: null,
    healthNotes: '',
    trainingType: null,
    sessionsPerWeek: null,
    preferredTimes: [],
  };
}
