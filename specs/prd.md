# Product Requirements Document — DJ Training

## 1. Product Vision

Modernize the existing DJ's Training website (currently hosted on Wix at https://www.dj-training.com/) into a fast, modern, SEO-optimized Next.js web application backed by an Express.js API. The new application preserves all existing content and functionality while establishing a platform for future features such as online booking, client portals, and AI-assisted coaching.

**Business:** DJ's Training — Fitness Studio by Diana Juratovic
**Location:** Rösslimattstrasse 2c, CH-5033 Buchs AG, Switzerland
**Phone:** +41 78 611 24 79
**Email:** info@dj-training.com
**Commercial Register:** CH-400.1.035.771-0

---

## 2. Target Users

### 2.1 Visitor (Anonymous)

- **Who:** Prospective clients in the Buchs AG region searching for personal training, group fitness, or nutrition coaching.
- **Goal:** Learn about DJ's Training services, view pricing, read testimonials, and make contact.
- **Behavior:** Arrives via Google search or word-of-mouth link. Browses services, checks schedule, reads reviews, then contacts via phone/email or requests a free trial.

### 2.2 Registered Client

- **Who:** Existing or new clients who create an account on the platform.
- **Goal:** Manage their profile information (name, email, password).
- **Behavior:** Registers, logs in, views/edits profile. (Future: book sessions, view training history.)

### 2.3 Admin (Diana)

- **Who:** Business owner Diana Juratovic.
- **Goal:** Manage registered users via an admin dashboard.
- **Behavior:** Logs in with admin credentials, views user list, manages user accounts.

---

## 3. Feature Areas

### 3.1 Public Website

All public pages are server-rendered (SSR/SSG) for SEO. All text content is in German. The design should be modern, clean, and fitness-oriented.

#### 3.1.1 Layout & Navigation

**Description:** Consistent site-wide layout with header navigation, footer, and responsive mobile menu.

**Header Navigation Links:**
- Home (/)
- Über mich (/ueber-mich)
- Angebot (/angebot) — with sub-links:
  - Personal Training (/personal-training)
  - Gruppentraining (/gruppentraining)
  - Ernährungscoaching (/ernaehrungscoaching)
- Trainingszeiten (/trainingszeiten)
- Kundenstimmen (/kundenstimmen)
- Kontakt (/kontakt)

**Footer:**
- Business name, address, phone, email
- Links to: Impressum (/impressum), AGB (/agb), Datenschutz (/datenschutz)
- © DJ's Training

**Acceptance Criteria:**
- Navigation is visible on all public pages
- Mobile: hamburger menu collapses navigation into a slide-out or dropdown menu
- Active page is visually indicated in the navigation
- Footer is present on every page
- All links resolve to the correct pages

#### 3.1.2 Homepage

**Route:** `/`

**Description:** Landing page introducing DJ's Training with a hero section, about teaser, and service cards.

**Content Sections:**

1. **Hero Section:**
   - Tagline: "Starte mit mir deine persönliche Reise zu mehr Gesundheit, Fitness & Wohlbefinden"
   - Background image (fitness-themed)
   - CTA button linking to /kontakt ("Kostenloses Probetraining" or similar)

2. **Über mich Teaser:**
   - Short intro about Diana
   - Link to full /ueber-mich page

3. **Mein Angebot Section:**
   - 3 service cards in a row (responsive grid):
     - **Personal Training** — icon/image, short description, link to /personal-training
     - **Gruppentraining** — icon/image, short description, link to /gruppentraining
     - **Ernährungscoaching** — icon/image, short description, link to /ernaehrungscoaching

**Acceptance Criteria:**
- Hero section is full-width with tagline text overlay
- Service cards are clickable and link to respective detail pages
- Page loads in under 2 seconds (LCP)
- Responsive layout: cards stack vertically on mobile

#### 3.1.3 About Page (Über mich)

**Route:** `/ueber-mich`

**Description:** Biography of Diana Juratovic — personal trainer and studio owner.

**Content:**
- Profile photo of Diana
- Biography text covering:
  - Born in Croatia, married with 2 children
  - Started fitness career in 2004 in England
  - International experience across multiple countries
  - Certifications in fitness, nutrition, Pilates, HIIT, strength training
  - Owns a private studio in Buchs AG
- Professional qualifications list
- Studio photos (if available)

**Acceptance Criteria:**
- Page displays Diana's bio with photo
- Content is structured with clear headings
- Responsive: photo and text reflow on mobile

#### 3.1.4 Services Pages

##### 3.1.4a Services Overview (Angebot)

**Route:** `/angebot`

**Description:** Overview page linking to the three service categories.

**Content:**
- Brief intro text about the range of services offered
- 3 cards or sections linking to:
  - Personal Training (/personal-training)
  - Gruppentraining (/gruppentraining)
  - Ernährungscoaching (/ernaehrungscoaching)

**Acceptance Criteria:**
- All three service links are visible and functional
- Cards include a brief description and CTA

##### 3.1.4b Personal Training

**Route:** `/personal-training`

**Description:** Detailed page for personal training offerings with three sub-services and pricing.

**Content:**

**Individuelles Training (60 min):**

| Package | Price (CHF) |
|---------|-------------|
| Einzelstunde (single session) | 100 |
| 20er-Abo (20-pack) | 1,900 |
| 40er-Abo (40-pack) | 3,600 |

**HIIT Training (30 min):**

| Package | Price (CHF) |
|---------|-------------|
| Einzelstunde | 50 |
| 20er-Abo | 960 |
| 40er-Abo | 1,800 |

**Vibrationstraining (45 min):**

| Package | Price (CHF) |
|---------|-------------|
| Einzelstunde | 80 |
| 20er-Abo | 1,440 |
| 40er-Abo | 2,560 |

**Additional Notes:**
- Pair training available at higher rates (to be detailed per sub-service)
- Hours: Mon–Fri, 9:00–12:00 & 16:00–21:00

**Acceptance Criteria:**
- All three sub-services are displayed with pricing tables
- Prices are formatted with Swiss conventions (CHF currency)
- Pair training option is mentioned
- Link to /kontakt for booking/inquiries
- Link to /trainingszeiten for schedule details

##### 3.1.4c Group Training (Gruppentraining)

**Route:** `/gruppentraining`

**Description:** Group training details — small group sessions with max 5 participants.

**Content:**
- Session duration: 60 minutes
- Maximum participants: 5 persons per session
- Schedule:
  - Monday: 18:00 & 19:15
  - Thursday: 18:00 & 19:15

**Pricing:**

| Package | Price (CHF) |
|---------|-------------|
| Einzelstunde (single session) | 25 |
| 20er-Abo (20-pack) | 460 |
| 40er-Abo (40-pack) | 800 |

**Special Offer:** Free trial training ("Kostenloses Probetraining")

**Acceptance Criteria:**
- Schedule is clearly displayed (days + times)
- Pricing table is visible
- Free trial CTA is prominent
- Max group size (5) is stated

##### 3.1.4d Nutrition Coaching (Ernährungscoaching)

**Route:** `/ernaehrungscoaching`

**Description:** Nutrition coaching service with a holistic, non-diet approach.

**Content:**
- Free initial consultation: 60 minutes, no charge
- Holistic approach — no restrictive diets, focus on sustainable habits
- Follow-up session pricing:

| Package | Price (CHF) |
|---------|-------------|
| Einzelstunde (single session) | 100 |
| 5er-Abo (5 follow-ups) | 450 |
| 10er-Abo (10 follow-ups) | 900 |

**Acceptance Criteria:**
- Free initial consultation is prominently highlighted
- Holistic/non-diet philosophy is communicated
- Pricing table is visible
- CTA to book initial consultation (link to /kontakt)

#### 3.1.5 Training Schedule (Trainingszeiten)

**Route:** `/trainingszeiten`

**Description:** Complete weekly schedule for all training types.

**Content:**

**Personal Training:**
- Monday–Friday: 9:00–12:00, 16:00–21:00
- Saturday & Sunday: Closed

**Gruppentraining:**
- Monday: 18:00 & 19:15
- Thursday: 18:00 & 19:15

**Acceptance Criteria:**
- Schedule is displayed in a clear table or visual format
- Personal and group training schedules are distinct
- Weekend closure is explicitly stated
- Mobile-friendly layout

#### 3.1.6 Testimonials (Kundenstimmen)

**Route:** `/kundenstimmen`

**Description:** Client testimonials page featuring reviews from 17 named clients.

**Content:**
- 17 testimonials, each with:
  - Client name (first name or full name as provided)
  - Testimonial text (in German)
  - Optional: star rating or visual indicator
- Testimonials are sourced from the existing website

**Note:** The 17 testimonials should be stored as structured data (JSON or database) and rendered dynamically. Specific testimonial content to be extracted from the existing site during implementation.

**Acceptance Criteria:**
- All 17 testimonials are displayed
- Each testimonial shows the client's name
- Testimonials are presented in an attractive card or list layout
- Responsive grid: 1 column mobile, 2–3 columns desktop

#### 3.1.7 Contact Page (Kontakt)

**Route:** `/kontakt`

**Description:** Contact information, free trial CTA, and embedded Google Maps.

**Content:**
- **Address:** Rösslimattstrasse 2c, CH-5033 Buchs AG
- **Phone:** +41 78 611 24 79
- **Email:** info@dj-training.com
- **Free Trial CTA:** "Kostenloses Probetraining" — prominent call-to-action
- **Google Maps:** Embedded map showing studio location
- **Contact Form** (optional enhancement): Name, email, phone, message fields

**Acceptance Criteria:**
- All contact details (address, phone, email) are displayed
- Phone number is a clickable tel: link
- Email is a clickable mailto: link
- Google Maps embed shows the correct location
- Free trial CTA is visually prominent
- Responsive layout

#### 3.1.8 Legal Pages

Three legal/compliance pages required under Swiss law.

##### 3.1.8a Impressum

**Route:** `/impressum`

**Content:**
- Business name: DJ's Training-Fitness Studio Juratovic
- Owner: Diana Juratovic
- Address: Rösslimattstrasse 2c, CH-5033 Buchs AG
- Commercial Register Number: CH-400.1.035.771-0
- Phone and email

##### 3.1.8b Terms & Conditions (AGB)

**Route:** `/agb`

**Content (key policies):**
- 24-hour cancellation policy
- Health questionnaire required before first session
- Payment terms
- Liability disclaimers
- Full AGB text from existing website

##### 3.1.8c Privacy Policy (Datenschutz)

**Route:** `/datenschutz`

**Content:**
- Swiss Federal Data Protection Act (DSG) compliant
- Data collection, storage, and usage policies
- Cookie policy
- Contact information for data inquiries
- Full Datenschutz text from existing website

**Acceptance Criteria (all legal pages):**
- Content matches existing website legal text
- Pages are accessible from footer links
- Plain text layout, easy to read
- Last-updated date displayed

---

### 3.2 Authentication System

#### 3.2.1 Registration

**Description:** New users can create an account with email and password.

**Fields:**
- Name (required)
- Email (required, unique, validated format)
- Password (required, minimum 8 characters)
- Password confirmation

**Acceptance Criteria:**
- Registration form validates all fields before submission
- Duplicate email addresses are rejected with a clear error message
- Password strength requirements are enforced (min 8 characters)
- Successful registration redirects to login page with confirmation message
- Passwords are stored hashed (bcrypt)

#### 3.2.2 Login / Logout

**Description:** Registered users can log in with email and password, and log out.

**Acceptance Criteria:**
- Login form accepts email + password
- Invalid credentials show a generic error message (no information leakage)
- Successful login redirects to the homepage or previous page
- JWT token is issued and stored securely (httpOnly cookie or secure storage)
- Logout clears the session/token and redirects to homepage
- Protected routes redirect unauthenticated users to login

#### 3.2.3 Profile Management

**Description:** Logged-in users can view and edit their profile information.

**Fields:**
- Name (editable)
- Email (displayed, not editable — or editable with re-verification)
- Password change (current password + new password + confirmation)

**Acceptance Criteria:**
- Profile page is only accessible to authenticated users
- Users can update their name
- Password change requires current password verification
- Changes are saved and confirmed with a success message

---

### 3.3 Admin Dashboard

#### 3.3.1 User Management

**Description:** Admin users can view and manage all registered users.

**Acceptance Criteria:**
- Admin dashboard is only accessible to users with admin role
- User list displays all registered users (name, email, role, registration date)
- Admin can view user details
- Admin can change user roles (user ↔ admin)
- Admin can deactivate/delete user accounts
- Non-admin users attempting to access /admin are redirected with an error

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Largest Contentful Paint (LCP) < 2.5 seconds
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1
- Server-side rendering (SSR) or static generation (SSG) for all public pages
- Image optimization via next/image

### 4.2 Responsive Design
- Mobile-first design approach
- Breakpoints: mobile (<768px), tablet (768–1024px), desktop (>1024px)
- All pages fully functional on mobile devices
- Touch-friendly navigation and interactive elements

### 4.3 SEO
- Semantic HTML (proper heading hierarchy, landmarks)
- Meta tags (title, description) on every page — in German
- Open Graph tags for social sharing
- Sitemap.xml generation
- robots.txt configuration
- Structured data (LocalBusiness schema) for Google rich results

### 4.4 Accessibility
- WCAG 2.1 AA compliance target
- Keyboard navigation support
- Proper alt text on all images
- Sufficient color contrast ratios
- Screen reader-friendly markup

### 4.5 Internationalization (i18n)
- Primary language: German (de-CH)
- All UI text in German
- HTML lang attribute set to "de"
- Future-ready for English translation (but not in current scope)

### 4.6 Security
- HTTPS enforced
- JWT-based authentication with secure token handling
- Password hashing with bcrypt
- Input validation and sanitization on all forms
- CSRF protection
- Rate limiting on authentication endpoints
- Swiss DSG-compliant data handling

### 4.7 Infrastructure
- Hosted on Azure Container Apps (via Aspire orchestration)
- CI/CD via Azure Developer CLI (azd)
- Infrastructure as Code via Bicep templates
- Health check endpoints for monitoring

---

## 5. Out of Scope (Future Enhancements)

The following features are **not** included in the current release but are planned for future iterations:

- **AI Chat Assistant:** Conversational assistant for answering questions about services (scaffolding exists in codebase)
- **Online Booking System:** Calendar-based session booking with availability management
- **Payment Processing:** Online payment for training packages (Stripe/Twint integration)
- **CMS / Content Management:** Admin interface for editing page content, testimonials, pricing
- **Client Portal:** Training history, progress tracking, workout plans
- **Email Notifications:** Booking confirmations, reminders, newsletters
- **Blog / News Section:** Fitness tips, studio updates
- **Multi-language Support:** English translation of all content
- **Online Shop:** Merchandise or digital product sales

---

## 6. Content Source

All website content is sourced from the existing website at https://www.dj-training.com/.

- **Text Content:** All text is in German (de-CH). Content should be faithfully reproduced from the existing site.
- **Images:** To be referenced or downloaded from the existing Wix site. All images should be optimized for web delivery using next/image.
- **Testimonials:** 17 client testimonials with names — to be extracted from /kundenstimmen.
- **Legal Text:** Impressum, AGB, and Datenschutz text to be copied verbatim from the existing site.
- **Pricing:** All pricing data as documented in Section 3.1.4 above.
- **Schedule:** Training times as documented in Section 3.1.5 above.
- **Contact Details:** Address, phone, and email as listed in Section 1.

---

## 7. Traceability

This PRD drives the generation of Feature Requirement Documents (FRDs):

| FRD ID | Feature Area | PRD Section |
|--------|-------------|-------------|
| frd-layout | Layout & Navigation | 3.1.1 |
| frd-homepage | Homepage | 3.1.2 |
| frd-about | About Page | 3.1.3 |
| frd-services | Services Pages | 3.1.4 |
| frd-schedule | Training Schedule | 3.1.5 |
| frd-testimonials | Testimonials | 3.1.6 |
| frd-contact | Contact Page | 3.1.7 |
| frd-legal | Legal Pages | 3.1.8 |
| frd-auth | Authentication | 3.2 |
| frd-admin | Admin Dashboard | 3.3 |
