# FRD-007: Contact Page (Kontakt)

**Status:** Draft
**PRD Section:** 3.1.7
**Priority:** P1

## Overview

The contact page provides all contact information for DJ's Training, a contact form for inquiries, a prominent free trial training CTA, and an embedded map showing the studio location. It is the primary conversion page for the website.

## User Stories

- As a visitor, I want to find the studio's contact details quickly so that I can call, email, or visit.
- As a visitor, I want to submit a contact form so that I can ask questions without leaving the website.
- As a visitor, I want to see the studio location on a map so that I know how to get there.
- As a visitor, I want to request a free trial training so that I can try the service before committing.
- As a visitor on mobile, I want to tap the phone number to call directly so that contacting is effortless.

## Acceptance Criteria

- [ ] Page is accessible at route /kontakt
- [ ] Page displays address: Rösslimattstrasse 2c, CH-5033 Buchs AG
- [ ] Page displays phone number: +41 78 611 24 79
- [ ] Phone number is a clickable tel: link
- [ ] Page displays email: info@dj-training.com
- [ ] Email is a clickable mailto: link
- [ ] Contact form is displayed with fields: Name, Email, Telefon, Nachricht
- [ ] Contact form validates required fields (Name, Email, Nachricht)
- [ ] Contact form validates email format
- [ ] Contact form displays success message after submission
- [ ] Contact form displays error message if submission fails
- [ ] "Kostenloses Probetraining" CTA is visually prominent
- [ ] Map embed shows the correct studio location (Rösslimattstrasse 2c, Buchs AG)
- [ ] Page is responsive and mobile-friendly
- [ ] Page has SEO meta tags in German

## UI/UX Requirements

### Page Layout (Desktop)
- Two-column layout:
  - Left: Contact form
  - Right: Contact info + map
- "Kostenloses Probetraining" banner at the top

### Page Layout (Mobile)
- Single column, stacked:
  1. "Kostenloses Probetraining" banner
  2. Contact info (address, phone, email)
  3. Contact form
  4. Map

### Free Trial CTA Section
- Full-width banner or highlighted card
- Heading: "Kostenloses Probetraining"
- Text: invitation to try a session for free
- CTA button or link to scroll to the contact form
- Accent background color for visual prominence

### Contact Form
- Fields:
  - Name (text input, required)
  - E-Mail (email input, required)
  - Telefon (tel input, optional)
  - Nachricht (textarea, required)
  - Subject dropdown or hidden field: "Probetraining / Allgemeine Anfrage"
- Submit button: "Nachricht senden"
- Validation: inline error messages in German
- Success state: green confirmation message
- Loading state: button disabled + spinner during submission

### Contact Info Section
- Structured with icons:
  - 📍 Address
  - 📞 Phone (clickable)
  - ✉️ Email (clickable)
- Clean, easy-to-scan layout

### Map Section
- Embedded Google Maps or OpenStreetMap
- Shows pin at Rösslimattstrasse 2c, CH-5033 Buchs AG
- Responsive: full-width, fixed height (~300px desktop, ~250px mobile)
- Lazy-loaded for performance

## API Requirements

### POST /api/contact
Submit a contact form message.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "phone": "string (optional)",
  "message": "string (required, min 10 chars)",
  "subject": "string (optional, default: 'Allgemeine Anfrage')"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Nachricht erfolgreich gesendet."
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Bitte gib eine gültige E-Mail-Adresse ein.",
    "message": "Die Nachricht muss mindestens 10 Zeichen lang sein."
  }
}
```

**Response (429 Too Many Requests):**
```json
{
  "error": "Zu viele Anfragen. Bitte versuche es später erneut."
}
```

**Backend behavior:**
- Validate input fields
- Send email notification to info@dj-training.com (or store in database)
- Rate limit: max 5 submissions per IP per hour
- Sanitize all input to prevent XSS/injection

## Content

### Page Title & SEO (German)
```html
<title>Kontakt — DJ's Training | Fitness Studio in Buchs AG</title>
<meta name="description" content="Kontaktiere DJ's Training in Buchs AG. Kostenloses Probetraining, Telefon +41 78 611 24 79, E-Mail info@dj-training.com." />
```

### Free Trial CTA (German)
```
Heading: Kostenloses Probetraining

Text: Du möchtest DJ's Training kennenlernen? Vereinbare jetzt dein
kostenloses und unverbindliches Probetraining! Egal ob Personal Training
oder Gruppentraining — die erste Stunde ist gratis.

Button: Probetraining anfragen (scrolls to contact form or pre-fills subject)
```

### Contact Info (German)
```
Heading: Kontakt

Adresse:
Rösslimattstrasse 2c
CH-5033 Buchs AG

Telefon: +41 78 611 24 79
E-Mail: info@dj-training.com

Öffnungszeiten:
Montag–Freitag: 9:00–12:00 & 16:00–21:00
Samstag & Sonntag: Geschlossen
```

### Contact Form Labels (German)
```
Form Heading: Schreib mir eine Nachricht

Fields:
- Name: "Dein Name" (placeholder: "Vor- und Nachname")
- E-Mail: "Deine E-Mail" (placeholder: "name@beispiel.ch")
- Telefon: "Telefon (optional)" (placeholder: "+41 XX XXX XX XX")
- Nachricht: "Deine Nachricht" (placeholder: "Wie kann ich dir helfen?")

Submit Button: "Nachricht senden"

Success Message: "Vielen Dank für deine Nachricht! Ich melde mich so schnell wie möglich bei dir."
Error Message: "Leider konnte die Nachricht nicht gesendet werden. Bitte versuche es erneut oder kontaktiere mich direkt per Telefon."
```

### Validation Messages (German)
```
Name required: "Bitte gib deinen Namen ein."
Email required: "Bitte gib deine E-Mail-Adresse ein."
Email invalid: "Bitte gib eine gültige E-Mail-Adresse ein."
Message required: "Bitte gib eine Nachricht ein."
Message too short: "Die Nachricht muss mindestens 10 Zeichen lang sein."
```

## Edge Cases

- **Form submission failure:** Display user-friendly error message with option to retry or contact via phone
- **Rate limiting:** If user hits rate limit, show message suggesting phone/email contact
- **Map loading failure:** Display static image of location or address text as fallback
- **GDPR/DSG compliance:** Include a checkbox or notice about data processing before form submission
- **Spam prevention:** Implement honeypot field or invisible reCAPTCHA to prevent spam submissions
- **Empty form submission:** All required fields must be validated before sending request
- **JavaScript disabled:** Contact info (address, phone, email) is still visible as static HTML; form may not function but fallback contact methods are available
- **Phone number format:** Accept various formats (+41786112479, 078 611 24 79, etc.)
- **Very long message:** Set max length (e.g., 2000 chars) with character counter
- **Map consent:** May need cookie/tracking consent before loading Google Maps (DSG compliance)
