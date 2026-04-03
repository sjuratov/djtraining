import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../logger.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? process.env.DATABASE_PATH ?? './data/djtraining.db';

  if (resolvedPath !== ':memory:') {
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  logger.info({ path: resolvedPath }, 'Database initialized');
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const applied = new Set(
    database.prepare('SELECT name FROM _migrations').all()
      .map((row: unknown) => (row as { name: string }).name)
  );

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    database.exec(sql);
    database.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(
      file,
      new Date().toISOString()
    );
    logger.info({ migration: file }, 'Migration applied');
  }
}

/** For testing only: replace the singleton with a custom database instance */
export function setTestDatabase(testDb: Database.Database): void {
  db = testDb;
}
