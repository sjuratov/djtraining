import { beforeEach, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTestDatabase } from '../src/db/database.js';
import { clearUsers } from '../src/models/user-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

beforeAll(() => {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const migrationFile = path.join(__dirname, '..', 'src', 'db', 'migrations', '001-users.sql');
  const sql = fs.readFileSync(migrationFile, 'utf-8');
  db.exec(sql);

  setTestDatabase(db);
});

beforeEach(() => {
  clearUsers();
});

afterAll(() => {
  // Database will be garbage collected since it's :memory:
});
