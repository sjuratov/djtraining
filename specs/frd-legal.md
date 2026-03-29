# FRD-008: Legal Pages

**Status:** Draft
**PRD Section:** 3.1.8
**Priority:** P2

## Overview

Three legal/compliance pages required under Swiss law: Impressum (legal notice), AGB (terms and conditions), and Datenschutz (privacy policy). These pages are accessible from the footer on every page and contain the official legal text for DJ's Training-Fitness Studio Juratovic.

## User Stories

- As a visitor, I want to find the legal notice (Impressum) so that I know who operates the website.
- As a potential client, I want to read the terms and conditions so that I understand the booking and cancellation policies.
- As a visitor, I want to read the privacy policy so that I know how my data is handled.
- As a business owner, I want my legal pages to comply with Swiss law (DSG, OR) so that I'm legally protected.

## Acceptance Criteria

### Impressum (/impressum)
- [ ] Page is accessible at route /impressum
- [ ] Displays business name: DJ's Training-Fitness Studio Juratovic
- [ ] Displays owner name: Diana Juratovic
- [ ] Displays address: Rösslimattstrasse 2c, CH-5033 Buchs AG
- [ ] Displays commercial register number: CH-400.1.035.771-0
- [ ] Displays phone: +41 78 611 24 79
- [ ] Displays email: info@dj-training.com
- [ ] Phone and email are clickable links

### AGB (/agb)
- [ ] Page is accessible at route /agb
- [ ] Displays 24-hour cancellation policy
- [ ] Mentions health questionnaire requirement before first session
- [ ] Includes payment terms
- [ ] Includes liability disclaimers
- [ ] Mentions clean indoor shoes requirement
- [ ] Content matches existing website AGB text

### Datenschutz (/datenschutz)
- [ ] Page is accessible at route /datenschutz
- [ ] References Swiss Federal Data Protection Act (DSG)
- [ ] Describes data collection practices
- [ ] Describes data storage and usage policies
- [ ] Includes cookie policy
- [ ] Provides contact information for data inquiries
- [ ] Content matches existing website Datenschutz text

### All Legal Pages
- [ ] Pages are linked from the footer on every page
- [ ] Plain text layout, easy to read
- [ ] Last-updated date is displayed on each page
- [ ] Pages have SEO meta tags (noindex recommended for legal pages)
- [ ] Pages are responsive and mobile-friendly

## UI/UX Requirements

### Page Layout
- Simple, content-focused layout
- Page title as h1
- Structured with h2 subheadings for sections
- Body text with comfortable reading width (max ~800px)
- "Zuletzt aktualisiert" (last updated) date below title
- Footer is visible as on all pages

### Typography
- Readable font size (16px+ body text)
- Generous line height (1.6+)
- Left-aligned text (not justified)
- Proper paragraph spacing

### Navigation
- Breadcrumb: Home > {Impressum/AGB/Datenschutz}
- Links between legal pages (e.g., "Siehe auch: AGB | Datenschutz")

### Responsive
- Full-width reading column on mobile
- No tables or complex layouts needed
- Comfortable padding on all devices

## API Requirements

No API endpoints required. Legal content is static/SSG.

## Content

### Impressum Page (German)

```
Heading: Impressum

Zuletzt aktualisiert: [Datum]

Angaben gemäss Art. 3 Abs. 1 Bst. s des Bundesgesetzes gegen den unlauteren
Wettbewerb (UWG):

Firmenname: DJ's Training-Fitness Studio Juratovic
Inhaberin: Diana Juratovic
Adresse: Rösslimattstrasse 2c, CH-5033 Buchs AG
Telefon: +41 78 611 24 79
E-Mail: info@dj-training.com
Handelsregisternummer: CH-400.1.035.771-0

Haftungsausschluss:
Die Inhalte dieser Website werden mit grösster Sorgfalt erstellt. Für die
Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine
Gewähr übernehmen.

Urheberrecht:
Die durch den Seitenbetreiber erstellten Inhalte und Werke auf dieser Website
unterliegen dem schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung,
Verbreitung und jede Art der Verwertung ausserhalb der Grenzen des Urheberrechts
bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
```

### SEO (Impressum)
```html
<title>Impressum — DJ's Training-Fitness Studio Juratovic</title>
<meta name="description" content="Impressum von DJ's Training-Fitness Studio Juratovic, Rösslimattstrasse 2c, CH-5033 Buchs AG." />
<meta name="robots" content="noindex, follow" />
```

### AGB Page (German)

```
Heading: Allgemeine Geschäftsbedingungen (AGB)

Zuletzt aktualisiert: [Datum]

1. Geltungsbereich
Diese Allgemeinen Geschäftsbedingungen gelten für alle Dienstleistungen von
DJ's Training-Fitness Studio Juratovic, Rösslimattstrasse 2c, CH-5033 Buchs AG.

2. Terminvereinbarung und Absage
Trainingseinheiten müssen mindestens 24 Stunden vor dem vereinbarten Termin
abgesagt werden. Bei Absagen innerhalb von 24 Stunden oder Nichterscheinen wird
die volle Trainingsgebühr berechnet.

3. Gesundheitsfragebogen
Vor der ersten Trainingseinheit ist ein Gesundheitsfragebogen auszufüllen. Dieser
dient der Sicherheit und ermöglicht eine individuelle Trainingsplanung. Bei
gesundheitlichen Einschränkungen empfehlen wir eine vorgängige ärztliche
Abklärung.

4. Zahlungsbedingungen
Einzelstunden sind vor dem Training zu bezahlen. Abonnements (Abos) sind bei
Abschluss vollständig fällig. Bezahlung per Überweisung, Twint oder Bar.

5. Abonnements
Abonnements sind persönlich und nicht übertragbar. Sie sind ab Kaufdatum
12 Monate gültig. Eine Verlängerung oder Rückerstattung nach Ablauf ist
ausgeschlossen.

6. Saubere Schuhe
Im Studio sind saubere Hallenschuhe (Indoor-Schuhe) zu tragen. Strassenschuhe
sind im Trainingsbereich nicht erlaubt.

7. Haftung
DJ's Training-Fitness Studio Juratovic haftet nicht für Schäden oder
Verletzungen, die während des Trainings entstehen, sofern diese nicht auf grobe
Fahrlässigkeit oder Vorsatz zurückzuführen sind. Die Teilnahme am Training
erfolgt auf eigene Verantwortung.

8. Hausrecht
Die Trainerin behält sich das Hausrecht vor und kann Personen bei
unangemessenem Verhalten vom Training ausschliessen.

9. Änderungen
DJ's Training behält sich das Recht vor, diese AGB jederzeit zu ändern.
Die jeweils aktuelle Version ist auf dieser Website einsehbar.

10. Gerichtsstand
Gerichtsstand ist Aarau, Schweiz. Es gilt schweizerisches Recht.
```

### SEO (AGB)
```html
<title>AGB — Allgemeine Geschäftsbedingungen | DJ's Training</title>
<meta name="description" content="Allgemeine Geschäftsbedingungen von DJ's Training: Stornierung, Zahlungsbedingungen, Gesundheitsfragebogen und mehr." />
<meta name="robots" content="noindex, follow" />
```

### Datenschutz Page (German)

```
Heading: Datenschutzerklärung

Zuletzt aktualisiert: [Datum]

1. Allgemeines
Der Schutz deiner persönlichen Daten ist uns wichtig. Diese
Datenschutzerklärung informiert dich über die Art, den Umfang und den Zweck
der Erhebung und Verwendung personenbezogener Daten durch DJ's Training-Fitness
Studio Juratovic.

2. Verantwortliche Stelle
DJ's Training-Fitness Studio Juratovic
Diana Juratovic
Rösslimattstrasse 2c
CH-5033 Buchs AG
E-Mail: info@dj-training.com

3. Erhobene Daten
Wir erheben und verarbeiten folgende personenbezogene Daten:
- Name, E-Mail-Adresse, Telefonnummer (bei Kontaktaufnahme)
- Gesundheitsdaten (im Rahmen des Gesundheitsfragebogens)
- Nutzungsdaten (bei Registrierung auf der Website)
- Technische Daten (IP-Adresse, Browser, Zugriffszeit)

4. Zweck der Datenverarbeitung
Die erhobenen Daten werden ausschliesslich verwendet für:
- Bearbeitung von Anfragen und Terminvereinbarungen
- Durchführung und Planung des Trainings
- Kommunikation mit Kunden
- Verbesserung unserer Website und Dienstleistungen

5. Datenweitergabe
Personenbezogene Daten werden nicht an Dritte weitergegeben, es sei denn,
dies ist zur Vertragserfüllung erforderlich oder gesetzlich vorgeschrieben.

6. Datensicherheit
Wir treffen angemessene technische und organisatorische Massnahmen zum Schutz
deiner personenbezogenen Daten gegen unbefugten Zugriff, Verlust, Zerstörung
oder Veränderung.

7. Cookies
Diese Website verwendet technisch notwendige Cookies. Für Analyse- oder
Marketing-Cookies holen wir deine Einwilligung ein. Du kannst Cookies in
deinen Browsereinstellungen jederzeit deaktivieren.

8. Deine Rechte
Gemäss dem Bundesgesetz über den Datenschutz (DSG) hast du folgende Rechte:
- Recht auf Auskunft über deine gespeicherten Daten
- Recht auf Berichtigung unrichtiger Daten
- Recht auf Löschung deiner Daten
- Recht auf Einschränkung der Datenverarbeitung
- Recht auf Datenportabilität

Zur Ausübung deiner Rechte kontaktiere uns unter info@dj-training.com.

9. Änderungen
Wir behalten uns vor, diese Datenschutzerklärung jederzeit zu aktualisieren.
Die aktuelle Version ist auf dieser Website verfügbar.

10. Anwendbares Recht
Es gilt schweizerisches Recht, insbesondere das Bundesgesetz über den
Datenschutz (DSG).
```

### SEO (Datenschutz)
```html
<title>Datenschutz — Datenschutzerklärung | DJ's Training</title>
<meta name="description" content="Datenschutzerklärung von DJ's Training: Informationen zur Erhebung, Speicherung und Nutzung personenbezogener Daten." />
<meta name="robots" content="noindex, follow" />
```

## Edge Cases

- **Legal text updates:** Content must be easy to update when legal requirements change
- **Date formatting:** "Zuletzt aktualisiert" should use German date format (e.g., "15. Januar 2025")
- **Printing:** Legal pages should print cleanly for archival purposes
- **Deep linking:** Users should be able to link to specific sections (anchor links for numbered sections)
- **No JavaScript:** All legal text renders as static HTML
- **Screen readers:** Proper heading hierarchy (h1 > h2 for sections) for navigation
- **Long text scrolling:** Consider a sticky table of contents for the AGB and Datenschutz pages
- **Translation:** While content is in German only now, structure should allow for future translation
