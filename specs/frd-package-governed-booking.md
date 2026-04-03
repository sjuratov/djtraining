# FRD: Package-Governed Booking

## Overview

Require clients to have an eligible purchased package ("Abo") before they can book a training session. Admins must be able to assign packages directly to a client's profile, and the booking flow must show the client's remaining entitlement for the relevant training category. Booking decrements the package by one session; cancellation credits one session back.

## User Stories

- As an **admin**, I want to assign a package to a client from the admin user/profile area so that the client is entitled to book sessions.
- As a **registered client**, I want to see how many sessions I have left for a training category so that I understand my available entitlement before booking.
- As a **registered client**, I want unavailable training categories to remain visible but disabled so that I can see what else I could buy.
- As the **system**, I want to block booking when the client has no eligible package with remaining sessions so that package rules are enforced consistently.
- As the **system**, I want booking cancellation to credit one session back to the originally used package so that balances stay accurate.

## Integration Points

- **Existing package system (`frd-packages.md`)** — changes the current rule from "booking is still allowed without a package" to "booking requires an eligible package".
- **Existing booking flow (`frd-booking.md`)** — modifies `/buchen` and booking creation rules; confirmation flow remains in place.
- **Admin dashboard (`/admin`)** — adds package assignment and package visibility to the admin user/profile workflow.
- **Client profile (`/profile`)** — continues showing package state and may link to booking eligibility information.
- **Offer pages** — disabled booking choices link to `/personal-training`, `/gruppentraining`, or `/ernaehrungscoaching` for upsell and context.

## Acceptance Criteria

### Admin Package Assignment
- [ ] Admin can assign a package to a client directly from the admin user/profile workflow
- [ ] Admin sees the client's active and past packages with remaining sessions and expiry
- [ ] Admin can add a note when assigning a package
- [ ] Admin can assign packages per training category (personal, gruppe, ernaehrung)

### Booking Enforcement
- [ ] Client cannot create a booking without an eligible active package that has remaining sessions
- [ ] Booking uses the earliest-expiring eligible package first
- [ ] Cancelling a booking credits one session back to the same package used for the booking
- [ ] If a client has zero eligible sessions, the booking API returns a clear business error

### Client Booking UX
- [ ] `/buchen` shows all training categories, even if the client has not purchased them
- [ ] Training categories the client has not purchased are disabled/greyed out
- [ ] Disabled categories link to the relevant offer pages for more information
- [ ] Enabled categories show the client's remaining sessions, e.g. `5/10 Trainings übrig`
- [ ] Client can only proceed to calendar and slot selection for categories they are entitled to book
- [ ] If the client has no eligible package at all, `/buchen` shows a clear message explaining that a package must be purchased or assigned before booking is possible
- [ ] Disabled categories explain why they are unavailable and guide the client to the relevant `Angebot` page for more information

## Edge Cases

- **Multiple active packages in one category:** booking consumes the one that expires soonest
- **Cancellation after package depletion:** credit-back reactivates the package if it now has sessions again
- **Client owns only group package:** personal and nutrition remain visible but disabled in `/buchen`
- **Admin assigns package after client already has another active package:** both remain visible; booking still consumes earliest-expiring eligible package
- **Client has packages in other categories but not the selected category:** booking remains blocked for that category only

## Error Handling

- Book without eligible package → 409 `Kein aktives Abo für diese Trainingsart verfügbar`
- Book with package that has expired or zero sessions → 409 with clear category-specific message
- Assign package to non-existent user → 404
- Non-admin package assignment attempt → 403
- Client opens `/buchen` with no active package → show a non-technical CTA message, e.g. `Du hast aktuell kein aktives Abo. Bitte wähle ein passendes Angebot oder kontaktiere das Studio.`

## Non-Functional Requirements

- **Performance:** entitlement lookup during booking must remain within existing booking performance targets
- **Security:** only admins can assign packages; clients can see only their own entitlements
- **Accessibility:** disabled booking options must remain understandable and keyboard accessible
- **Azure deployment:** no new infrastructure required; uses existing API, SQLite persistence, and web app deployment path
