# FRD-003: About Page (Über mich)

**Status:** Draft
**PRD Section:** 3.1.3
**Priority:** P1

## Overview

The "Über mich" page presents Diana Juratovic's biography, professional qualifications, and studio information. It establishes trust and personal connection with potential clients by sharing her background, international experience, and certifications.

## User Stories

- As a visitor, I want to read about Diana's background and experience so that I feel confident in her qualifications as a personal trainer.
- As a visitor, I want to see Diana's certifications listed so that I can verify her professional credentials.
- As a visitor, I want to learn about the studio so that I know what to expect when I visit.
- As a visitor, I want to see a professional photo of Diana so that I feel a personal connection before booking.

## Acceptance Criteria

- [ ] Page is accessible at route /ueber-mich
- [ ] Page displays Diana's professional photo (or placeholder image)
- [ ] Page displays Diana's biography text in German
- [ ] Biography mentions: born in Croatia, married with 2 children
- [ ] Biography mentions: fitness career started in 2004 in England
- [ ] Biography mentions: international experience across multiple countries
- [ ] Biography mentions: certifications in fitness, nutrition, Pilates, HIIT, strength training
- [ ] Biography mentions: owns a private studio in Buchs AG
- [ ] Professional qualifications are displayed as a structured list
- [ ] Studio information section describes the private studio
- [ ] Page has appropriate SEO meta tags (title, description in German)
- [ ] Layout is responsive — photo and text reflow on mobile
- [ ] Content is structured with clear headings (h1, h2)
- [ ] A CTA links to /kontakt for booking inquiries

## UI/UX Requirements

### Page Layout
- Hero area with page title "Über mich" and optional background
- Two-column layout (desktop): photo left, bio text right
- Single column (mobile): photo top, bio text below
- Qualifications section below the bio as a styled list or grid
- Studio section with optional studio photos

### Photo Section
- Professional portrait of Diana
- Rounded or slightly rounded corners
- Responsive: full-width on mobile, ~40% width on desktop
- Alt text: "Diana Juratovic — Personal Trainerin & Ernährungscoach"

### Biography Text
- Well-structured with paragraphs, not a wall of text
- Key achievements can be highlighted (bold or accent color)
- Reading-friendly font size and line height

### Qualifications List
- Displayed as a styled list with checkmarks or icons
- Two-column grid on desktop, single column on mobile

### Studio Section
- Heading: "Mein Studio"
- Description of the private studio
- Optional: studio photos in a gallery or grid

## API Requirements

No API endpoints required. Content is static/SSG.

## Content

### Page Title & SEO (German)
```html
<title>Über mich — Diana Juratovic | DJ's Training Buchs AG</title>
<meta name="description" content="Lerne Diana Juratovic kennen — zertifizierte Personal Trainerin und Ernährungscoach mit über 20 Jahren Erfahrung in Buchs AG." />
```

### Biography (German)
```
Heading: Über mich

Mein Name ist Diana Juratovic. Ich wurde in Kroatien geboren, bin verheiratet und
Mutter von zwei Kindern. Meine Leidenschaft für Fitness und Gesundheit hat mich
2004 in England dazu inspiriert, meine Karriere als Personal Trainerin zu starten.

Seitdem habe ich internationale Erfahrung in verschiedenen Ländern gesammelt und
mich kontinuierlich weitergebildet. Heute bringe ich über 20 Jahre Expertise in
den Bereichen Fitness, Ernährung und Wohlbefinden mit.

In meinem privaten Studio in Buchs AG biete ich dir ein persönliches und
professionelles Trainingsumfeld — weg von überfüllten Fitnessstudios, hin zu
individueller Betreuung und echten Ergebnissen.

Mein Ziel ist es, dich auf deinem ganz persönlichen Weg zu mehr Gesundheit,
Fitness und Wohlbefinden zu begleiten — mit einem ganzheitlichen Ansatz, der
auf deine Bedürfnisse zugeschnitten ist.
```

### Qualifications (German)
```
Heading: Meine Qualifikationen

- Zertifizierte Personal Trainerin
- Ernährungscoach
- Pilates Trainerin
- HIIT Spezialistin
- Kraft- und Ausdauertraining
- Vibrationstraining
- Gruppentraining Leitung
- Erste Hilfe Zertifikat
```

### Studio Section (German)
```
Heading: Mein Studio

Mein privates Trainingsstudio befindet sich an der Rösslimattstrasse 2c in
Buchs AG. Hier trainierst du in einer ruhigen, persönlichen Atmosphäre —
ohne Wartezeiten, ohne Ablenkung und mit meiner vollen Aufmerksamkeit.

Das Studio ist ausgestattet mit modernen Trainingsgeräten, einer
Vibrationsplatte und allem, was du für ein effektives Training brauchst.
```

### CTA (German)
```
Text: Bereit für dein erstes Training?
Button: Kontakt aufnehmen → /kontakt
```

## Edge Cases

- **Photo not available:** Display a styled placeholder silhouette with "Foto folgt" text
- **Long qualifications list:** If list grows, display in a scrollable area or expandable section
- **No JavaScript:** All bio content renders as server-side HTML
- **Screen readers:** Photo alt text must be descriptive; qualifications list uses semantic `<ul>` markup
- **Print view:** Bio and qualifications should be readable when printed
