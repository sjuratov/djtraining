# FRD: Client Booking Month Calendar

## Overview

Improve the client booking flow on `/buchen` by replacing the current rolling 4-week date strip with a standard month calendar view. The booking page should open on the current month, show the whole month in a familiar calendar layout, and allow the user to navigate backward and forward by month before choosing a day and available time slot.

## User Stories

- As a **registered client**, I want to see a normal month calendar when booking so that I can understand the available dates in context.
- As a **registered client**, I want the booking calendar to open on the current month so that I can quickly book near-term sessions.
- As a **registered client**, I want to move to previous or next months so that I can plan ahead or review nearby dates.
- As a **registered client**, I want to keep the existing slot-selection and confirmation flow after choosing a date so that booking remains familiar.

## Integration Points

- **Existing booking flow (`frd-booking.md`)** — modifies Step 2 on `/buchen` from a rolling date grid to a navigable month calendar.
- **Existing schedule API (`GET /api/schedule/slots`)** — reused for month-range loading and per-day slot display; no API contract changes required.
- **Existing training type selection** — Step 1 remains unchanged and still filters available slots by category.
- **Existing booking confirmation** — Step 3 remains unchanged after a slot is selected.
- **Admin schedule setup (`frd-admin-setup.md`)** — generated slots from admin setup populate the client month calendar.

## Acceptance Criteria

- [ ] Step 2 on `/buchen` shows a standard month calendar layout for the current month
- [ ] The calendar starts with the current month, not a rolling sequence starting from today
- [ ] Users can navigate to previous and next months
- [ ] The calendar keeps a clear selected-day state
- [ ] Selecting a day loads and displays the available slots for that date
- [ ] Dates without available slots still appear in the month view
- [ ] The user can move from month view to slot selection and then to confirmation without losing the selected training type
- [ ] Existing booking confirmation and redirect to `/meine-termine?booked=true` remain unchanged

## Edge Cases

- **No slots in the current month:** The month view still renders and the slot list shows an empty state for selected days.
- **Navigate to months with no slots:** Navigation still works; no crash or blank page.
- **Selected day outside the visible month after navigation:** Selected day is cleared or reset consistently when month changes.
- **Training type with sparse availability:** Calendar still shows all dates; only the slot list changes based on filters.

## Error Handling

- Schedule data load fails → show existing booking-page error state
- Selected date has no available slots → show a friendly empty state in the slot list
- User session expires while booking → existing auth redirect to `/login` remains in place

## Non-Functional Requirements

- **Performance:** Month calendar navigation and slot loading should feel immediate; month-range slot fetches should remain under existing API performance targets.
- **Accessibility:** Month navigation buttons and date cells must remain keyboard accessible and visibly focusable.
- **Security:** Continues to use existing authenticated booking flow; no new authorization paths.
- **Azure deployment:** No new infrastructure or environment variables required; this is a web-only change with a clear Azure deployment path through the existing Next.js container.
