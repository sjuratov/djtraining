# FRD: Schedule & Availability Management

## Overview

Enable admins to define and manage recurring weekly training schedules with exception handling. The system supports multiple admins (any user with the `admin` role can manage schedules). The system generates available time slots from schedule templates, which feed into the booking system. Replaces the current static schedule page with dynamic, data-driven scheduling.

## User Stories

- As an **admin**, I want to define recurring weekly time slots (e.g., "Monday 18:00–19:00 Group Training") so that the schedule repeats automatically.
- As an **admin**, I want to cancel or reschedule individual sessions (exceptions) without changing the recurring pattern.
- As an **admin**, I want to define different training types (personal, group, nutrition coaching) with their durations and capacities.
- As an **admin**, I want a calendar view of all scheduled time slots so that I can manage the training schedule visually with full CRUD.
- As a **visitor/client**, I want to see the current available training schedule so that I can plan when to train.

## Integration Points

- **Database (`frd-database.md`)** — New tables: `training_types`, `schedule_templates`, `schedule_exceptions`, `time_slots`
- **Existing schedule page (`/trainingszeiten`)** — Replace static content with dynamically rendered schedule from database
- **Booking system (`frd-booking.md`)** — Generated time slots are the bookable units
- **Admin dashboard (`/admin`)** — Add schedule management section
- **Navigation** — Add "Zeitplan" or similar admin sub-navigation for schedule management

## Acceptance Criteria

- [ ] Admin can create training types (name, duration in minutes, max capacity, category)
- [ ] Admin can create recurring weekly schedule templates (day of week, start time, training type)
- [ ] System generates available time slots for a configurable horizon (default: 4 weeks ahead)
- [ ] Admin can mark individual generated slots as cancelled (exception)
- [ ] Admin can change the time of an individual slot (reschedule exception)
- [ ] Public schedule page (`/trainingszeiten`) renders from database instead of static content
- [ ] Schedule changes reflect immediately on the public page
- [ ] Non-admin users cannot access schedule management endpoints

## Data Model

### `training_types` table

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| name | TEXT | NOT NULL |
| category | TEXT | NOT NULL ('personal' \| 'gruppe' \| 'ernaehrung') |
| duration_minutes | INTEGER | NOT NULL |
| max_capacity | INTEGER | NOT NULL (1 for personal, 5 for group, etc.) |
| price_single | INTEGER | NULLABLE (price in Rappen/cents) |
| active | INTEGER | NOT NULL DEFAULT 1 |
| created_at | TEXT | NOT NULL |

### `schedule_templates` table

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| training_type_id | TEXT | NOT NULL, REFERENCES training_types(id) |
| day_of_week | INTEGER | NOT NULL (0=Sunday, 1=Monday, ..., 6=Saturday) |
| start_time | TEXT | NOT NULL (HH:MM format) |
| active | INTEGER | NOT NULL DEFAULT 1 |
| created_at | TEXT | NOT NULL |

### `time_slots` table

Generated from templates, represent actual bookable sessions.

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| template_id | TEXT | NULLABLE, REFERENCES schedule_templates(id) |
| training_type_id | TEXT | NOT NULL, REFERENCES training_types(id) |
| date | TEXT | NOT NULL (YYYY-MM-DD) |
| start_time | TEXT | NOT NULL (HH:MM) |
| end_time | TEXT | NOT NULL (HH:MM) |
| status | TEXT | NOT NULL DEFAULT 'available' ('available' \| 'cancelled' \| 'full') |
| max_capacity | INTEGER | NOT NULL |
| notes | TEXT | NULLABLE |
| created_at | TEXT | NOT NULL |

## API Endpoints

### Admin endpoints (require admin role)

- `GET /api/admin/training-types` — List all training types
- `POST /api/admin/training-types` — Create a training type
- `PUT /api/admin/training-types/:id` — Update a training type
- `GET /api/admin/schedule-templates` — List all schedule templates
- `POST /api/admin/schedule-templates` — Create a schedule template
- `PUT /api/admin/schedule-templates/:id` — Update a template
- `DELETE /api/admin/schedule-templates/:id` — Deactivate a template
- `POST /api/admin/time-slots/:id/cancel` — Cancel a specific slot
- `PUT /api/admin/time-slots/:id` — Reschedule a specific slot
- `POST /api/admin/generate-slots` — Trigger slot generation for date range

### Public endpoints

- `GET /api/schedule/types` — List active training types (public info)
- `GET /api/schedule/slots?from=DATE&to=DATE&type=TYPE` — Available time slots

## Edge Cases

- **Template change after slot generation:** Existing generated slots are not affected. New generation uses updated template.
- **Delete template with future bookings:** Template is deactivated (soft delete). Existing slots and bookings remain.
- **Overlapping templates:** Admin should be warned but not blocked (trainers might have back-to-back sessions).
- **Holiday/vacation:** Admin cancels individual slots or a date range.
- **Past slots:** Never shown in available slots. Preserved for history.

## Error Handling

- Create template with invalid time → 400 with validation message
- Cancel already-cancelled slot → 400 "Zeitfenster bereits abgesagt"
- Non-admin access to admin endpoints → 403
- Generate slots for past dates → 400 "Kann keine Zeitfenster in der Vergangenheit generieren"

## Non-Functional Requirements

- **Performance:** Slot queries for 4-week horizon must complete in < 50ms
- **Security:** Admin-only endpoints protected by role middleware
- **Timezone:** All times in Europe/Zurich (CET/CEST). Stored as local time strings.

## Azure Deployment Path

All scheduling data lives in SQLite (same database as users). The Azure deployment strategy from `frd-database.md` applies — persistent Azure Files volume mount ensures schedule templates, training types, and generated time slots survive redeployments. No additional Azure resources needed beyond what `frd-database.md` specifies.
