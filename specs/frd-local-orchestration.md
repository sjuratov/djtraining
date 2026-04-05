# FRD: Local Aspire Orchestration

## Overview

Add a reliable local Aspire-based orchestration flow for the DJ Training application so developers can run the web app, API, docs server, and a local OpenTelemetry endpoint together with `aspire run`, then stop the full stack cleanly with `Ctrl+C` when needed. The local stack must use explicit higher ports and inject consistent runtime URLs into every service without colliding with other Aspire apps already running on the same machine.

## User Stories

- As a **developer**, I want to run the local stack with Aspire and stop it with `Ctrl+C` so that web, API, docs, and telemetry infrastructure come up together without leaving background processes behind.
- As a **developer**, I want the local stack to use non-default higher ports so that it can run alongside other Aspire applications on my machine.
- As a **developer**, I want Aspire to inject the correct base URLs and OTLP endpoint into the running services so that local auth, API calls, and telemetry all work without manual rewiring.
- As a **future operator**, I want the OTLP exporter target to remain environment-driven so that the same app can later send telemetry to an Azure endpoint without code forks.

## Integration Points

- **Existing Aspire host (`apphost.cs`)** — currently starts API on `5001` and docs on `8000`; must be rebased to explicit higher ports and extended with a local OTLP collector/resource.
- **Existing API runtime (`src/api/src/index.ts`, `src/api/src/app.ts`, `src/api/src/routes/auth.ts`, `src/api/src/services/email.ts`)** — currently assumes `APP_URL`/`API_URL` defaults tied to `3001/5001`.
- **Existing web runtime (`src/web/next.config.ts`, `src/web/src/app/hooks/useChat.ts`, `src/web/src/app/kontakt/page.tsx`)** — currently assumes `NEXT_PUBLIC_API_URL` defaults tied to `5001`.
- **Existing test harness (`e2e/`, `tests/features/support/`)** — currently assumes `http://localhost:3001` and `http://localhost:5001` as the default local endpoints.
- **Existing local developer workflow** — standalone `npm run dev` and `npm run dev:api` must remain usable outside Aspire.

## Acceptance Criteria

### Aspire Runtime
- [ ] `aspire run` brings up the local web app, API, docs server, and OTLP endpoint together
- [ ] Stopping `aspire run` with `Ctrl+C` shuts down the local stack cleanly
- [ ] The local web app uses `http://localhost:3101`
- [ ] The local API uses `http://localhost:5101`
- [ ] The local docs server uses a non-conflicting higher port instead of `8000`
- [ ] The local OTLP collector endpoint uses dedicated non-default local ports so it can coexist with other Aspire-based apps

### Configuration Wiring
- [ ] Aspire injects consistent `APP_URL`, `API_URL`, and OTLP exporter environment values into the appropriate services
- [ ] Runtime defaults used by the app and test harness match the rebased local endpoints instead of `3001/5001`
- [ ] Standalone non-Aspire development still works when developers run the web or API directly
- [ ] No secrets are hardcoded into the Aspire host for telemetry export configuration

### Azure Readiness
- [ ] The OTLP exporter target remains environment-driven so a future Azure OTLP endpoint can replace the local collector without application code changes
- [ ] Service names and resource attributes are stable and explicit so local and future Azure telemetry can be distinguished cleanly

## Edge Cases

- **Another Aspire app is already running locally:** this app must still start cleanly because its web/API/docs/OTLP ports do not overlap the common defaults
- **Developer runs web or API without Aspire:** the application still starts with sane local defaults and does not require the collector to exist
- **Docs server is not needed during a specific session:** app and API orchestration still remain usable even if docs are excluded or fail separately
- **Local OTLP collector is unavailable:** application traffic still works; only telemetry delivery is degraded

## Error Handling

- Port already in use during Aspire startup → Aspire surfaces a clear startup failure pointing to the conflicting resource
- Missing or malformed OTLP endpoint configuration → telemetry setup fails visibly, but the application remains reachable for local development
- Missing base URL injection under Aspire → startup/config validation exposes the mismatch instead of silently falling back to broken cross-service URLs

## Non-Functional Requirements

- **Developer experience:** local full-stack startup should require one orchestration command and minimal manual environment editing
- **Reliability:** telemetry infrastructure must not block application request handling when unavailable
- **Security:** no secrets or Azure-specific credentials are committed; future exporter auth remains environment-based
- **Maintainability:** local endpoint defaults should be centralized so future port changes do not require editing many unrelated files
