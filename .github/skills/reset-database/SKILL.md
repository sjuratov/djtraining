---
name: reset-database
description: Reset the local DJ Training SQLite database by deleting application records and reseeding core package definitions, training types, schedule templates, and the next month of bookable slots. Use when local data becomes inconsistent, registrations/bookings/packages must be cleared, or a known clean baseline is needed without dropping schema or migrations.
---

# Reset Database

Use this skill for the local SQLite workflow only. It preserves schema and `_migrations`, wipes application rows, and reseeds the baseline local data through `scripts/reset_local_db.mjs`.

## Workflow

1. Confirm that the target is a local SQLite file. Default target: `src/api/data/djtraining.db`.
2. Run the reset script:

   ```bash
   node .github/skills/reset-database/scripts/reset_local_db.mjs
   ```

   Add `--no-seed` only when the user explicitly wants an empty database.
   Add `--db /absolute/path/to/file.db` to target a different SQLite file.

3. Read the summary counts printed by the script.
4. Refresh the running app. Restart the API only if an older process is still holding deleted files or the UI does not reflect the new counts.

## Seed Contract

Read `references/core-data.md` for the exact baseline.

Default reseed behavior:
- Recreate the 15 package definitions from `src/api/src/db/migrations/004-packages.sql`
- Recreate the core training types used by booking: Personal Training, Gruppentraining, Ernährungscoaching
- Recreate recurring personal and group schedule templates from the current `/trainingszeiten` contract
- Generate one month of future time slots from those templates
- Leave users, profiles, bookings, and client packages empty

Ernährungscoaching is seeded as a training type without recurring templates because the public schedule still describes it as `nach Vereinbarung`.
