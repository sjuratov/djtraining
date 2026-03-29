# FRD-006: Testimonials (Kundenstimmen)

**Status:** Draft
**PRD Section:** 3.1.6
**Priority:** P1

## Overview

The testimonials page displays 17 client reviews from existing DJ's Training clients. Each testimonial includes the client's name, optional role/title, and their feedback text in German. The page builds social proof and trust for prospective clients.

## User Stories

- As a visitor, I want to read testimonials from real clients so that I feel confident about the quality of training.
- As a visitor, I want to see the client's name with each review so that the testimonials feel authentic.
- As a visitor, I want to browse all testimonials easily so that I can read as many or as few as I like.
- As an existing client, I want to know how to submit my own feedback so that I can share my experience.

## Acceptance Criteria

- [ ] Page is accessible at route /kundenstimmen
- [ ] Page displays exactly 17 client testimonials
- [ ] Each testimonial displays the client's name
- [ ] Each testimonial displays the review text in German
- [ ] Client role/title is displayed where available
- [ ] Testimonials are presented in an attractive card layout
- [ ] Responsive grid: 1 column on mobile, 2 columns on tablet, 3 columns on desktop
- [ ] All testimonial cards have consistent height handling (alignment or masonry)
- [ ] A CTA section encourages visitors to submit their own feedback
- [ ] Page has SEO meta tags in German
- [ ] Testimonials data is stored as structured data (JSON) for easy maintenance

## UI/UX Requirements

### Testimonial Cards
- Each card contains:
  - Client name (bold)
  - Role/title (italic, smaller text, if available)
  - Testimonial text (body text)
  - Optional: quotation marks or quote icon for visual flair
  - Optional: star rating display (5 stars)
- Card styling: subtle shadow, rounded corners, white background
- Consistent card sizing or masonry layout for varying text lengths

### Page Layout
- Page heading: "Kundenstimmen"
- Intro text thanking clients
- Responsive card grid with gap spacing
- CTA section at the bottom for feedback submission

### Responsive Grid
- Mobile (< 768px): 1 column
- Tablet (768–1024px): 2 columns
- Desktop (> 1024px): 3 columns
- Gap: 24px between cards

### Visual Design
- Large opening quotation mark (") as decorative element per card
- Client name with optional initials avatar circle
- Subtle accent color for card borders or name text

## API Requirements

No API endpoints required for initial implementation. Testimonials are stored as static structured data (JSON file or inline data).

Future enhancement: API endpoint for submitting new testimonials.

## Content

### Page Title & SEO (German)
```html
<title>Kundenstimmen — Bewertungen & Erfahrungen | DJ's Training Buchs AG</title>
<meta name="description" content="Lies, was Kunden über DJ's Training sagen. 17 echte Bewertungen von zufriedenen Kunden aus Buchs AG und Umgebung." />
```

### Page Heading & Intro (German)
```
Heading: Kundenstimmen

Intro: Meine Kundinnen und Kunden sind meine beste Empfehlung. Hier teilen sie
ihre Erfahrungen und Ergebnisse aus dem Training bei DJ's Training.
```

### Testimonials Data (German)

The 17 testimonials below are to be extracted/confirmed from the existing website at dj-training.com/kundenstimmen. Placeholder content is provided for structure:

```json
[
  {
    "id": 1,
    "name": "Sandra M.",
    "role": null,
    "text": "Diana ist eine fantastische Trainerin! Sie geht individuell auf meine Bedürfnisse ein und motiviert mich jedes Mal aufs Neue. Ich fühle mich fitter und stärker als je zuvor."
  },
  {
    "id": 2,
    "name": "Thomas K.",
    "role": null,
    "text": "Das Personal Training bei Diana hat mein Leben verändert. Nach einer Rückenoperation hat sie mir geholfen, wieder fit zu werden — professionell und einfühlsam."
  },
  {
    "id": 3,
    "name": "Monika W.",
    "role": null,
    "text": "Ich liebe das Gruppentraining! Die kleine Gruppengrösse ist perfekt und Diana sorgt für eine tolle Atmosphäre. Absolut empfehlenswert!"
  },
  {
    "id": 4,
    "name": "Peter S.",
    "role": null,
    "text": "Als Anfänger war ich nervös, aber Diana hat mir die Angst sofort genommen. Das Training ist anspruchsvoll, aber macht Spass."
  },
  {
    "id": 5,
    "name": "Claudia B.",
    "role": null,
    "text": "Die Ernährungsberatung war genau das, was ich gebraucht habe. Keine strengen Diäten, sondern alltagstaugliche Tipps. Ich habe 8 kg abgenommen!"
  },
  {
    "id": 6,
    "name": "Marco R.",
    "role": null,
    "text": "Seit einem Jahr trainiere ich bei Diana und bin begeistert. Professionell, motivierend und immer gut gelaunt."
  },
  {
    "id": 7,
    "name": "Sabine L.",
    "role": null,
    "text": "Das Vibrationstraining ist super effektiv! In nur 45 Minuten fühle ich mich richtig ausgepowert. Diana erklärt alles genau und achtet auf die richtige Ausführung."
  },
  {
    "id": 8,
    "name": "Andreas H.",
    "role": null,
    "text": "Ich habe schon viele Fitnessstudios ausprobiert, aber das private Studio von Diana ist mit Abstand das beste. Persönliche Betreuung auf höchstem Niveau."
  },
  {
    "id": 9,
    "name": "Nicole F.",
    "role": null,
    "text": "Das HIIT Training bei Diana ist der Hammer! 30 Minuten reichen aus, um richtig ins Schwitzen zu kommen. Sehr empfehlenswert für alle, die wenig Zeit haben."
  },
  {
    "id": 10,
    "name": "Reto D.",
    "role": null,
    "text": "Seit ich bei Diana trainiere, habe ich keine Rückenschmerzen mehr. Sie weiss genau, welche Übungen helfen und welche man vermeiden sollte."
  },
  {
    "id": 11,
    "name": "Karin P.",
    "role": null,
    "text": "Die familiäre Atmosphäre im Studio ist einzigartig. Man fühlt sich sofort willkommen. Diana ist nicht nur Trainerin, sondern auch Motivatorin."
  },
  {
    "id": 12,
    "name": "Stefan G.",
    "role": null,
    "text": "Top Trainerin mit viel Erfahrung! Diana hat mir geholfen, meine sportlichen Ziele zu erreichen. Das Training ist abwechslungsreich und macht Spass."
  },
  {
    "id": 13,
    "name": "Lisa M.",
    "role": null,
    "text": "Ich bin so froh, DJ's Training gefunden zu haben. Das Gruppentraining ist perfekt für meinen Feierabend. Preis-Leistung stimmt einfach!"
  },
  {
    "id": 14,
    "name": "Daniel V.",
    "role": null,
    "text": "Diana nimmt sich wirklich Zeit für jeden Kunden. Das Training ist immer individuell und nie langweilig. Absolute Empfehlung!"
  },
  {
    "id": 15,
    "name": "Martina J.",
    "role": null,
    "text": "Nach meiner Schwangerschaft hat Diana mir geholfen, wieder in Form zu kommen. Sie hat ein tolles Programm für mich zusammengestellt."
  },
  {
    "id": 16,
    "name": "Urs B.",
    "role": null,
    "text": "Ich trainiere seit drei Jahren bei Diana und bin immer noch begeistert. Das Studio ist top ausgestattet und Diana ist die beste Trainerin der Region."
  },
  {
    "id": 17,
    "name": "Franziska E.",
    "role": null,
    "text": "Die Kombination aus Training und Ernährungscoaching hat bei mir Wunder gewirkt. Diana hat einen ganzheitlichen Ansatz, der wirklich funktioniert."
  }
]
```

**Note:** The above testimonials are representative placeholders. Actual testimonial content must be extracted from the existing website (dj-training.com/kundenstimmen) during implementation.

### Feedback CTA (German)
```
Heading: Deine Meinung zählt!

Text: Bist du Kundin oder Kunde bei DJ's Training? Teile deine Erfahrung
und hilf anderen, die richtige Entscheidung zu treffen.

Button: Feedback senden → mailto:info@dj-training.com?subject=Kundenstimme
```

## Edge Cases

- **Long testimonial text:** Cards should handle varying text lengths gracefully (truncation with "Mehr lesen" or masonry layout)
- **Missing client role:** Role field is optional — card layout should work without it
- **Special characters in names:** German umlauts (ä, ö, ü) and accented characters must display correctly
- **Empty testimonials:** If for any reason testimonials data is empty, show a friendly message: "Kundenstimmen werden geladen..."
- **No JavaScript:** All testimonials render as server-side HTML
- **Screen readers:** Each testimonial should be wrapped in an `<article>` or `<blockquote>` with proper attribution
- **Print view:** Testimonials should be readable when printed (no card shadows, simple layout)
