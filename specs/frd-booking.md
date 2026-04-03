# FRD: Session Booking System

## Overview

Enable clients to self-serve book personal and group training sessions from available time slots. Admins (any user with the `admin` role — the system supports multiple admins) can view all bookings in a calendar view, reschedule or cancel sessions, and manage the overall booking lifecycle. Clients can view their own bookings and modify or cancel them (with 24h soft enforcement).

## User Stories

- As a **registered client**, I want to browse available time slots and book a training session so that I can secure my preferred training time.
- As a **registered client**, I want to see my upcoming and past bookings so that I can track my training schedule.
- As a **registered client**, I want to cancel or reschedule a booking so that I can adjust my plans.
- As a **registered client**, I want to be warned when cancelling within 24 hours so that I understand the policy.
- As an **admin**, I want to see all bookings in a calendar view with full CRUD so that I can manage the training schedule.
- As an **admin**, I want to reschedule or cancel client bookings so that I can handle operational changes.
- As an **admin**, I want to book sessions on behalf of clients so that I can handle phone/in-person requests.
- As an **admin**, I want to create, edit, and delete time slots directly from the calendar so that I have full schedule control.

## Integration Points

- **Schedule system (`frd-scheduling.md`)** — Bookings reference `time_slots`. Booking updates slot capacity/status.
- **User system (`frd-database.md`)** — Bookings reference `users.id`. Client must be `status: active`.
- **Package system (`frd-packages.md`)** — On booking, a session is deducted from the client's active package.
- **Navigation** — Add "Meine Termine" to authenticated user menu
- **Admin dashboard** — Add "Buchungen" section and calendar view
- **Public schedule page** — Show remaining capacity per slot

## Acceptance Criteria

### Client Booking

- [ ] Authenticated client can view available time slots with remaining capacity
- [ ] Client can book an available slot (personal or group)
- [ ] Client cannot book a full slot (group training at max capacity)
- [ ] Client cannot double-book the same time slot
- [ ] Client sees confirmation after successful booking
- [ ] Client can view their upcoming bookings on "Meine Termine" page
- [ ] Client can view their past bookings (history)
- [ ] Client can cancel a future booking
- [ ] Cancelling within 24h shows a warning message but is allowed
- [ ] Client can reschedule (cancel + rebook in one flow, if available slot exists)

### Admin Booking Management

- [ ] Admin can view all bookings (list and calendar views)
- [ ] Admin can filter bookings by date range, client, training type
- [ ] Admin can cancel any booking
- [ ] Admin can reschedule any booking to a different available slot
- [ ] Admin can book a session on behalf of a client
- [ ] Admin can see booking count per slot on the calendar

### Capacity Management

- [ ] Personal training slots have capacity 1 (or 2 for pair training)
- [ ] Group training slots have capacity from training type (default 5)
- [ ] Slot status changes to 'full' when capacity is reached
- [ ] Slot status changes back to 'available' on cancellation (if was full)

## Data Model

### `bookings` table

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| user_id | TEXT | NOT NULL, REFERENCES users(id) |
| time_slot_id | TEXT | NOT NULL, REFERENCES time_slots(id) |
| status | TEXT | NOT NULL DEFAULT 'confirmed' ('confirmed' \| 'cancelled' \| 'completed' \| 'no-show') |
| booked_by | TEXT | NOT NULL, REFERENCES users(id) (self or admin) |
| cancelled_at | TEXT | NULLABLE |
| cancellation_reason | TEXT | NULLABLE |
| notes | TEXT | NULLABLE |
| created_at | TEXT | NOT NULL |
| updated_at | TEXT | NOT NULL |

**Unique constraint:** `(user_id, time_slot_id)` where `status != 'cancelled'` — prevent double booking.

## API Endpoints

### Client endpoints (require authentication)

- `GET /api/bookings` — List current user's bookings (upcoming + past)
- `POST /api/bookings` — Create a booking `{ timeSlotId }`
- `DELETE /api/bookings/:id` — Cancel a booking (soft delete — sets status to 'cancelled')
- `PUT /api/bookings/:id/reschedule` — Reschedule to a new slot `{ newTimeSlotId }`

### Admin endpoints (require admin role)

- `GET /api/admin/bookings` — List all bookings with filters `?from=&to=&userId=&type=`
- `POST /api/admin/bookings` — Book on behalf of client `{ userId, timeSlotId }`
- `DELETE /api/admin/bookings/:id` — Cancel any booking
- `PUT /api/admin/bookings/:id/reschedule` — Reschedule any booking `{ newTimeSlotId }`
- `PUT /api/admin/bookings/:id/status` — Update status (e.g., mark as no-show, completed)

## UI Pages

### Client: Meine Termine (`/meine-termine`)

- Upcoming bookings list (date, time, training type, status)
- Past bookings list (collapsed by default)
- Cancel button on each upcoming booking (with 24h warning modal)
- Reschedule button → opens available slot picker
- "Neuen Termin buchen" CTA → links to booking flow

### Client: Booking Flow (`/buchen`)

- Step 1: Select training type (personal / group / nutrition)
- Step 2: Select available date and time slot
- Step 3: Confirm booking (shows summary, package balance if applicable)

### Admin: Booking Calendar (`/admin/kalender`)

The admin calendar is a central management hub with full CRUD capabilities:

- **Views:** Monthly, weekly, and daily calendar views
- **Color-coded** by training type (personal, group, nutrition)
- **Create:** Click an empty time slot → create a new ad-hoc session or book on behalf of a client
- **Read:** Click any slot → see all bookings, participant list, capacity status
- **Update:** Drag-and-drop or click-to-reschedule any slot; edit slot details (time, notes)
- **Delete:** Cancel individual slots or bulk-cancel a date range (vacation/holiday)
- **Booking management:** From any slot, cancel/reschedule client bookings, mark as completed/no-show
- **Filters:** Toggle training types on/off, filter by client name
- **At-a-glance info:** Booking count per slot, client package status indicators

## Edge Cases

- **Client account pending (unverified):** Cannot book. Show "Bitte bestätige zuerst deine E-Mail-Adresse."
- **Slot cancelled after booking:** Booking auto-cancelled. (Future: notify client.)
- **Admin reschedules a slot with existing bookings:** All bookings on old slot are moved to new slot.
- **Booking in the past:** API rejects. "Kann keinen Termin in der Vergangenheit buchen."
- **Last-minute cancellation (<24h):** Warning shown: "Achtung: Dieser Termin ist in weniger als 24 Stunden. Gemäss unseren AGB kann eine Stornogebühr anfallen."

## Error Handling

- Book a full slot → 409 "Dieses Zeitfenster ist ausgebucht"
- Double booking → 409 "Du hast diesen Termin bereits gebucht"
- Cancel already cancelled → 400 "Buchung bereits storniert"
- Book past slot → 400 "Kann keinen Termin in der Vergangenheit buchen"
- Unauthenticated access → 401
- Non-admin accessing admin endpoints → 403

## Non-Functional Requirements

- **Performance:** Booking creation must complete in < 100ms
- **Concurrency:** Use SQLite transactions to prevent double-booking race conditions
- **Security:** Users can only view/modify their own bookings. Admin can access all.
- **Accessibility:** Calendar views are keyboard-navigable with ARIA labels
