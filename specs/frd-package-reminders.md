# FRD: Package Expiry Reminders and Grace Handling

## Overview

Warn clients and admins when a purchased package is within 14 days of expiry, and give admins an explicit grace/extension workflow instead of silently allowing expired packages to remain bookable. The reminder is soft: it surfaces the situation clearly and supports a conscious admin decision to extend access or let the package expire.

## User Stories

- As a **registered client**, I want to see when my package is close to expiring so that I can plan remaining sessions or contact the studio.
- As an **admin**, I want to see clients whose packages expire within 14 days so that I can proactively work with them.
- As an **admin**, I want an explicit way to extend or grant grace on a package so that any exception is intentional and documented.
- As the **system**, I want booking eligibility to respect an approved grace period so that business exceptions are handled cleanly.

## Integration Points

- **Existing package system (`frd-packages.md`)** — extends `client_packages` with reminder/grace metadata while preserving purchased date and expiry date.
- **Existing booking system (`frd-booking.md`)** — booking eligibility must consider a valid grace extension when a package is otherwise expired.
- **Admin package management** — adds expiring-soon views and explicit extend/grace actions.
- **Client booking/profile pages** — shows 14-day warning banners and expiry details.

## Acceptance Criteria

### Reminder Behaviour
- [ ] A package shows an "expiring soon" warning starting 14 days before expiry
- [ ] The warning is visible to both the client and admins
- [ ] Admin overview can filter or highlight expiring-soon packages
- [ ] Expired packages are clearly marked and no longer bookable unless grace is granted

### Grace / Extension Workflow
- [ ] Admin can explicitly extend a package with a new effective end date and a required reason
- [ ] The original purchase date and original expiry remain visible for audit/history
- [ ] Booking eligibility uses the grace/extended end date when present
- [ ] The UI distinguishes between original expiry and extended/grace end date

### Booking Impact
- [ ] Expired packages without grace cannot be used for booking
- [ ] Active packages within the 14-day warning window remain bookable
- [ ] If grace is granted, booking continues until the grace end date

## Recommended Code/Flow

- Keep `purchased_at` and original `expires_at` as the commercial truth
- Add optional grace metadata on `client_packages`, e.g. `grace_until`, `grace_reason`, `grace_set_by`, `grace_set_at`
- Derive reminder state from `expires_at` (14-day window), not from a background notification system
- Do **not** auto-extend packages; require an explicit admin action so every exception is intentional and reviewable

This keeps the first implementation simple, avoids extra infrastructure, and preserves a clear audit trail.

## Edge Cases

- **Package expires but admin grants grace the same day:** booking becomes allowed through `grace_until`
- **Package is depleted before expiry:** show depleted state; expiry reminder is secondary
- **Admin extends an already expired package:** package becomes bookable again until `grace_until`
- **Multiple packages in same category:** reminder and grace are tracked per package, not per category

## Error Handling

- Grant grace without reason → 400 with validation message
- Set grace end date before original expiry or before today → 400
- Non-admin attempts grace action → 403

## Non-Functional Requirements

- **Performance:** expiring-soon queries should remain efficient for admin overview screens
- **Auditability:** every grace/extension action records who changed it and why
- **Security:** only admins can change grace/extension metadata
- **Azure deployment:** no new infrastructure required; reminder state is derived from database dates in the existing app
