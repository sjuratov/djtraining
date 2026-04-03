# FRD: Database Persistence (SQLite)

## Overview

Migrate the application from in-memory data storage (`Map<string, User>`) to SQLite for durable persistence. All existing features (auth, profiles, admin) must continue to work identically. This is a foundational prerequisite for all future features (booking, scheduling, packages).

## User Stories

- As a **registered client**, I want my account and profile data to persist across server restarts so that I don't lose my information.
- As an **admin**, I want user data to survive deployments so that client registrations are never lost.
- As a **developer**, I want a migration system so that database schema changes are applied safely and incrementally.

> **Multi-admin note:** The system supports multiple admins (promoted by existing admins via the admin dashboard). All admin references in this and related FRDs apply to any user with the `admin` role, not a specific person.

## Integration Points

- **User Store (`src/api/src/models/user-store.ts`)** — Replace in-memory `Map` with SQLite-backed repository. All exported functions (`createUser`, `getUserById`, `getUserByEmail`, etc.) retain their signatures.
- **Auth routes (`src/api/src/routes/auth.ts`)** — No changes needed; consumes user-store API.
- **Profile routes (`src/api/src/routes/profile.ts`)** — No changes needed; consumes user-store API.
- **Admin routes (`src/api/src/routes/admin.ts`)** — No changes needed; consumes user-store API.
- **Test routes (`src/api/src/app.ts`)** — `clearUsers()` must reset the database (truncate tables, not drop).
- **Test suite** — All 69 API tests and 111 e2e tests must pass without modification.

## Acceptance Criteria

- [ ] SQLite database file is created at a configurable path (`DATABASE_PATH` env var, default: `./data/djtraining.db`)
- [ ] All existing `user-store.ts` functions work identically against SQLite
- [ ] User data (including profiles) persists across API server restarts
- [ ] Migration system runs on app startup (create tables if not exist)
- [ ] `clearUsers()` truncates tables without dropping them (test isolation)
- [ ] Database file is excluded from git (`.gitignore`)
- [ ] All 69 API unit tests pass
- [ ] All 111 Playwright e2e tests pass
- [ ] `.env.example` documents `DATABASE_PATH`

## Database Schema

### `users` table

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| email | TEXT | UNIQUE, NOT NULL |
| display_name | TEXT | NOT NULL |
| password_hash | TEXT | NULLABLE |
| role | TEXT | NOT NULL, DEFAULT 'user' |
| status | TEXT | NOT NULL, DEFAULT 'pending' |
| auth_provider | TEXT | NOT NULL, DEFAULT 'local' |
| confirmation_token | TEXT | NULLABLE |
| token_expires_at | TEXT | NULLABLE |
| google_id | TEXT | NULLABLE, UNIQUE |
| created_at | TEXT | NOT NULL |

### `member_profiles` table

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | TEXT | PRIMARY KEY, REFERENCES users(id) ON DELETE CASCADE |
| first_name | TEXT | NOT NULL DEFAULT '' |
| last_name | TEXT | NOT NULL DEFAULT '' |
| phone | TEXT | NOT NULL DEFAULT '' |
| birth_date | TEXT | NULLABLE |
| gender | TEXT | NULLABLE |
| training_goal | TEXT | NULLABLE |
| experience_level | TEXT | NULLABLE |
| health_notes | TEXT | NOT NULL DEFAULT '' |
| training_type | TEXT | NULLABLE |
| sessions_per_week | INTEGER | NULLABLE |
| preferred_times | TEXT | NOT NULL DEFAULT '[]' (JSON array) |

## Edge Cases

- **Concurrent access:** SQLite WAL mode handles concurrent reads. Writes are serialized.
- **Empty database on first start:** Migration creates tables. No seed data required (admin bootstrapping via `ADMIN_EMAIL` continues to work at registration time).
- **Corrupt database file:** Log error and fail fast — do not silently fall back to in-memory.
- **Test isolation:** Each test file's `beforeEach`/`afterEach` uses `clearUsers()` which truncates tables.

## Error Handling

- Database connection failure on startup → log error, exit process with code 1
- Write failure (disk full, permissions) → return appropriate HTTP 500 with "Interner Serverfehler"
- Migration failure → log error with details, exit process with code 1

## Non-Functional Requirements

- **Performance:** SQLite queries for user lookup must complete in < 5ms (single-digit users to low hundreds)
- **Security:** Database file permissions should be 0600 (owner read/write only)
- **Backup:** Database is a single file — easy to copy for backup
- **Migration path:** Schema designed to be forward-compatible with PostgreSQL if needed later

## Azure Deployment Path

SQLite must work in Azure Container Apps. The deployment strategy:

1. **Local / POC:** SQLite file at `DATABASE_PATH` (default: `./data/djtraining.db`). Zero setup.
2. **Azure Container Apps:** Mount an Azure Files persistent volume to `/data/`. The SQLite file lives on the volume and survives container restarts and redeployments.
   - Bicep: add `storageAccount` + `fileShare` + Container App `volumeMount` to `infra/`
   - `DATABASE_PATH` set via environment variable in the container configuration
3. **Future scale-out:** If the app needs multiple container replicas (horizontal scaling), migrate to Azure Database for PostgreSQL Flexible Server. The migration system and schema are designed to be PostgreSQL-compatible (TEXT types, standard SQL, no SQLite-specific features).

**Infra requirements for Azure deployment:**
- Azure Storage Account with File Share (SMB)
- Volume mount in Container App configuration: `/data/` → file share
- `DATABASE_PATH=/data/djtraining.db` as container env var
- Bicep templates in `infra/` updated to provision storage + mount

## Technology

- **ORM/Driver:** `better-sqlite3` (synchronous, fast, zero-config) with `@types/better-sqlite3`
- **Migrations:** Simple numbered SQL files in `src/api/src/db/migrations/`, run in order on startup
- **SQL style:** Use standard SQL compatible with both SQLite and PostgreSQL (no `AUTOINCREMENT`, no SQLite-specific pragmas in migration files beyond WAL mode setup)
