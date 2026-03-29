# Security Assessment

## Summary
- **Assessment depth**: Level 2 (auto-escalated from Level 1: >3 high-severity findings)
- **Total findings**: 14
- **Critical: 0 | High: 5 | Medium: 6 | Low: 3**
- **OWASP categories affected**: A01, A04, A05, A06, A07, A09
- **Escalation triggered**: Yes — 4 high-severity dependency CVEs + auth architectural gaps

## Findings

### Critical

No critical findings.

### High

| # | OWASP | Finding | Location | Remediation | Effort |
|---|-------|---------|----------|-------------|--------|
| H1 | A07 | **Google OAuth missing `state` parameter** — no CSRF protection on OAuth flow. Attacker can force-link their Google account to a victim's session. | `src/api/src/routes/auth.ts:98-108, 111-180` | Generate random `state` token, store in session/cookie before redirect, validate on callback. | Low |
| H2 | A07 | **No rate limiting on auth endpoints** — login/register/OAuth are unlimited. Enables brute-force password attacks and credential stuffing. | `src/api/src/routes/auth.ts` (all auth endpoints) | Add `express-rate-limit` middleware: 5 attempts/15 min for login, 3/hour for register. | Low |
| H3 | A06 | **Vulnerable dependencies (API)** — `path-to-regexp@8.x` (ReDoS), `flatted` (prototype pollution + DoS), `picomatch` (ReDoS), `rollup` (vuln), `minimatch` (ReDoS) | `src/api/package-lock.json` | Run `npm audit fix`. For unfixable: evaluate if vulnerable code paths are reachable. | Low |
| H4 | A06 | **Vulnerable dependencies (Web)** — `next@16.1.6` (moderate CVE), `flatted` (prototype pollution), `picomatch` (ReDoS), `minimatch` (ReDoS) | `src/web/package-lock.json` | Run `npm audit fix`. Update Next.js when patch available. | Low |
| H5 | A05 | **Dev/test endpoints expose sensitive data** — `/api/test/reset`, `/api/test/create-user`, `/api/test/user-hash/:email` return password hashes and allow arbitrary user creation. Gated by `NODE_ENV !== 'production'` but risky if misconfigured. | `src/api/src/app.ts:33-75` | Add secondary safeguard: check for explicit `ENABLE_TEST_ROUTES=true` env var. Ensure deployment configs set `NODE_ENV=production`. | Low |

### Medium

| # | OWASP | Finding | Location | Remediation | Effort |
|---|-------|---------|----------|-------------|--------|
| M1 | A05 | **CORS wide open** — `cors()` with no options allows any origin. | `src/api/src/app.ts:18-23` | Configure `origin` allowlist: `[process.env.APP_URL]` and `credentials: true`. | Low |
| M2 | A09 | **Verification token logged** — confirmation URL with token written to console via email stub. If logs are exposed/aggregated, tokens can be harvested. | `src/api/src/services/email.ts:14-20` | Remove token logging in production. Use structured log with level `debug` only. | Low |
| M3 | A07 | **Confirmation tokens have no expiry** — tokens remain valid indefinitely until used. | `src/api/src/models/user-store.ts` (no `tokenExpiresAt` field) | Add `tokenExpiresAt` field to User model. Set to 24h on creation. Check expiry on verify. | Low |
| M4 | A04 | **No centralized error handler** — uncaught exceptions fall to Express defaults, which may leak stack traces in non-production mode. | `src/api/src/app.ts` (no error middleware) | Add `app.use((err, req, res, next) => ...)` that logs error and returns generic 500. | Low |
| M5 | A07 | **Email verification auto-confirms** — registration stub immediately activates user, bypassing the verification flow. | `src/api/src/services/email.ts:19` (`activateUser` call) | Remove auto-activation when real email provider is connected. Document that stub behavior is dev-only. | Low |
| M6 | A04 | **Contact form: no input validation** — no email format check, no message length limit, no honeypot. Abuse vector for spam. | `src/api/src/routes/contact.ts:5-16` | Add email regex, max message length (2000 chars), optional honeypot field. | Low |

### Low

| # | OWASP | Finding | Location | Remediation | Effort |
|---|-------|---------|----------|-------------|--------|
| L1 | A01 | **Chat endpoints unauthenticated** — `/api/chat/sessions` and `/api/chat/sessions/:id/messages` require no auth. Any visitor can create sessions and send messages. | `src/api/src/routes/chat.ts:5-23` | Add `authMiddleware` if chat is user-specific. Add rate limiting either way. | Low |
| L2 | A05 | **Helmet uses defaults only** — CSP, HSTS, and frame-ancestor policies are not tuned for production. | `src/api/src/app.ts:18` | Configure `helmet({ contentSecurityPolicy: { directives: {...} }, hsts: { maxAge: 31536000 } })`. | Low |
| L3 | A07 | **OAuth redirect URI built from Host header** — `req.protocol` + `req.get('host')` used to construct Google OAuth redirect URI. Could be manipulated via Host header injection. | `src/api/src/routes/auth.ts:103-106` | Use `process.env.API_URL` or a fixed config value instead of request headers. | Low |

## Positive Findings (What's Done Well)

| Area | Status | Details |
|------|--------|---------|
| Password hashing | ✅ Strong | bcrypt with cost factor 10 |
| JWT expiry | ✅ Good | 24h expiration |
| Cookie security | ✅ Strong | `httpOnly`, `secure`, `sameSite: 'strict'` |
| Helmet enabled | ✅ Present | Default protections active |
| No SQL injection surface | ✅ Safe | In-memory Map store, no query construction |
| No XSS sinks | ✅ Safe | React rendering, no `dangerouslySetInnerHTML` |
| No eval/exec | ✅ Safe | No dynamic code execution in production |
| No hardcoded secrets | ✅ Clean | `.env` gitignored, only placeholders committed |
| No weak crypto | ✅ Safe | bcrypt for passwords, no MD5/SHA1 |
| No file uploads | ✅ N/A | No upload attack surface |

## OWASP Top 10 Coverage

| OWASP ID | Category | Findings | Status |
|----------|----------|----------|--------|
| A01 | Broken Access Control | L1 (chat unauthenticated) | ⚠️ Low risk |
| A02 | Cryptographic Failures | — | ✅ No issues |
| A03 | Injection | — | ✅ No SQL/XSS surface |
| A04 | Insecure Design | M4, M6 | ⚠️ Medium |
| A05 | Security Misconfiguration | H5, M1, L2 | 🔴 Needs attention |
| A06 | Vulnerable Components | H3, H4 | 🔴 Dependency updates needed |
| A07 | Auth Failures | H1, H2, M3, M5, L3 | 🔴 Primary concern |
| A08 | Integrity Failures | — | ✅ No issues |
| A09 | Logging & Monitoring | M2 | ⚠️ Token leakage in logs |
| A10 | SSRF | — | ✅ No issues |

## Remediation Roadmap

Priority-ordered. Items 1-3 should be fixed before any production deployment.

### Before Production (Must Fix)

1. **H1 — Add OAuth `state` parameter** — prevents login CSRF
2. **H2 — Add rate limiting** — prevents brute-force on auth
3. **H5 — Harden test routes** — add secondary safeguard beyond NODE_ENV
4. **M1 — Configure CORS origin allowlist** — prevent cross-origin abuse
5. **H3/H4 — Run `npm audit fix`** — patch vulnerable dependencies

### Before Public Launch (Should Fix)

6. **M4 — Add centralized error handler** — prevent info leakage
7. **M3 — Add confirmation token expiry** — limit token reuse window
8. **M6 — Validate contact form input** — prevent spam/abuse
9. **L3 — Use fixed API_URL for OAuth redirect** — prevent Host header manipulation
10. **L2 — Configure Helmet policies** — tighten CSP and HSTS

### Ongoing Maintenance

11. **M2 — Remove token logging** — when real email provider connected
12. **M5 — Remove auto-confirm** — when real email provider connected
13. **L1 — Decide on chat auth strategy** — auth-required vs rate-limited anonymous
14. **H3/H4 — Dependency monitoring** — set up automated dependency scanning

## Decision Points

| Decision | Options | Suggested ADR |
|----------|---------|---------------|
| Rate limiting strategy | In-memory vs Redis-backed vs API gateway | ADR: Rate Limiting Approach |
| Chat authentication | Require login vs anonymous with rate limits | ADR: Chat Access Control |
| Secrets management for production | Env vars vs Azure Key Vault vs managed identity | ADR: Production Secrets Strategy |
