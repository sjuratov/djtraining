import { beforeEach, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTestDatabase } from '../src/db/database.js';
import { clearUsers } from '../src/models/user-store.js';
import { clearScheduleData } from '../src/services/schedule.js';
import { clearBookings } from '../src/services/booking.js';
import { clearPackages } from '../src/services/packages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

beforeAll(() => {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    db.exec(sql);
  }

  setTestDatabase(db);
});

beforeEach(() => {
  clearBookings();
  clearPackages();
  clearScheduleData();
  clearUsers();
});

afterAll(() => {
  // Database will be garbage collected since it's :memory:
});
