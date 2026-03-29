# FRD-004: Services Pages (Angebot)

**Status:** Draft
**PRD Section:** 3.1.4
**Priority:** P1

## Overview

The services section consists of four pages: an overview page (/angebot) linking to three detail pages — Personal Training (/personal-training), Gruppentraining (/gruppentraining), and Ernährungscoaching (/ernaehrungscoaching). Each detail page includes service descriptions, pricing tables, and CTAs for booking.

## User Stories

- As a visitor, I want to see an overview of all services so that I can choose the one that interests me most.
- As a visitor, I want to see detailed pricing for Personal Training so that I can plan my budget.
- As a visitor, I want to know the group training schedule and max group size so that I can decide if it fits my schedule.
- As a visitor, I want to learn about the nutrition coaching approach so that I know it aligns with my goals.
- As a visitor, I want to see package pricing (single, 20-pack, 40-pack) so that I can choose the best value.

## Acceptance Criteria

### Services Overview (/angebot)
- [ ] Page is accessible at route /angebot
- [ ] Page displays 3 service cards: Personal Training, Gruppentraining, Ernährungscoaching
- [ ] Each card has a title, brief description, and "Mehr erfahren" link
- [ ] Personal Training card links to /personal-training
- [ ] Gruppentraining card links to /gruppentraining
- [ ] Ernährungscoaching card links to /ernaehrungscoaching
- [ ] Cards display in a responsive grid (3 columns desktop, 1 column mobile)

### Personal Training (/personal-training)
- [ ] Page is accessible at route /personal-training
- [ ] Page displays three sub-services: Individuelles Training, HIIT Training, Vibrationstraining
- [ ] Individuelles Training shows: 60 min, Einzelstunde 100 CHF, 20er-Abo 1'900 CHF, 40er-Abo 3'600 CHF
- [ ] HIIT Training shows: 30 min, Einzelstunde 50 CHF, 20er-Abo 960 CHF, 40er-Abo 1'800 CHF
- [ ] Vibrationstraining shows: 45 min, Einzelstunde 80 CHF, 20er-Abo 1'440 CHF, 40er-Abo 2'560 CHF
- [ ] Pair training option is mentioned with note about higher rates
- [ ] Training hours are displayed: Mon–Fri 9:00–12:00 & 16:00–21:00
- [ ] CTA links to /kontakt for booking
- [ ] Link to /trainingszeiten for full schedule

### Gruppentraining (/gruppentraining)
- [ ] Page is accessible at route /gruppentraining
- [ ] Page states maximum 5 persons per group
- [ ] Page states session duration: 60 minutes
- [ ] Schedule displayed: Monday 18:00 & 19:15, Thursday 18:00 & 19:15
- [ ] Pricing: Einzelstunde 25 CHF, 20er-Abo 460 CHF, 40er-Abo 800 CHF
- [ ] Free trial training ("Kostenloses Probetraining") CTA is prominently displayed
- [ ] CTA links to /kontakt for booking

### Ernährungscoaching (/ernaehrungscoaching)
- [ ] Page is accessible at route /ernaehrungscoaching
- [ ] Free initial consultation (60 min, kostenlos) is prominently highlighted
- [ ] Holistic, non-diet approach philosophy is clearly communicated
- [ ] Follow-up pricing: Einzelstunde 100 CHF, 5er-Abo 450 CHF, 10er-Abo 900 CHF
- [ ] CTA to book initial consultation links to /kontakt

### All Service Pages
- [ ] All prices are formatted in Swiss conventions (CHF currency)
- [ ] All service pages have SEO meta tags in German
- [ ] All pages are responsive and mobile-friendly
- [ ] Pricing tables are readable on mobile (horizontal scroll or stacked layout)

## UI/UX Requirements

### Services Overview Page
- Page heading: "Mein Angebot"
- 3 service cards in a responsive grid
- Each card: icon/image, title, description (2–3 sentences), "Mehr erfahren →" link
- Cards with shadow, rounded corners, hover effect

### Service Detail Pages
- Page heading: service name
- Introductory description paragraph
- Pricing displayed in clear tables with alternating row colors
- Each pricing table has columns: Paket, Dauer, Preis (CHF)
- CTA section at the bottom with accent-colored button
- Breadcrumb navigation: Home > Angebot > {Service Name}

### Pricing Tables
- Clean table design with header row
- Alternating row backgrounds for readability
- CHF amounts right-aligned
- Swiss number formatting (apostrophe as thousands separator: 1'900)
- "Best value" badge or highlight on largest package (optional)

### Responsive Behavior
- Tables: horizontal scroll on mobile, or stack into card layout
- Service description: full-width text on all devices
- CTA buttons: full-width on mobile

## API Requirements

No API endpoints required. All service content is static/SSG.

## Content

### Services Overview (German)
```
Heading: Mein Angebot

Intro: Ob Personal Training, Gruppentraining oder Ernährungscoaching — bei
DJ's Training findest du das passende Angebot für deine Ziele. Alle Trainings
finden in meinem privaten Studio in Buchs AG statt.
```

### Personal Training Page (German)
```
Heading: Personal Training

Intro: Dein individuelles Training — massgeschneidert auf deine Ziele, dein
Fitnesslevel und deine Bedürfnisse. Ob Muskelaufbau, Fettabbau, Rehabilitation
oder allgemeine Fitness — ich begleite dich persönlich auf deinem Weg.

Trainingszeiten: Montag bis Freitag, 9:00–12:00 & 16:00–21:00
```

**Individuelles Training**
```
Heading: Individuelles Training
Duration: 60 Minuten
Description: Persönliches 1:1 Training, komplett auf dich abgestimmt.

| Paket | Preis (CHF) |
|-------|-------------|
| Einzelstunde | 100 |
| 20er-Abo | 1'900 |
| 40er-Abo | 3'600 |
```

**HIIT Training**
```
Heading: HIIT Training
Duration: 30 Minuten
Description: Hochintensives Intervalltraining für maximale Ergebnisse in
kurzer Zeit.

| Paket | Preis (CHF) |
|-------|-------------|
| Einzelstunde | 50 |
| 20er-Abo | 960 |
| 40er-Abo | 1'800 |
```

**Vibrationstraining**
```
Heading: Vibrationstraining
Duration: 45 Minuten
Description: Training auf der Vibrationsplatte — effektiv für Muskelaufbau,
Balance und Durchblutung.

| Paket | Preis (CHF) |
|-------|-------------|
| Einzelstunde | 80 |
| 20er-Abo | 1'440 |
| 40er-Abo | 2'560 |
```

**Pair Training Note**
```
Zu zweit trainieren: Paartraining ist zu höheren Konditionen möglich.
Kontaktiere mich für ein individuelles Angebot.
```

### Gruppentraining Page (German)
```
Heading: Gruppentraining

Intro: Training in der Kleingruppe — motivierend, effektiv und erschwinglich.
Maximal 5 Personen pro Gruppe garantieren persönliche Betreuung und eine
familiäre Atmosphäre.

Details:
- Dauer: 60 Minuten
- Max. Teilnehmer: 5 Personen
- Trainingszeiten:
  - Montag: 18:00 & 19:15
  - Donnerstag: 18:00 & 19:15

| Paket | Preis (CHF) |
|-------|-------------|
| Einzelstunde | 25 |
| 20er-Abo | 460 |
| 40er-Abo | 800 |

Special: Kostenloses Probetraining — probiere eine Stunde gratis aus!
```

### Ernährungscoaching Page (German)
```
Heading: Ernährungscoaching

Intro: Ganzheitliche Ernährungsberatung ohne strenge Diäten. Ich unterstütze
dich dabei, nachhaltige Essgewohnheiten zu entwickeln, die zu deinem Alltag
passen — für mehr Energie, Gesundheit und Wohlbefinden.

Erstgespräch: Das Erstgespräch (60 Minuten) ist kostenlos und unverbindlich.
Dabei lernen wir uns kennen und besprechen deine Ziele und Wünsche.

| Paket | Preis (CHF) |
|-------|-------------|
| Einzelstunde | 100 |
| 5er-Abo | 450 |
| 10er-Abo | 900 |

CTA: Jetzt kostenloses Erstgespräch vereinbaren → /kontakt
```

### SEO Meta Tags (German)
```html
<!-- /angebot -->
<title>Angebot — Personal Training, Gruppentraining & Ernährungscoaching | DJ's Training</title>
<meta name="description" content="Entdecke das Angebot von DJ's Training in Buchs AG: Personal Training, Gruppentraining und Ernährungscoaching." />

<!-- /personal-training -->
<title>Personal Training in Buchs AG | DJ's Training</title>
<meta name="description" content="Individuelles Training, HIIT und Vibrationstraining in Buchs AG. Massgeschneidert auf deine Ziele mit Diana Juratovic." />

<!-- /gruppentraining -->
<title>Gruppentraining in Buchs AG | DJ's Training</title>
<meta name="description" content="Gruppentraining in Kleingruppen mit max. 5 Personen. Montag und Donnerstag in Buchs AG. Kostenloses Probetraining!" />

<!-- /ernaehrungscoaching -->
<title>Ernährungscoaching in Buchs AG | DJ's Training</title>
<meta name="description" content="Ganzheitliche Ernährungsberatung ohne Diäten. Kostenloses Erstgespräch in Buchs AG mit Diana Juratovic." />
```

## Edge Cases

- **Pricing changes:** Prices should be easy to update (single source of truth, not scattered)
- **Mobile pricing tables:** Tables must remain readable on small screens — consider card layout alternative
- **Zero sessions remaining:** Not applicable for static pricing, but relevant for future booking system
- **Currency formatting:** Always use "CHF" prefix/suffix and Swiss number formatting (1'900 not 1,900)
- **Empty sub-service:** If a sub-service is temporarily unavailable, show a notice instead of removing it
- **Long descriptions:** Text should not cause cards to become uneven heights — use CSS grid alignment
- **No JavaScript:** All pricing tables and content render as server-side HTML
