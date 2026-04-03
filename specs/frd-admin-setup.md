# FRD: Admin Schedule Setup

## Overview

Provide a dedicated admin UI for managing training types, recurring weekly schedule templates, and slot generation. These are prerequisite setup steps that must happen before the calendar and booking flow are functional. Currently the API endpoints exist but there is no frontend to use them — admins have no way to configure the schedule without direct API calls.

## User Stories

- As an **admin**, I want to create and edit training types (Personal Training, Gruppentraining, Ernährungscoaching) so that the schedule categories are defined.
- As an **admin**, I want to create and manage recurring weekly schedule templates (e.g. "Monday 18:00 Gruppentraining") so that time slots are generated automatically.
- As an **admin**, I want to trigger slot generation for a date range so that bookable time slots appear in the calendar and client booking flow.
- As an **admin**, I want a single setup page where I can manage all of these so that initial configuration is intuitive.

## Integration Points

- **Existing API (`frd-scheduling.md`)** — All API endpoints already exist: training type CRUD, template CRUD, slot generation. This FRD adds only the frontend.
- **Admin calendar (`/admin/kalender`)** — After setup, generated slots appear in the calendar. The calendar's "create slot" modal already fetches training types.
- **Client booking flow (`/buchen`)** — Depends on training types and generated slots existing.
- **Public schedule page (`/trainingszeiten`)** — Renders from generated slots.
- **Admin navigation (Header)** — New "Einstellungen" link for admin users.

## Acceptance Criteria

### Training Types Management
- [ ] Admin can view list of all training types (active and inactive)
- [ ] Admin can create a new training type (name, category, duration, capacity, price)
- [ ] Admin can edit an existing training type
- [ ] Admin can deactivate/reactivate a training type
- [ ] Category is selectable from predefined options (personal, gruppe, ernaehrung)
- [ ] Price is entered in CHF and stored in Rappen

### Schedule Templates Management
- [ ] Admin can view list of all schedule templates with training type info
- [ ] Admin can create a new template (training type, day of week, start time)
- [ ] Admin can edit an existing template
- [ ] Admin can deactivate a template (soft delete)
- [ ] Day of week is selectable (Montag–Sonntag)
- [ ] Template list shows the associated training type name and category

### Slot Generation
- [ ] Admin can select a date range and trigger slot generation
- [ ] System shows how many slots were generated
- [ ] Admin is warned if generating slots for dates that already have slots (duplicates are skipped)
- [ ] Default date range suggestion: today + 4 weeks

### Navigation
- [ ] "Einstellungen" link appears in admin user menu (desktop and mobile)
- [ ] Page is accessible at `/admin/einstellungen`
- [ ] Non-admin users are redirected or shown access denied

## Edge Cases

- **No training types exist:** Show empty state with prompt to create first training type
- **Template references inactive training type:** Template is still visible but marked as using an inactive type
- **Generate slots with no active templates:** Show message "Keine aktiven Vorlagen vorhanden"
- **Generate slots for past dates:** API rejects with error, UI should show validation message
- **Duplicate template (same type + day + time):** API allows it (back-to-back trainers), but UI shows a warning

## Error Handling

- Create training type without required fields → client-side validation + 400 from API
- Create template with invalid training type → 400 "Trainingsart nicht gefunden"
- Generate slots for past dates → 400 "Kann keine Zeitfenster in der Vergangenheit generieren"
- Non-admin access → redirect to login or show "Zugriff verweigert"

## Non-Functional Requirements

- **Performance:** Lists load in < 100ms (small dataset, single SQLite query)
- **Security:** Admin-only page, all API calls use existing auth + role middleware
- **Accessibility:** Form fields have proper labels, focus management on modals
- **Mobile:** Responsive layout for all sections

## Azure Deployment Path

No infrastructure changes needed. Uses existing admin API endpoints and SQLite database. Frontend is part of the Next.js web container already deployed.
