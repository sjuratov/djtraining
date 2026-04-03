# FRD: Training Package Management

## Overview

Enable admins (any user with the `admin` role — the system supports multiple admins) to define training packages (e.g., 20er-Abo Personal Training), assign them to clients, and automatically deduct sessions when bookings are made. Clients can see their active package and remaining session balance on their profile. Default package definitions matching current pricing are pre-created on first migration.

## User Stories

- As an **admin**, I want to create package definitions matching the studio pricing (Einzelstunde, 20er-Abo, 40er-Abo) so that I can assign them to clients.
- As an **admin**, I want to assign a package to a client so that their session usage is tracked.
- As an **admin**, I want to see each client's remaining sessions so that I know when to discuss renewals.
- As a **registered client**, I want to see my active package and remaining sessions on my profile so that I know how many sessions I have left.
- As the **system**, I want to automatically deduct a session from the client's package when they book so that the balance stays accurate.

## Integration Points

- **Database (`frd-database.md`)** — New tables: `package_definitions`, `client_packages`
- **Booking system (`frd-booking.md`)** — On booking creation, deduct from active package. On booking cancellation, credit back.
- **User profile (`/profile`)** — Show active package and remaining sessions in membership tab
- **Admin dashboard** — Add package management and per-client package view
- **Pricing pages** — Package definitions can eventually replace hardcoded pricing (future enhancement)

## Acceptance Criteria

### Package Definitions (Admin)

- [ ] Admin can create package definitions: name, training type, total sessions, price (CHF), validity period
- [ ] Admin can edit or deactivate package definitions
- [ ] Default packages match current pricing: Einzelstunde, 20er-Abo, 40er-Abo per training type
- [ ] Default packages are seeded on first migration (not editable seed — admin can deactivate and create replacements)

### Default Seed Packages

The following packages are pre-created in the database migration:

**Personal Training (Individuelles Training, 60 min):**
| Package | Sessions | Price (CHF) |
|---------|----------|-------------|
| Einzelstunde | 1 | 100 |
| 20er-Abo | 20 | 1,900 |
| 40er-Abo | 40 | 3,600 |

**HIIT Training (30 min):**
| Package | Sessions | Price (CHF) |
|---------|----------|-------------|
| Einzelstunde | 1 | 50 |
| 20er-Abo | 20 | 960 |
| 40er-Abo | 40 | 1,800 |

**Vibrationstraining (45 min):**
| Package | Sessions | Price (CHF) |
|---------|----------|-------------|
| Einzelstunde | 1 | 80 |
| 20er-Abo | 20 | 1,440 |
| 40er-Abo | 40 | 2,560 |

**Gruppentraining (60 min):**
| Package | Sessions | Price (CHF) |
|---------|----------|-------------|
| Einzelstunde | 1 | 25 |
| 20er-Abo | 20 | 460 |
| 40er-Abo | 40 | 800 |

**Ernährungscoaching (60 min):**
| Package | Sessions | Price (CHF) |
|---------|----------|-------------|
| Einzelstunde | 1 | 100 |
| 5er-Abo | 5 | 450 |
| 10er-Abo | 10 | 900 |

### Package Assignment (Admin)

- [ ] Admin can assign a package to a client from the admin dashboard
- [ ] Admin can see a client's active and past packages
- [ ] Admin can manually adjust a client's remaining session count (corrections)
- [ ] Admin can see all clients with expiring or depleted packages (overview)

### Client View

- [ ] Client sees active package info on profile page: package name, remaining sessions, expiry date
- [ ] Client sees session deduction in real-time after booking
- [ ] Client sees credit-back after cancellation
- [ ] If no active package, profile shows "Kein aktives Paket" with CTA to contact the studio

### Session Deduction

- [ ] Booking a session deducts 1 from the matching active package
- [ ] Cancelling a booking credits 1 back to the package
- [ ] If no active package with remaining sessions, booking is still allowed (pay-per-session assumed)
- [ ] If multiple packages of the same type exist, deduct from the one expiring soonest

## Data Model

### `package_definitions` table

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| name | TEXT | NOT NULL (e.g., "Personal Training 20er-Abo") |
| training_category | TEXT | NOT NULL ('personal' \| 'gruppe' \| 'ernaehrung') |
| total_sessions | INTEGER | NOT NULL |
| price_chf | INTEGER | NOT NULL (in Rappen, e.g., 190000 = CHF 1,900) |
| validity_days | INTEGER | NULLABLE (NULL = no expiry) |
| active | INTEGER | NOT NULL DEFAULT 1 |
| created_at | TEXT | NOT NULL |

### `client_packages` table

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| user_id | TEXT | NOT NULL, REFERENCES users(id) |
| package_def_id | TEXT | NOT NULL, REFERENCES package_definitions(id) |
| total_sessions | INTEGER | NOT NULL |
| remaining_sessions | INTEGER | NOT NULL |
| purchased_at | TEXT | NOT NULL |
| expires_at | TEXT | NULLABLE |
| status | TEXT | NOT NULL DEFAULT 'active' ('active' \| 'expired' \| 'depleted') |
| notes | TEXT | NULLABLE |
| created_at | TEXT | NOT NULL |

## API Endpoints

### Admin endpoints (require admin role)

- `GET /api/admin/package-definitions` — List all package definitions
- `POST /api/admin/package-definitions` — Create a package definition
- `PUT /api/admin/package-definitions/:id` — Update a package definition
- `GET /api/admin/users/:userId/packages` — List client's packages
- `POST /api/admin/users/:userId/packages` — Assign a package to client
- `PUT /api/admin/packages/:id/adjust` — Adjust remaining sessions `{ delta, reason }`
- `GET /api/admin/packages/overview` — Overview of all active packages (expiring soon, depleted)

### Client endpoints (require authentication)

- `GET /api/packages` — List current user's active and past packages

## Edge Cases

- **Package expires mid-use:** Status changes to 'expired'. Remaining sessions are lost. Admin can extend manually.
- **Multiple active packages:** Use the one expiring soonest for deduction (FIFO by expiry).
- **No active package:** Booking is still allowed — admin handles pay-per-session offline.
- **Cancellation credit on expired package:** Credit goes to the package even if expired, but status stays 'expired'. Admin can manually re-activate if needed.
- **Package assigned to deactivated user:** No special handling — package just won't be used.

## Error Handling

- Create package def with invalid data → 400 with validation details
- Assign package to non-existent user → 404
- Adjust negative beyond remaining → 400 "Verbleibende Einheiten können nicht negativ sein"
- Non-admin access → 403

## Non-Functional Requirements

- **Performance:** Package balance lookup must complete in < 10ms
- **Accuracy:** Use transactions for booking + deduction to prevent race conditions
- **Auditability:** All adjustments are logged with reason and admin who made the change
