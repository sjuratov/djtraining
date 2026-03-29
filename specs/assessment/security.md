# Security Assessment

## Summary
- **Assessment depth**: Level 3
- **Total findings**: 6
- **Critical: 0 | High: 2 | Medium: 2 | Low: 2**
- **OWASP categories affected**: A01, A04, A05, A06, A07, A09
- **Escalation triggered**: Yes — manual Level 2 auth/authz review found architectural access-control issues, so the assessment was extended to Level 3

## Findings

### Critical

No critical findings.

### High

| # | OWASP | Finding | Location | Remediation | Effort |
|---|-------|---------|----------|-------------|--------|
| H1 | A01, A04 | **First registered user becomes admin when `ADMIN_EMAIL` is not configured**. `createUser()` still grants admin rights when `users.size === 0`. On a fresh deployment or reset environment, the first public signup can seize admin access. | `src/api/src/models/user-store.ts:75-95` | Remove the first-user fallback for any shared or deployed environment. Require explicit admin bootstrap via seeded account, migration script, or invite flow. | Low |
| H2 | A01, A07 | **Authorization trusts stale JWT role claims**. `authMiddleware` verifies the token signature but does not reload the current user record. A user who was demoted after login keeps admin access until the JWT expires. Deleted users can also continue hitting protected routes that do not re-check user existence. | `src/api/src/middleware/auth.ts:26-49`, `src/api/src/routes/admin.ts:6-50`, `src/api/src/routes/profile.ts:82-124` | Load the current user on every authenticated request, reject missing/inactive users, and authorize against the current persisted role. Add token versioning or revocation if role changes must take effect immediately. | Medium |

### Medium

| # | OWASP | Finding | Location | Remediation | Effort |
|---|-------|---------|----------|-------------|--------|
| M1 | A06 | **Web app still uses vulnerable `next@16.1.6`**. `npm audit` reports multiple advisories affecting versions below `16.1.7`, with a fix available in `16.2.1`. | `src/web/package.json`, `src/web/package-lock.json` | Upgrade `next` and `eslint-config-next` to a patched release, then rebuild and rerun the full regression suite. | Low |
| M2 | A07 | **Email verification is not actually enforced for local signups**. The registration flow sends a verification email but then immediately activates the account, so the requirement “confirm via link before login” is currently bypassed for local auth. | `src/api/src/routes/auth.ts:87-94`, `src/api/src/services/email.ts:9-18` | Replace the stub with a real mail provider and remove the auto-activation path outside explicit local development mode. Add tests that prove unverified users cannot log in. | Medium |

### Low

| # | OWASP | Finding | Location | Remediation | Effort |
|---|-------|---------|----------|-------------|--------|
| L1 | A09 | **Verification URLs are still emitted to debug logs**. This is much better than info-level logging, but the token remains recoverable in environments that collect debug logs. | `src/api/src/services/email.ts:20-31` | Log only delivery metadata in shared environments, or gate token logging behind a dedicated local-only flag. | Low |
| L2 | A05 | **Test helper routes remain configuration-sensitive**. They now require `ENABLE_TEST_ROUTES=true` and non-production mode, which is a strong improvement, but exposure still depends on deployment discipline. | `src/api/src/app.ts:65-98` | Ensure all deployed environments pin `NODE_ENV=production` and never set `ENABLE_TEST_ROUTES`. Prefer excluding the routes entirely from production builds if possible. | Low |

## Positive Findings

| Area | Status | Details |
|------|--------|---------|
| OAuth CSRF protection | ✅ Fixed | Google OAuth now uses a random `state` cookie and validates it on callback |
| Auth rate limiting | ✅ Fixed | Login, registration, OAuth, and chat endpoints are rate-limited |
| Test route exposure | ✅ Improved | Test routes require explicit `ENABLE_TEST_ROUTES=true` and no longer expose password hashes |
| CORS policy | ✅ Fixed | API now uses an origin allowlist with credentialed requests |
| Error handling | ✅ Fixed | Generic centralized 500 handler prevents stack-trace leakage to clients |
| Confirmation token expiry | ✅ Fixed | Verification tokens expire after 24 hours |
| Contact validation | ✅ Fixed | Contact endpoint validates required fields, email format, and message length |
| Security headers | ✅ Improved | Helmet is configured with CSP and HSTS |
| Dependency posture (API/root) | ✅ Clean | `npm audit` returned 0 prod vulnerabilities for root and API packages |
| Secrets in git | ✅ Clean | `.env` is ignored, `client_secret_*.json` is ignored, and no hardcoded secrets were found in tracked files |
| Password storage | ✅ Strong | Passwords use bcrypt |
| Dynamic code execution | ✅ Clean | No `eval`/`exec` patterns found in the application code paths reviewed |

## OWASP Top 10 Coverage

| OWASP ID | Category | Findings | Status |
|----------|----------|----------|--------|
| A01 | Broken Access Control | H1, H2 | 🔴 Needs attention |
| A02 | Cryptographic Failures | — | ✅ No material issues found in this review |
| A03 | Injection | — | ✅ No SQL/XSS injection surface identified in reviewed code |
| A04 | Insecure Design | H1 | ⚠️ Design decision needs tightening |
| A05 | Security Misconfiguration | L2 | ⚠️ Configuration discipline still matters |
| A06 | Vulnerable and Outdated Components | M1 | ⚠️ One remaining dependency issue |
| A07 | Identification and Authentication Failures | H2, M2 | 🔴 Needs attention |
| A08 | Software and Data Integrity Failures | — | ✅ No material issues found in this review |
| A09 | Security Logging and Monitoring Failures | L1 | ⚠️ Low-risk log hygiene gap remains |
| A10 | Server-Side Request Forgery | — | ✅ No SSRF surface identified in reviewed code |

## Remediation Roadmap

Priority-ordered, smallest-change-first:

1. **Remove first-user admin bootstrap in deployed environments** (`H1`)
   - Dependency: none
   - Verification: fresh-environment test proving first public signup gets `user`, not `admin`

2. **Re-authorize from current user state instead of trusting JWT role claims** (`H2`)
   - Dependency: none
   - Verification: login as admin, demote account, confirm admin endpoints become forbidden without waiting for token expiry

3. **Upgrade Next.js to a patched release** (`M1`)
   - Dependency: none
   - Verification: `npm audit` for `src/web` returns 0 production vulnerabilities and full build/e2e remain green

4. **Enforce email verification before local login** (`M2`)
   - Dependency: real or environment-gated mail strategy
   - Verification: unverified local user cannot log in; verified user can

5. **Stop logging verification URLs outside explicit local development** (`L1`)
   - Dependency: aligns with item 4
   - Verification: production-like config emits no token-bearing logs

6. **Keep test routes impossible to enable in deployed environments** (`L2`)
   - Dependency: deployment config review
   - Verification: staging/production startup config excludes `ENABLE_TEST_ROUTES=true`

## Decision Points

| Decision | Options | Suggested ADR |
|----------|---------|---------------|
| Admin bootstrap strategy | Seeded admin account, invite-only promotion, or manual admin CLI | ADR: Admin Bootstrap Strategy |
| Authz source of truth | Trust JWT claims only, reload current user on every request, or add token-version revocation | ADR: Session Authorization Model |
| Production email verification | Resend, SMTP provider, or another transactional email service | ADR: Email Verification Delivery Strategy |
