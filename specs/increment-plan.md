# Increment Plan

## Overview

This plan breaks the DJ Training project into 5 ordered increments. Each increment is a self-contained, deployable unit that goes through the full test → contract → implement → verify pipeline. The walking skeleton (Increment 1) is delivered first; subsequent increments build on it.

---

## Increment 1: Walking Skeleton (Layout + Homepage)

- **FRDs:** FRD-001, FRD-002
- **Scope:** Site-wide layout with header navigation, footer, responsive hamburger menu, and the homepage with hero section, about teaser, and 3 service cards.
- **Routes:** `/` (homepage)
- **Components:** Header, Footer, MobileMenu, HeroSection, ServiceCard, AboutTeaser
- **Complexity:** Medium
- **Dependencies:** None (first increment — establishes the structural foundation)
- **Acceptance:** Layout renders on all pages, navigation links work, homepage displays hero + service cards, responsive on mobile/tablet/desktop, SEO meta tags present.

---

## Increment 2: Content Pages

- **FRDs:** FRD-003, FRD-004, FRD-005, FRD-007, FRD-008
- **Scope:** About page (Über mich), Services pages (overview + 3 detail pages), Schedule page (Trainingszeiten), Contact page with form and map, and all 3 legal pages (Impressum, AGB, Datenschutz).
- **Routes:** `/ueber-mich`, `/angebot`, `/personal-training`, `/gruppentraining`, `/ernaehrungscoaching`, `/trainingszeiten`, `/kontakt`, `/impressum`, `/agb`, `/datenschutz`
- **Components:** AboutBio, QualificationsList, PricingTable, ScheduleTable, ContactForm, MapEmbed, LegalPage
- **API Endpoints:** `POST /api/contact` (contact form submission)
- **Complexity:** Medium
- **Dependencies:** Increment 1 (layout and navigation must exist)
- **Acceptance:** All content pages render with correct German content, pricing tables display correctly, contact form submits successfully, map embed loads, legal pages accessible from footer, all routes resolve correctly.

---

## Increment 3: Testimonials

- **FRDs:** FRD-006
- **Scope:** Testimonials page displaying all 17 client reviews in a responsive card grid with feedback submission CTA.
- **Routes:** `/kundenstimmen`
- **Components:** TestimonialCard, TestimonialGrid
- **Complexity:** Low
- **Dependencies:** Increment 1 (layout and navigation must exist)
- **Acceptance:** All 17 testimonials displayed with client names, responsive grid layout (1/2/3 columns), feedback CTA present.

---

## Increment 4: Authentication

- **FRDs:** FRD-009
- **Scope:** User registration, login/logout flows, profile page with name editing and password change. JWT-based auth with secure token handling. Navigation updates based on auth state.
- **Routes:** `/registrieren`, `/login`, `/profil`
- **API Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/profile`, `PUT /api/auth/password`
- **Components:** RegisterForm, LoginForm, ProfilePage, AuthProvider, ProtectedRoute
- **Complexity:** Medium
- **Dependencies:** Increment 1 (layout + navigation for auth state display)
- **Acceptance:** Registration creates account, login issues JWT, logout clears session, profile page shows/edits user info, protected routes redirect to login, navigation shows auth state.

---

## Increment 5: Admin Dashboard

- **FRDs:** FRD-010
- **Scope:** Admin-only dashboard with user management — view user list, change roles, activate/deactivate accounts. RBAC enforcement on both frontend and backend.
- **Routes:** `/admin`
- **API Endpoints:** `GET /api/admin/users`, `PUT /api/admin/users/:id/role`, `PUT /api/admin/users/:id/status`
- **Components:** AdminDashboard, UserTable, UserActions, ConfirmationModal
- **Complexity:** Low
- **Dependencies:** Increment 4 (authentication system must exist for RBAC)
- **Acceptance:** Admin can view all users, change roles, deactivate/reactivate accounts, non-admin users cannot access /admin, self-modification prevention works.
