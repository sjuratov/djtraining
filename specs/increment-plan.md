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

---

## Security Remediation Increments

Generated from `specs/assessment/security.md`. Ordered by priority tier (Tier 2 → 3 → 4).
No Tier 1 findings — no active exploits, no auth bypass, no RCE, no data exposure.

---

### Tier 2 — High Priority

---

## sec-001: Add OAuth `state` Parameter (CSRF Protection)

- **Type:** security
- **Tier:** 2 (High)
- **Vulnerability:** Google OAuth flow has no `state` parameter. Attacker can
  initiate OAuth flow and force-link their Google account to a victim's session
  (finding H1, OWASP A07).
- **Scope:** `src/api/src/routes/auth.ts` — Google OAuth redirect and callback
  handlers only. Generate random `state` token, store in a short-lived cookie
  before redirect, validate on callback. No other changes.
- **Acceptance Criteria:**
  - [ ] OAuth redirect includes a `state` parameter
  - [ ] Callback rejects requests with missing or mismatched `state`
  - [ ] `state` cookie is HttpOnly, short-lived (5 min), cleared after use
  - [ ] Normal Google login flow still works end-to-end
- **Test Strategy:**
  - Add test: callback without `state` returns 403/redirect to login with error
  - Add test: callback with invalid `state` returns 403/redirect to login with error
  - Add test: valid `state` flow completes login successfully
  - Run full auth regression suite (54 API + 110 e2e)
- **Gherkin Deltas:**
  - New: `Scenario: OAuth callback rejects missing state` — verifies CSRF protection
  - New: `Scenario: OAuth callback rejects invalid state` — verifies token mismatch caught
  - Regression: All existing auth tests must pass unchanged
- **Dependencies:** none
- **Rollback Plan:** Revert auth.ts OAuth handlers to previous implementation
- **Risk:** Low — isolated change to two route handlers

---

## sec-002: Add Rate Limiting on Auth Endpoints

- **Type:** security
- **Tier:** 2 (High)
- **Vulnerability:** Login, register, and OAuth endpoints have no rate limiting.
  Enables brute-force password attacks and credential stuffing (finding H2, OWASP A07).
- **Scope:** Install `express-rate-limit`. Add rate limit middleware to auth
  endpoints in `src/api/src/routes/auth.ts`. Login: 5 attempts/15 min per IP.
  Register: 3 attempts/hour per IP. OAuth: 10 attempts/15 min per IP. No other changes.
- **Acceptance Criteria:**
  - [ ] Login returns 429 after 5 failed attempts within 15 minutes
  - [ ] Register returns 429 after 3 attempts within 1 hour
  - [ ] Rate limit resets after window expires
  - [ ] Successful requests within limits still work
- **Test Strategy:**
  - Add test: 6th login attempt within window returns 429
  - Add test: 4th register attempt within window returns 429
  - Add test: requests succeed after window reset
  - Run full auth regression suite
- **Gherkin Deltas:**
  - New: `Scenario: Login is rate-limited after too many attempts` — verifies 429 response
  - New: `Scenario: Registration is rate-limited` — verifies 429 response
  - Regression: All existing auth tests must pass (may need rate limit bypass for test env)
- **Dependencies:** none
- **Rollback Plan:** Remove rate limit middleware, uninstall express-rate-limit
- **Risk:** Low — additive middleware. Test environment may need higher threshold to avoid flaky tests.

---

## sec-003: Harden Dev/Test Routes

- **Type:** security
- **Tier:** 2 (High)
- **Vulnerability:** `/api/test/reset`, `/api/test/create-user`, `/api/test/user-hash/:email`
  expose password hashes and allow arbitrary user creation. Only gated by
  `NODE_ENV !== 'production'` (finding H5, OWASP A05).
- **Scope:** `src/api/src/app.ts` test route section only. Add secondary
  safeguard: require `ENABLE_TEST_ROUTES=true` env var in addition to
  NODE_ENV check. Remove `/api/test/user-hash/:email` endpoint entirely.
- **Acceptance Criteria:**
  - [ ] Test routes only register when both `NODE_ENV !== 'production'` AND `ENABLE_TEST_ROUTES=true`
  - [ ] `/api/test/user-hash/:email` endpoint is removed
  - [ ] Existing tests still work (test env sets ENABLE_TEST_ROUTES)
  - [ ] Production deployment has no test routes
- **Test Strategy:**
  - Verify existing test suite passes with ENABLE_TEST_ROUTES=true in vitest/playwright config
  - Verify test routes return 404 when ENABLE_TEST_ROUTES is not set
- **Gherkin Deltas:**
  - Regression: All existing tests must pass with updated env configuration
- **Dependencies:** none
- **Rollback Plan:** Revert app.ts test route registration logic
- **Risk:** Medium — must coordinate env var across test configurations

---

## sec-004: Fix OAuth Redirect URI Construction

- **Type:** security
- **Tier:** 2 (High)
- **Vulnerability:** OAuth redirect URI is built from `req.protocol` + `req.get('host')`,
  which can be manipulated via Host header injection (finding L3, OWASP A07).
- **Scope:** `src/api/src/routes/auth.ts` — replace `req.protocol`/`req.get('host')`
  with `process.env.API_URL`. Add `API_URL` to `.env` and `.env.example`. No other changes.
- **Acceptance Criteria:**
  - [ ] OAuth redirect URI uses `API_URL` env var, not request headers
  - [ ] `API_URL` is documented in `.env.example`
  - [ ] Google OAuth flow still works end-to-end
- **Test Strategy:**
  - Add test: OAuth redirect URL matches API_URL regardless of Host header
  - Run existing OAuth e2e tests
- **Gherkin Deltas:**
  - Regression: Existing Google OAuth tests must pass unchanged
- **Dependencies:** none
- **Rollback Plan:** Revert to req-based URL construction
- **Risk:** Low — isolated string change

---

## sec-005: Add Confirmation Token Expiry

- **Type:** security
- **Tier:** 2 (High)
- **Vulnerability:** Email confirmation tokens have no expiry. A leaked or
  intercepted token remains valid indefinitely (finding M3, OWASP A07).
- **Scope:** `src/api/src/models/user-store.ts` — add `tokenExpiresAt: string | null`
  to User. Set to 24h in `createUser()`. Check expiry in verify endpoint. No other changes.
- **Acceptance Criteria:**
  - [ ] Confirmation tokens expire after 24 hours
  - [ ] Expired token returns 400 with "Token abgelaufen" error
  - [ ] Valid (non-expired) tokens still work
- **Test Strategy:**
  - Add test: token created >24h ago is rejected
  - Add test: token within expiry window works
  - Run existing auth registration tests
- **Gherkin Deltas:**
  - New: `Scenario: Expired confirmation token is rejected`
  - Regression: Existing registration + verification tests must pass
- **Dependencies:** none
- **Rollback Plan:** Remove tokenExpiresAt field and expiry check
- **Risk:** Low — additive field, only affects verify endpoint

---

## sec-006: Patch Vulnerable Dependencies

- **Type:** security
- **Tier:** 2 (High)
- **Vulnerability:** Multiple dependencies with CVSS ≥7.0 — `path-to-regexp` (ReDoS),
  `flatted` (prototype pollution), `picomatch` (ReDoS), `minimatch` (ReDoS)
  across API and Web workspaces (findings H3, H4, OWASP A06).
- **Scope:** Run `npm audit fix` in root, `src/api/`, and `src/web/`. Document
  any unfixable transitive deps. No application code changes.
- **Acceptance Criteria:**
  - [ ] `npm audit` shows 0 high-severity vulnerabilities (or remaining documented as unreachable)
  - [ ] All existing tests pass after dependency updates
  - [ ] Application builds successfully
- **Test Strategy:**
  - Run `npm audit` post-fix to verify findings cleared
  - Run full test suite (54 API + 110 e2e)
  - Verify both API and Web builds pass
- **Gherkin Deltas:**
  - Regression: All existing tests must pass unchanged
- **Dependencies:** none
- **Rollback Plan:** Revert `package-lock.json` files
- **Risk:** Medium — transitive dependency updates may introduce breaking changes

---

### Tier 3 — Medium Priority

---

## sec-007: Configure CORS Origin Allowlist

- **Type:** security
- **Tier:** 3 (Medium)
- **Vulnerability:** `cors()` with no options allows any origin (finding M1, OWASP A05).
- **Scope:** `src/api/src/app.ts` — configure `cors()` with `origin` from
  `APP_URL` env var, `credentials: true`. No other changes.
- **Acceptance Criteria:**
  - [ ] CORS only allows origin from APP_URL
  - [ ] Credentials (cookies) allowed for configured origin
  - [ ] Frontend-API communication still works
- **Test Strategy:**
  - Add test: wrong Origin header gets CORS rejection
  - Run existing e2e tests
- **Gherkin Deltas:**
  - New: `Scenario: CORS rejects requests from unknown origins`
  - Regression: All existing tests must pass
- **Dependencies:** none
- **Rollback Plan:** Revert cors() to default
- **Risk:** Low — must include dev/test origins in allowlist

---

## sec-008: Add Centralized Error Handler

- **Type:** security
- **Tier:** 3 (Medium)
- **Vulnerability:** No Express error middleware. Uncaught exceptions may
  expose stack traces (finding M4, OWASP A04).
- **Scope:** `src/api/src/app.ts` — add error middleware at end of chain.
  Log with pino, return generic 500. No other changes.
- **Acceptance Criteria:**
  - [ ] Uncaught route errors return 500 with generic message, no stack trace
  - [ ] Error logged server-side with full details
  - [ ] Existing 400/401/403/404 responses unchanged
- **Test Strategy:**
  - Add test: throw in route → 500 with generic message
  - Run full regression suite
- **Gherkin Deltas:**
  - New: `Scenario: Server error returns generic message`
  - Regression: All existing tests must pass
- **Dependencies:** none
- **Rollback Plan:** Remove error middleware
- **Risk:** Low — additive middleware

---

## sec-009: Fix Verification Token Logging

- **Type:** security
- **Tier:** 3 (Medium)
- **Vulnerability:** Email stub logs full verification URL with token.
  Exposed logs could enable account takeover (finding M2, OWASP A09).
- **Scope:** `src/api/src/services/email.ts` — use pino logger at `debug`
  level instead of console/info. No other changes.
- **Acceptance Criteria:**
  - [ ] Token URL logged at `debug` level only
  - [ ] Production log level (info) does not show token
  - [ ] Dev environment still shows token for testing
- **Test Strategy:**
  - Verify log output at info level omits token
  - Run existing auth tests
- **Gherkin Deltas:**
  - Regression: Existing registration tests must pass
- **Dependencies:** none
- **Rollback Plan:** Revert email.ts logging
- **Risk:** Low — logging change only

---

## sec-010: Validate Contact Form Input

- **Type:** security
- **Tier:** 3 (Medium)
- **Vulnerability:** No email format validation, no message length limit,
  no spam protection on contact endpoint (finding M6, OWASP A04).
- **Scope:** `src/api/src/routes/contact.ts` — add email regex, max message
  length (2000 chars), max name length (100 chars). No other changes.
- **Acceptance Criteria:**
  - [ ] Invalid email format returns 400
  - [ ] Message > 2000 chars returns 400
  - [ ] Valid submissions still succeed
- **Test Strategy:**
  - Add test: invalid email → 400
  - Add test: oversized message → 400
  - Run existing contact tests
- **Gherkin Deltas:**
  - New: `Scenario: Contact form rejects invalid email`
  - New: `Scenario: Contact form rejects oversized message`
  - Regression: Existing contact tests must pass
- **Dependencies:** none
- **Rollback Plan:** Revert contact.ts
- **Risk:** Low — additive validation

---

## sec-011: Configure Helmet Security Policies

- **Type:** security
- **Tier:** 3 (Medium)
- **Vulnerability:** Helmet uses defaults only. CSP, HSTS not tuned
  (finding L2, OWASP A05).
- **Scope:** `src/api/src/app.ts` — configure helmet with explicit CSP
  (allow self, Google Maps iframe, Tailwind styles), HSTS 1-year. No other changes.
- **Acceptance Criteria:**
  - [ ] CSP header restricts script-src to 'self'
  - [ ] HSTS has maxAge 31536000
  - [ ] Google Maps iframe still loads on /kontakt
  - [ ] Tailwind styles still work
- **Test Strategy:**
  - Add test: response headers include configured CSP, HSTS
  - Run e2e to verify pages render correctly
- **Gherkin Deltas:**
  - Regression: All page rendering tests must pass
- **Dependencies:** none
- **Rollback Plan:** Revert to default helmet()
- **Risk:** Medium — overly strict CSP can break rendering

---

### Tier 4 — Low Priority (Defense-in-Depth)

---

## sec-012: Add Authentication to Chat Endpoints

- **Type:** security
- **Tier:** 4 (Low)
- **Vulnerability:** Chat endpoints require no authentication (finding L1, OWASP A01).
- **Scope:** `src/api/src/routes/chat.ts` — add `authMiddleware` and rate
  limiting (10 msgs/min per user). No other changes.
- **Acceptance Criteria:**
  - [ ] Unauthenticated chat requests return 401
  - [ ] Authenticated users can use chat normally
  - [ ] Rate limited to 10 messages/minute
- **Test Strategy:**
  - Add test: unauthenticated → 401
  - Add test: authenticated → success
- **Gherkin Deltas:**
  - New: `Scenario: Unauthenticated user cannot access chat`
  - Regression: Chat functionality works for logged-in users
- **Dependencies:** sec-002 (rate limiting infrastructure)
- **Rollback Plan:** Remove auth middleware from chat routes
- **Risk:** Low — additive middleware

---

## sec-013: Document Auto-Confirm Stub Behavior

- **Type:** security
- **Tier:** 4 (Low)
- **Vulnerability:** Email stub auto-confirms users, bypassing verification.
  Undocumented dev-only behavior (finding M5, OWASP A07).
- **Scope:** `src/api/src/services/email.ts` — add NODE_ENV check: only
  auto-confirm in development. Add code comments. No other changes.
- **Acceptance Criteria:**
  - [ ] Production mode: users remain `pending` until email verified
  - [ ] Dev mode: existing auto-confirm preserved
  - [ ] Clear code comments mark behavior as dev-only
- **Test Strategy:**
  - Add test: NODE_ENV=production → user stays pending
  - Verify existing dev tests pass
- **Gherkin Deltas:**
  - New: `Scenario: Production registration requires email verification`
  - Regression: Existing registration tests pass in test env
- **Dependencies:** none
- **Rollback Plan:** Remove NODE_ENV check
- **Risk:** Low — conditional behavior based on environment
