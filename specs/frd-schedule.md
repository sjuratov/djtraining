# FRD-005: Training Schedule (Trainingszeiten)

**Status:** Draft
**PRD Section:** 3.1.5
**Priority:** P1

## Overview

The training schedule page displays the complete weekly timetable for all training types offered at DJ's Training. It clearly separates Personal Training hours from Gruppentraining sessions, showing visitors when they can book or attend sessions.

## User Stories

- As a visitor, I want to see the weekly training schedule so that I can plan when to train.
- As a visitor, I want to know the difference between Personal Training and Gruppentraining times so that I book the right type of session.
- As a visitor, I want to see that weekends are closed so that I don't plan to visit on Saturday or Sunday.
- As a visitor on mobile, I want the schedule to be readable on my phone so that I can check it on the go.

## Acceptance Criteria

- [ ] Page is accessible at route /trainingszeiten
- [ ] Page displays Personal Training schedule: Monday–Friday, 9:00–12:00 & 16:00–21:00
- [ ] Page displays Gruppentraining schedule: Monday 18:00 & 19:15, Thursday 18:00 & 19:15
- [ ] Saturday and Sunday are explicitly shown as closed ("Geschlossen")
- [ ] Personal Training and Gruppentraining schedules are visually distinct
- [ ] Schedule is presented in a clear table or visual timetable format
- [ ] Page is responsive and readable on mobile devices
- [ ] CTA links to /kontakt for booking
- [ ] Page has SEO meta tags in German

## UI/UX Requirements

### Schedule Display Options

**Option A: Table Format**
- Rows: Days of the week (Montag–Sonntag)
- Columns: Time slots or training types
- Color-coded: one color for Personal Training, another for Gruppentraining
- Clear headers and legend

**Option B: Visual Timetable**
- Week view with time slots on the Y-axis, days on the X-axis
- Colored blocks representing training availability
- Hover/tap for details

### Recommended Implementation
- Section 1: Personal Training schedule (table)
- Section 2: Gruppentraining schedule (table)
- Each section has its own heading and visual style
- Color-coded legend at the top

### Responsive Behavior
- Desktop: Full table or grid view
- Mobile: Stacked day-by-day view, or horizontally scrollable table
- Touch-friendly: adequate tap targets

### Visual Indicators
- Available time slots: filled/colored cells
- Closed days: greyed out or marked with "Geschlossen"
- Group session times: specific time badges (18:00, 19:15)

## API Requirements

No API endpoints required. Schedule content is static/SSG.

## Content

### Page Title & SEO (German)
```html
<title>Trainingszeiten — Wochenplan | DJ's Training Buchs AG</title>
<meta name="description" content="Trainingszeiten bei DJ's Training in Buchs AG. Personal Training Mo–Fr 9–12 & 16–21 Uhr. Gruppentraining Mo & Do 18:00 & 19:15." />
```

### Schedule Content (German)

**Page Heading:**
```
Trainingszeiten
```

**Intro Text:**
```
Hier findest du die aktuellen Trainingszeiten in meinem Studio in Buchs AG.
Für Personal Training und Ernährungscoaching kannst du individuell Termine
vereinbaren. Das Gruppentraining findet zu festen Zeiten statt.
```

**Personal Training Schedule:**
```
Heading: Personal Training

Individuelle Termine nach Vereinbarung zu folgenden Zeiten:

| Tag | Vormittag | Nachmittag/Abend |
|-----|-----------|------------------|
| Montag | 9:00–12:00 | 16:00–21:00 |
| Dienstag | 9:00–12:00 | 16:00–21:00 |
| Mittwoch | 9:00–12:00 | 16:00–21:00 |
| Donnerstag | 9:00–12:00 | 16:00–21:00 |
| Freitag | 9:00–12:00 | 16:00–21:00 |
| Samstag | Geschlossen | Geschlossen |
| Sonntag | Geschlossen | Geschlossen |
```

**Gruppentraining Schedule:**
```
Heading: Gruppentraining

Feste Trainingszeiten in der Kleingruppe (max. 5 Personen):

| Tag | Zeit |
|-----|------|
| Montag | 18:00 & 19:15 |
| Donnerstag | 18:00 & 19:15 |

Dauer: 60 Minuten pro Einheit
```

**CTA Section:**
```
Heading: Termin vereinbaren

Möchtest du einen Termin buchen oder hast du Fragen zu den Trainingszeiten?
Kontaktiere mich gerne!

Button: Kontakt aufnehmen → /kontakt
```

### Legend (German)
```
🟦 Personal Training (nach Vereinbarung)
🟩 Gruppentraining (feste Zeiten)
⬜ Geschlossen
```

## Edge Cases

- **Schedule changes:** Content should be easy to update if training times change
- **Holiday closures:** Currently not in scope, but structure should allow for future "Feiertage" notices
- **Timezone:** All times are in Swiss local time (CET/CEST) — no timezone conversion needed
- **No JavaScript:** Schedule table renders fully as server-side HTML
- **Screen readers:** Tables must use proper `<thead>`, `<th>`, and scope attributes
- **Print-friendly:** Schedule should be printable for clients who want a physical copy
- **Mobile overflow:** If table is too wide, use horizontal scroll with visual indicator or stack into cards
