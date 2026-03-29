# FRD-002: Homepage

**Status:** Draft
**PRD Section:** 3.1.2
**Priority:** P0

## Overview

The homepage is the primary landing page for DJ's Training website. It introduces the business with a hero section featuring a motivational tagline, a brief about teaser, and three service cards highlighting the core offerings: Personal Training, Gruppentraining, and Ernährungscoaching.

## User Stories

- As a visitor, I want to immediately understand what DJ's Training offers when I land on the homepage so that I can decide if this is the right fitness studio for me.
- As a visitor, I want to see a clear call-to-action for a free trial so that I can easily sign up to try the service.
- As a visitor, I want to see the three main services summarized so that I can quickly navigate to the one I'm interested in.
- As a visitor, I want to learn a little about Diana so that I feel a personal connection before booking.

## Acceptance Criteria

- [ ] Hero section is displayed full-width at the top of the page
- [ ] Hero section displays the tagline: "Starte mit mir deine persönliche Reise zu mehr Gesundheit, Fitness & Wohlbefinden"
- [ ] Hero section includes a CTA button labeled "Kostenloses Probetraining" linking to /kontakt
- [ ] Hero section has a fitness-themed background image
- [ ] "Über mich" teaser section displays a short intro about Diana
- [ ] "Über mich" teaser includes a "Mehr erfahren" link to /ueber-mich
- [ ] "Mein Angebot" section displays exactly 3 service cards
- [ ] Personal Training card links to /personal-training
- [ ] Gruppentraining card links to /gruppentraining
- [ ] Ernährungscoaching card links to /ernaehrungscoaching
- [ ] Each service card has an icon or image, a title, a short description, and a CTA link
- [ ] Service cards display in a 3-column grid on desktop
- [ ] Service cards stack vertically (1 column) on mobile
- [ ] Page has appropriate SEO meta tags (title, description in German)
- [ ] Page has Open Graph tags for social sharing
- [ ] Page loads with LCP under 2.5 seconds

## UI/UX Requirements

### Hero Section
- Full-width, min-height ~60vh
- Background: fitness-themed image with dark overlay for text contrast
- Tagline: large, bold, white text centered or left-aligned
- CTA button: prominent accent color, rounded, clear hover state
- Responsive: text size adjusts for mobile, image scales/crops appropriately

### Über mich Teaser
- Side-by-side layout: image left, text right (desktop)
- Stacked: image top, text bottom (mobile)
- Photo: Diana's professional photo (placeholder until real image available)
- Text: 2–3 sentences introducing Diana
- "Mehr erfahren →" link at the bottom

### Mein Angebot Section
- Section heading: "Mein Angebot"
- 3 cards in a responsive grid (gap: 24px)
- Each card contains:
  - Icon or image at top
  - Service title (bold)
  - 1–2 sentence description
  - "Mehr erfahren →" link
- Cards have subtle shadow, rounded corners, hover lift effect

### Section Spacing
- Each section has clear visual separation (padding or background alternation)
- Consistent vertical rhythm: 64px+ between sections on desktop

## API Requirements

No API endpoints required. Homepage content is static/SSG.

## Content

### Hero Section (German)
```
Headline: Starte mit mir deine persönliche Reise zu mehr Gesundheit, Fitness & Wohlbefinden

CTA Button: Kostenloses Probetraining
```

### Über mich Teaser (German)
```
Heading: Über mich

Text: Ich bin Diana Juratovic, zertifizierte Personal Trainerin und Ernährungscoach
mit über 20 Jahren Erfahrung. In meinem privaten Studio in Buchs AG begleite ich
dich auf deinem Weg zu mehr Gesundheit, Fitness und Wohlbefinden — individuell
und persönlich.

Link: Mehr erfahren →
```

### Service Cards (German)

**Card 1 — Personal Training**
```
Title: Personal Training
Description: Individuelles Training, HIIT und Vibrationstraining — massgeschneidert
auf deine Ziele und dein Fitnesslevel.
Link: Mehr erfahren →
Route: /personal-training
```

**Card 2 — Gruppentraining**
```
Title: Gruppentraining
Description: Training in Kleingruppen mit maximal 5 Personen — motivierend,
effektiv und zu fairen Preisen.
Link: Mehr erfahren →
Route: /gruppentraining
```

**Card 3 — Ernährungscoaching**
```
Title: Ernährungscoaching
Description: Ganzheitliche Ernährungsberatung ohne strenge Diäten — für
nachhaltige Gewohnheiten und mehr Wohlbefinden.
Link: Mehr erfahren →
Route: /ernaehrungscoaching
```

### SEO Meta Tags (German)
```html
<title>DJ's Training — Personal Training & Fitness in Buchs AG</title>
<meta name="description" content="Starte deine persönliche Reise zu mehr Gesundheit, Fitness & Wohlbefinden. Personal Training, Gruppentraining und Ernährungscoaching in Buchs AG mit Diana Juratovic." />
<meta property="og:title" content="DJ's Training — Personal Training & Fitness in Buchs AG" />
<meta property="og:description" content="Personal Training, Gruppentraining und Ernährungscoaching in Buchs AG." />
<meta property="og:type" content="website" />
```

## Edge Cases

- **Hero image loading:** Show a solid background color while the hero image loads to prevent layout shift
- **Slow connection:** Service cards should render with text before images load
- **No JavaScript:** All content should be visible as server-rendered HTML
- **Empty state:** Not applicable — homepage content is always present
- **Image fallback:** If hero image fails to load, display a gradient background as fallback
- **Very small screens (< 320px):** Tagline text should still be readable, CTA button should not overflow
