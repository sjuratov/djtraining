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

---

## Follow-up Security Remediation Increments

Generated from the post-remediation reassessment in `specs/assessment/security.md`.
Ordered by priority tier (Tier 2 → 3 → 4). No Tier 1 findings remain.

---

### Tier 2 — High Priority

---

## sec-014: Remove First-User Admin Bootstrap

- **Type:** security
- **Tier:** 2 (High)
- **Vulnerability:** The first registered user becomes admin when `ADMIN_EMAIL` is not configured. On a fresh shared or deployed environment, the first public signup can seize admin access (finding H1, OWASP A01/A04).
- **Scope:** `src/api/src/models/user-store.ts` only. Remove the `users.size === 0` bootstrap path for shared/deployed environments and require explicit admin bootstrap configuration. No unrelated user model changes.
- **Acceptance Criteria:**
  - [ ] First public signup no longer receives `admin` by default
  - [ ] Explicitly configured admin bootstrap path still works as designed
  - [ ] Existing non-admin registration/login flows still work unchanged
- **Test Strategy:**
  - Add reproduction test: fresh store + no `ADMIN_EMAIL` → first signup gets `user`
  - Add regression test: configured admin bootstrap still yields `admin`
  - Run full auth/admin regression suite
  - Re-run security assessment to confirm finding cleared
- **Gherkin Deltas:**
  - New: `Scenario: First public registration does not grant admin rights` — verifies default role is least privilege
  - Modified: `Scenario: Explicit admin bootstrap grants admin rights` — admin assignment must come from configuration, not registration order
  - Regression: Existing registration, login, and admin-access scenarios must still pass
- **Dependencies:** none
- **Rollback Plan:** Revert `createUser()` admin role bootstrap logic
- **Risk:** Low — isolated role-assignment logic

---

## sec-015: Re-authorize Requests from Current User State

- **Type:** security
- **Tier:** 2 (High)
- **Vulnerability:** Authorization trusts stale JWT role claims. A demoted or deleted user can retain privileged access until token expiry (finding H2, OWASP A01/A07).
- **Scope:** `src/api/src/middleware/auth.ts` and the smallest necessary route integrations only. Load the current user on each authenticated request, reject missing/inactive users, and authorize from current persisted role instead of stale token claims.
- **Acceptance Criteria:**
  - [ ] Demoted admin loses admin access immediately on the next request
  - [ ] Deleted users receive 401 on subsequent authenticated requests
  - [ ] Normal authenticated requests for unchanged users still succeed
- **Test Strategy:**
  - Add reproduction test: login as admin, demote, then admin endpoint returns 403 without waiting for JWT expiry
  - Add reproduction test: login, delete user, then authenticated endpoint returns 401
  - Run full auth/profile/admin regression suite
  - Re-run security assessment to confirm finding cleared
- **Gherkin Deltas:**
  - New: `Scenario: Demoted admin loses privileged access immediately` — verifies authz uses current role
  - New: `Scenario: Deleted account can no longer access protected routes` — verifies authenticated sessions are invalidated by current user lookup
  - Regression: Existing authenticated user flows must still pass for active users
- **Dependencies:** none
- **Rollback Plan:** Revert middleware to token-claims-only authorization
- **Risk:** Medium — touches core auth middleware and RBAC behavior

---

### Tier 3 — Medium Priority

---

## sec-016: Upgrade Next.js to Patched Release

- **Type:** security
- **Tier:** 3 (Medium)
- **Vulnerability:** `src/web` still uses `next@16.1.6`, which `npm audit` reports as vulnerable; a fix is available in a patched release (finding M1, OWASP A06).
- **Scope:** `src/web/package.json`, `src/web/package-lock.json`, and the minimum dependency alignment needed for `next` and `eslint-config-next`. No application feature work.
- **Acceptance Criteria:**
  - [ ] `next` and companion packages are updated to a patched release
  - [ ] `npm audit` for `src/web` reports 0 production vulnerabilities
  - [ ] Web build and full e2e suite remain green
- **Test Strategy:**
  - Run `npm audit` in `src/web` after upgrade
  - Run `npm run build` in `src/web`
  - Run full Playwright regression suite
  - Re-run security assessment to confirm dependency finding cleared
- **Gherkin Deltas:**
  - Regression: All existing web and e2e scenarios must pass unchanged
- **Dependencies:** none
- **Rollback Plan:** Revert `src/web/package.json` and `src/web/package-lock.json`
- **Risk:** Medium — framework patch could surface compatibility issues

---

## sec-017: Enforce Email Verification Before Local Login

- **Type:** security
- **Tier:** 3 (Medium)
- **Vulnerability:** Local registration sends a verification email but auto-activates the account, bypassing the intended verification gate before login (finding M2, OWASP A07).
- **Scope:** `src/api/src/routes/auth.ts`, `src/api/src/services/email.ts`, and the smallest required configuration path only. Remove auto-activation outside explicit local development mode and keep Google-authenticated users unaffected.
- **Acceptance Criteria:**
  - [ ] Newly registered local users remain `pending` until verification
  - [ ] Unverified local users cannot log in
  - [ ] Verified local users can log in successfully
  - [ ] Google OAuth users remain active without email confirmation
- **Test Strategy:**
  - Add reproduction test: local user registration does not activate account automatically
  - Add reproduction test: unverified local login returns 403
  - Add regression test: verified local user login succeeds
  - Run full auth regression suite
  - Re-run security assessment to confirm finding cleared
- **Gherkin Deltas:**
  - Modified: `Scenario: User registers with email and password` — Then step changes from immediate login eligibility to pending verification
  - New: `Scenario: Unverified local user cannot log in`
  - Regression: Existing Google OAuth scenarios must still pass unchanged
- **Dependencies:** none
- **Rollback Plan:** Restore auto-activation in local registration flow
- **Risk:** Medium — intentional behavior change in the core auth journey

---

### Tier 4 — Low Priority (Defense-in-Depth)

---

## sec-018: Remove Verification URLs from Shared Logs

- **Type:** security
- **Tier:** 4 (Low)
- **Vulnerability:** Verification URLs are still written to debug logs, which can expose tokens in environments that aggregate debug output (finding L1, OWASP A09).
- **Scope:** `src/api/src/services/email.ts` only. Stop logging token-bearing URLs outside explicit local-only diagnostics, and log delivery metadata instead.
- **Acceptance Criteria:**
  - [ ] Production-like/shared environments emit no verification tokens in logs
  - [ ] Local-only diagnostics can still support manual verification if explicitly enabled
  - [ ] Registration flow still functions
- **Test Strategy:**
  - Add test: production-like config emits no token-bearing log message
  - Add regression test: email service still builds verification URL for delivery
  - Run auth registration regression tests
  - Re-run security assessment to confirm finding cleared
- **Gherkin Deltas:**
  - Regression: Existing registration and verification scenarios must still pass unchanged
- **Dependencies:** sec-017
- **Rollback Plan:** Restore existing debug log behavior
- **Risk:** Low — logging-only change

---

## sec-019: Make Test Routes Impossible in Deployed Environments

- **Type:** security
- **Tier:** 4 (Low)
- **Vulnerability:** Test helper routes are still configuration-sensitive. They are improved, but exposure still depends on deployment discipline (finding L2, OWASP A05).
- **Scope:** Deployment/runtime configuration and the smallest necessary server guard in `src/api/src/app.ts`. Ensure deployed environments cannot accidentally expose test routes even if misconfigured.
- **Acceptance Criteria:**
  - [ ] Test routes remain available for local/test automation only
  - [ ] Production/staging startup path cannot enable test routes by accident
  - [ ] Existing test harness still works in explicit test mode
- **Test Strategy:**
  - Add test: production-like config never registers test routes
  - Add regression test: explicit test config still registers them for automation
  - Run full API and e2e regression suites
  - Re-run security assessment to confirm finding cleared
- **Gherkin Deltas:**
  - Regression: Existing automated test setup scenarios must still pass in test mode
- **Dependencies:** none
- **Rollback Plan:** Revert stricter test-route registration guard
- **Risk:** Low — configuration-focused hardening

---

# Extension: Booking & Scheduling System

## Overview

This extension adds database persistence, training schedule management, session booking, and package tracking to the DJ Training app. It transforms the platform from a marketing site with auth into a functional business operations tool.

**FRDs:** frd-database.md, frd-scheduling.md, frd-booking.md, frd-packages.md

**Dependency chain:**
```
ext-pre-001 (Database) 
    → ext-001 (Schedule & Groups)
        → ext-002 (Personal Booking)
            → ext-003 (Group Enrollment)
        → ext-004 (Packages)
            → ext-005 (Client Dashboard)
    → ext-006 (Admin Calendar)
```

---

## ext-pre-001: Database Persistence (SQLite Migration)

- **Type:** extension-prerequisite
- **FRD:** frd-database.md
- **Scope:** Replace in-memory `Map<string, User>` with SQLite using `better-sqlite3`. Create `users` and `member_profiles` tables. Implement migration system. All existing features work identically.
- **Acceptance Criteria:**
  - [ ] SQLite database created at `DATABASE_PATH` (default: `./data/djtraining.db`)
  - [ ] All `user-store.ts` functions backed by SQLite (same signatures)
  - [ ] User data persists across server restarts
  - [ ] Migration system runs on startup
  - [ ] `clearUsers()` truncates tables (test isolation)
  - [ ] Database file in `.gitignore`
  - [ ] All 69 API tests pass
  - [ ] All 111 e2e tests pass
- **Test Strategy:**
  - Unit tests for all user-store functions against SQLite
  - Migration tests (empty DB → tables created, idempotent re-run)
  - Regression: ALL existing API + e2e tests pass without modification
- **Gherkin Deltas:**
  - Regression: All existing auth, profile, and admin scenarios must still pass
  - No new user-facing behavior (transparent infrastructure change)
- **Integration Points:**
  - Replaces `src/api/src/models/user-store.ts` internals
  - No API or UI changes
- **Dependencies:** none
- **Rollback Plan:** Revert to in-memory store (git revert)
- **Risk:** Medium — touches every feature's data layer. Mitigated by keeping function signatures identical.

---

## ext-001: Schedule Templates & Training Types

- **Type:** extension
- **FRD:** frd-scheduling.md
- **Scope:** Admin CRUD for training types (Personal Training, Gruppentraining, etc.) and recurring weekly schedule templates. Slot generation engine produces bookable time slots from templates. Public API for available slots. Dynamic `/trainingszeiten` page.
- **Acceptance Criteria:**
  - [ ] Admin can create/edit/deactivate training types
  - [ ] Admin can create/edit/deactivate schedule templates (day, time, type)
  - [ ] System generates time slots for 4-week horizon
  - [ ] Admin can cancel or reschedule individual slots
  - [ ] `/trainingszeiten` renders from database
  - [ ] Public API returns available slots with filters
  - [ ] Non-admin cannot access admin endpoints
- **Test Strategy:**
  - Unit: training type CRUD, template CRUD, slot generation logic
  - API integration: admin endpoints auth/validation, public slot query
  - E2e: admin creates training type + template → public schedule page shows it
  - Regression: all existing tests pass
- **Gherkin Deltas:**
  - New: Admin creates training type, Admin creates schedule template, System generates slots
  - New: Public schedule page shows dynamic data
  - Modified: `/trainingszeiten` now database-driven (existing static content replaced)
  - Regression: all existing navigation, auth, admin scenarios pass
- **Integration Points:**
  - New tables: `training_types`, `schedule_templates`, `time_slots`
  - New routes: `/api/admin/training-types`, `/api/admin/schedule-templates`, `/api/schedule/slots`
  - Modified: `/trainingszeiten` page component
  - Extended: admin dashboard with schedule management section
- **Dependencies:** ext-pre-001
- **Rollback Plan:** Drop new tables, revert schedule page to static
- **Risk:** Medium — replaces static schedule page with dynamic. Existing e2e for schedule page will need updates.

---

## ext-002: Personal Training Booking

- **Type:** extension
- **FRD:** frd-booking.md (personal training scope)
- **Scope:** Walking skeleton for booking. Client browses available personal training slots, books a session, sees confirmation. Basic booking page + API. No group capacity logic yet, no packages.
- **Acceptance Criteria:**
  - [ ] Client can view available personal training slots
  - [ ] Client can book an available slot
  - [ ] Client cannot double-book the same slot
  - [ ] Client cannot book a full (capacity 1) slot
  - [ ] Client sees booking confirmation
  - [ ] Booking stored in database
  - [ ] Admin can view all bookings list
- **Test Strategy:**
  - Unit: booking creation, double-booking prevention, capacity check
  - API integration: POST /api/bookings, GET /api/bookings, admin GET
  - E2e: client browses slots → books → sees confirmation
  - Regression: all existing + ext-001 tests pass
- **Gherkin Deltas:**
  - New: Client books personal training, Client cannot double-book, Admin views bookings
  - Regression: all existing scenarios pass
- **Integration Points:**
  - New table: `bookings`
  - New routes: `/api/bookings`, `/api/admin/bookings`
  - New page: `/buchen` (booking flow)
  - Extended: user navigation with "Termin buchen" link
- **Dependencies:** ext-001
- **Rollback Plan:** Drop bookings table, remove booking routes and page
- **Risk:** Low — new feature with no modification of existing features

---

## ext-003: Group Training Enrollment

- **Type:** extension
- **FRD:** frd-booking.md (group training scope)
- **Scope:** Extend booking to support group training with multi-participant capacity. Clients can enroll in group sessions. Capacity tracking (available spots shown, slot becomes full at max).
- **Acceptance Criteria:**
  - [ ] Client can book group training slots
  - [ ] Available spots count shown per group slot
  - [ ] Slot status changes to 'full' at max capacity
  - [ ] Slot reopens on cancellation
  - [ ] Multiple clients can book the same group slot
  - [ ] Booking flow shows training type selector (personal vs group)
- **Test Strategy:**
  - Unit: capacity tracking, full-slot rejection, capacity release on cancel
  - API integration: concurrent booking race conditions (transaction safety)
  - E2e: multiple clients book same group slot → capacity decreases → full rejection
  - Regression: all personal booking tests still pass
- **Gherkin Deltas:**
  - New: Client books group training, Slot becomes full at capacity, Capacity released on cancel
  - Modified: Booking flow adds training type selection step
  - Regression: personal booking scenarios unchanged
- **Integration Points:**
  - Modified: booking routes to handle capacity > 1
  - Modified: `/buchen` page adds training type selector
  - Modified: slot availability API shows remaining capacity
- **Dependencies:** ext-002
- **Rollback Plan:** Revert capacity logic; personal booking still works
- **Risk:** Low — extends existing booking with capacity dimension

---

## ext-004: Training Packages

- **Type:** extension
- **FRD:** frd-packages.md
- **Scope:** Admin creates package definitions (matching current pricing), assigns packages to clients. Session auto-deducted on booking, credited back on cancellation. Client sees balance on profile.
- **Acceptance Criteria:**
  - [ ] Admin can create package definitions (name, type, sessions, price, validity)
  - [ ] Admin can assign package to client
  - [ ] Booking deducts 1 session from active package (FIFO by expiry)
  - [ ] Cancellation credits 1 session back
  - [ ] Client sees package balance on profile page
  - [ ] Booking without active package is allowed (pay-per-session)
  - [ ] Admin can manually adjust remaining sessions
  - [ ] Default packages seeded from current pricing
- **Test Strategy:**
  - Unit: package CRUD, deduction logic, FIFO selection, credit-back
  - API integration: admin package endpoints, client package view, booking+deduction atomicity
  - E2e: admin assigns package → client books → balance decreases → client cancels → balance increases
  - Regression: all booking tests still pass (with and without packages)
- **Gherkin Deltas:**
  - New: Admin creates package, Admin assigns package, Session deducted on booking, Balance shown on profile
  - Modified: Booking confirmation shows package balance
  - Regression: all booking scenarios pass (no-package path)
- **Integration Points:**
  - New tables: `package_definitions`, `client_packages`
  - New routes: `/api/admin/package-definitions`, `/api/admin/users/:id/packages`, `/api/packages`
  - Modified: booking creation logic (deduction hook)
  - Modified: profile page (package balance section)
  - Modified: admin user detail (package assignment)
- **Dependencies:** ext-002
- **Rollback Plan:** Remove deduction hook, drop package tables. Booking works without packages.
- **Risk:** Medium — modifies booking creation path. Use transactions for atomicity.

---

## ext-005: Client Booking Dashboard

- **Type:** extension
- **FRD:** frd-booking.md (client dashboard scope)
- **Scope:** "Meine Termine" page for clients. View upcoming/past bookings. Cancel with 24h soft warning. Reschedule flow (cancel + rebook).
- **Acceptance Criteria:**
  - [ ] Client sees upcoming bookings on `/meine-termine`
  - [ ] Client sees past bookings (collapsed)
  - [ ] Client can cancel a future booking
  - [ ] 24h warning shown for late cancellations (still allowed)
  - [ ] Client can reschedule to another available slot
  - [ ] Package balance shown if active package
  - [ ] Navigation includes "Meine Termine" for authenticated users
- **Test Strategy:**
  - Unit: cancellation logic, 24h warning threshold, reschedule validation
  - API integration: cancel + credit-back, reschedule atomicity
  - E2e: client books → views dashboard → cancels → sees updated list
  - Regression: all booking + package tests pass
- **Gherkin Deltas:**
  - New: Client views bookings, Client cancels booking, 24h cancellation warning, Client reschedules
  - Regression: all previous scenarios pass
- **Integration Points:**
  - New page: `/meine-termine`
  - Modified: user navigation (add "Meine Termine")
  - Modified: booking API (cancel, reschedule endpoints)
- **Dependencies:** ext-003, ext-004
- **Rollback Plan:** Remove page and nav link; booking API still works
- **Risk:** Low — new UI page with existing API data

---

## ext-006: Admin Calendar & Management

- **Type:** extension
- **FRD:** frd-booking.md (admin calendar scope), frd-scheduling.md (exception management)
- **Scope:** Full admin calendar view (monthly/weekly/daily) with complete CRUD. Color-coded by training type. Create ad-hoc slots, edit/reschedule via drag-and-drop or click, delete/cancel slots or date ranges. Manage bookings from calendar context. Book on behalf of clients. Multiple admins supported — any admin can manage the full calendar.
- **Acceptance Criteria:**
  - [ ] Admin calendar shows all time slots with booking counts (monthly/weekly/daily views)
  - [ ] Calendar is color-coded by training type
  - [ ] **Create:** Admin can create ad-hoc time slots directly on the calendar
  - [ ] **Read:** Admin can click any slot to see bookings, participant list, capacity
  - [ ] **Update:** Admin can reschedule slots (change date/time), edit slot details
  - [ ] **Delete:** Admin can cancel individual slots or bulk-cancel a date range (vacation)
  - [ ] Admin can book on behalf of a client from a slot context
  - [ ] Admin can mark bookings as completed or no-show
  - [ ] Admin can see at-a-glance package status per client
  - [ ] Multiple admins can use the calendar concurrently
- **Test Strategy:**
  - Unit: calendar data aggregation, bulk slot cancellation, ad-hoc slot creation
  - API integration: admin book-on-behalf, bulk cancel, status updates, CRUD slot endpoints
  - E2e: admin navigates calendar → creates slot → books client → reschedules → cancels
  - Regression: all previous tests pass
- **Gherkin Deltas:**
  - New: Admin views calendar, Admin creates slot from calendar, Admin edits slot, Admin bulk-cancels, Admin books for client, Admin marks no-show
  - Regression: all previous scenarios pass
- **Integration Points:**
  - New page: `/admin/kalender`
  - Extended: admin navigation
  - Modified: admin booking endpoints (book-on-behalf, status update, bulk cancel)
  - New: ad-hoc slot creation endpoint (POST /api/admin/time-slots)
- **Dependencies:** ext-005
- **Rollback Plan:** Remove calendar page; admin can still manage via list view
- **Risk:** Medium — calendar UI is complex. Consider a lightweight library (e.g., `@fullcalendar/react`).
