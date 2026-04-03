#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../../');
const require = createRequire(import.meta.url);
const Database = require(path.join(repoRoot, 'src/api/node_modules/better-sqlite3'));

const PACKAGE_DEFINITIONS = [
  ['pkg-personal-1', 'Personal Training Einzelstunde', 'personal', 1, 10000, null, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-personal-20', 'Personal Training 20er-Abo', 'personal', 20, 190000, 365, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-personal-40', 'Personal Training 40er-Abo', 'personal', 40, 360000, 365, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-hiit-1', 'HIIT Training Einzelstunde', 'personal', 1, 5000, null, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-hiit-20', 'HIIT Training 20er-Abo', 'personal', 20, 96000, 365, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-hiit-40', 'HIIT Training 40er-Abo', 'personal', 40, 180000, 365, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-vibration-1', 'Vibrationstraining Einzelstunde', 'personal', 1, 8000, null, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-vibration-20', 'Vibrationstraining 20er-Abo', 'personal', 20, 144000, 365, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-vibration-40', 'Vibrationstraining 40er-Abo', 'personal', 40, 256000, 365, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-gruppe-1', 'Gruppentraining Einzelstunde', 'gruppe', 1, 2500, null, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-gruppe-20', 'Gruppentraining 20er-Abo', 'gruppe', 20, 46000, 365, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-gruppe-40', 'Gruppentraining 40er-Abo', 'gruppe', 40, 80000, 365, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-ernaehrung-1', 'Ernährungscoaching Einzelstunde', 'ernaehrung', 1, 10000, null, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-ernaehrung-5', 'Ernährungscoaching 5er-Abo', 'ernaehrung', 5, 45000, 180, 1, '2026-01-01T00:00:00.000Z'],
  ['pkg-ernaehrung-10', 'Ernährungscoaching 10er-Abo', 'ernaehrung', 10, 90000, 365, 1, '2026-01-01T00:00:00.000Z'],
];

const TRAINING_TYPES = [
  ['tt-personal', 'Personal Training', 'personal', 60, 1, 10000],
  ['tt-gruppe', 'Gruppentraining', 'gruppe', 60, 5, 2500],
  ['tt-ernaehrung', 'Ernährungscoaching', 'ernaehrung', 60, 1, 10000],
];

const PERSONAL_WEEKDAYS = [1, 2, 3, 4, 5];
const PERSONAL_TIMES = ['09:00', '10:00', '11:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
const GROUP_TEMPLATES = [
  [1, '18:00'],
  [1, '19:15'],
  [4, '18:00'],
  [4, '19:15'],
];

function parseArgs(argv) {
  let dbPath = path.join(repoRoot, 'src/api/data/djtraining.db');
  let seed = true;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--db') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('Missing value for --db');
      }
      dbPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--no-seed') {
      seed = false;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { dbPath, seed };
}

function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const nextHours = Math.floor(totalMinutes / 60) % 24;
  const nextMinutes = totalMinutes % 60;
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildTemplateSeeds(createdAt) {
  const templates = [];

  for (const dayOfWeek of PERSONAL_WEEKDAYS) {
    for (const startTime of PERSONAL_TIMES) {
      templates.push([
        `tpl-personal-${dayOfWeek}-${startTime.replace(':', '')}`,
        'tt-personal',
        dayOfWeek,
        startTime,
        1,
        createdAt,
      ]);
    }
  }

  for (const [dayOfWeek, startTime] of GROUP_TEMPLATES) {
    templates.push([
      `tpl-gruppe-${dayOfWeek}-${startTime.replace(':', '')}`,
      'tt-gruppe',
      dayOfWeek,
      startTime,
      1,
      createdAt,
    ]);
  }

  return templates;
}

function buildTimeSlotSeeds(templates, createdAt) {
  const typeLookup = new Map(
    TRAINING_TYPES.map(([id, _name, _category, durationMinutes, maxCapacity]) => [
      id,
      { durationMinutes, maxCapacity },
    ]),
  );

  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const slots = [];
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateValue = toDateValue(date);
    const dayOfWeek = date.getDay();

    for (const [templateId, trainingTypeId, templateDayOfWeek, startTime] of templates) {
      if (templateDayOfWeek !== dayOfWeek) {
        continue;
      }

      const trainingType = typeLookup.get(trainingTypeId);
      if (!trainingType) {
        throw new Error(`Unknown training type for template ${templateId}`);
      }

      slots.push([
        `slot-${templateId}-${dateValue}`,
        templateId,
        trainingTypeId,
        dateValue,
        startTime,
        addMinutes(startTime, trainingType.durationMinutes),
        'available',
        trainingType.maxCapacity,
        null,
        createdAt,
      ]);
    }
  }

  return slots;
}

function wipeTables(db) {
  const tables = [
    'bookings',
    'client_packages',
    'member_profiles',
    'time_slots',
    'schedule_templates',
    'training_types',
    'package_definitions',
    'users',
  ];

  for (const table of tables) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
}

function seedCoreData(db) {
  const createdAt = new Date().toISOString();
  const templates = buildTemplateSeeds(createdAt);
  const timeSlots = buildTimeSlotSeeds(templates, createdAt);

  const insertPackageDefinition = db.prepare(`
    INSERT INTO package_definitions (id, name, training_category, total_sessions, price_chf, validity_days, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const row of PACKAGE_DEFINITIONS) {
    insertPackageDefinition.run(...row);
  }

  const insertTrainingType = db.prepare(`
    INSERT INTO training_types (id, name, category, duration_minutes, max_capacity, price_single, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `);
  for (const [id, name, category, durationMinutes, maxCapacity, priceSingle] of TRAINING_TYPES) {
    insertTrainingType.run(id, name, category, durationMinutes, maxCapacity, priceSingle, createdAt);
  }

  const insertTemplate = db.prepare(`
    INSERT INTO schedule_templates (id, training_type_id, day_of_week, start_time, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const row of templates) {
    insertTemplate.run(...row);
  }

  const insertTimeSlot = db.prepare(`
    INSERT INTO time_slots (id, template_id, training_type_id, date, start_time, end_time, status, max_capacity, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const row of timeSlots) {
    insertTimeSlot.run(...row);
  }

  return {
    packageDefinitions: PACKAGE_DEFINITIONS.length,
    trainingTypes: TRAINING_TYPES.length,
    scheduleTemplates: templates.length,
    timeSlots: timeSlots.length,
  };
}

function printCounts(db) {
  for (const table of [
    'users',
    'member_profiles',
    'client_packages',
    'bookings',
    'training_types',
    'schedule_templates',
    'time_slots',
    'package_definitions',
  ]) {
    const count = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
    console.log(`${table}|${count}`);
  }
}

function main() {
  const { dbPath, seed } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database not found: ${dbPath}`);
  }

  const db = new Database(dbPath);
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = OFF');

  let seedSummary = null;
  const reset = db.transaction(() => {
    wipeTables(db);
    if (seed) {
      seedSummary = seedCoreData(db);
    }
  });

  reset();
  db.pragma('foreign_keys = ON');
  db.pragma('wal_checkpoint(TRUNCATE)');

  console.log(`database|${dbPath}`);
  console.log(`seeded|${seed ? 'true' : 'false'}`);
  if (seedSummary) {
    for (const [key, value] of Object.entries(seedSummary)) {
      console.log(`${key}|${value}`);
    }
  }
  printCounts(db);
  db.close();
}

main();
