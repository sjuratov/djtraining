# FRD: Application Observability

## Overview

Enable vendor-neutral OpenTelemetry traces, metrics, and logs for both the API and web application so developers can inspect end-to-end behavior locally under Aspire and later redirect the same telemetry pipeline to an Azure OTLP endpoint. Observability must improve debugging and operations without breaking request handling when telemetry infrastructure is unavailable.

## User Stories

- As a **developer**, I want to trace a user journey across the web app and API so that I can diagnose failures and latency quickly.
- As a **developer**, I want request metrics and application health metrics so that I can spot slowdowns or spikes while testing locally.
- As a **developer**, I want structured logs correlated with traces so that I can move from an error log to the exact failing request path.
- As a **future operator**, I want telemetry export to stay OTLP-based and environment-driven so that local Aspire and future Azure deployments use the same application instrumentation model.

## Integration Points

- **Local orchestration (`frd-local-orchestration.md`)** — supplies the local OTLP endpoint and environment wiring required by this feature.
- **Existing API logging (`src/api/src/logger.ts`, `src/api/src/app.ts`)** — must be extended so API logs are structured and correlated with trace/span context.
- **Existing API routes and services** — inbound HTTP handling, downstream calls, and background work need instrumentation coverage without changing business behavior.
- **Existing web runtime (Next.js App Router)** — needs telemetry for server-rendered requests, API proxy/fetch behavior, and selected client-side navigation/page metrics.
- **Existing tests and local tooling** — regression suites must continue to run even when telemetry is enabled.

## Acceptance Criteria

### API Signals
- [ ] API exports OpenTelemetry traces for inbound HTTP requests
- [ ] API exports request/error/latency metrics suitable for local inspection
- [ ] API emits structured logs with trace or span correlation identifiers when telemetry is enabled
- [ ] API resource metadata clearly identifies the service as DJ Training API

### Web Signals
- [ ] Web exports traces for server-side request handling and relevant app-router work
- [ ] Web exports meaningful page/navigation or rendering metrics suitable for local inspection
- [ ] Web emits structured logs for server-side web runtime activity, with correlated context where available
- [ ] Web resource metadata clearly identifies the service as DJ Training web

### End-to-End Telemetry Behavior
- [ ] A local user flow produces related telemetry across both web and API services
- [ ] Telemetry exporter configuration is environment-driven and works with the local Aspire OTLP endpoint
- [ ] The same exporter configuration model can later target an Azure OTLP endpoint without changing instrumentation code
- [ ] Telemetry enablement does not require developers to hardcode deployment-specific URLs in source files

## Edge Cases

- **Collector temporarily unavailable:** requests still succeed; telemetry may be dropped or retried without breaking user flows
- **Client-side network limits or blockers:** web pages still function even if some browser telemetry cannot be delivered
- **Auth and verification flows:** telemetry must not leak verification tokens, auth codes, secrets, or session material into logs or span attributes
- **Mixed local modes:** instrumentation behaves sensibly whether the app runs under Aspire or with standalone dev commands

## Error Handling

- Invalid exporter configuration → surface a clear configuration error for telemetry setup without crashing normal application traffic
- Telemetry export timeout/failure → emit non-fatal diagnostics and continue serving requests
- Unsupported or missing client-side telemetry transport → skip that signal cleanly while preserving the rest of the app

## Non-Functional Requirements

- **Performance:** telemetry overhead must stay low enough that local development and normal request handling remain responsive
- **Security & privacy:** sensitive request data, auth credentials, and verification tokens must not be exported as logs or span attributes
- **Reliability:** telemetry must fail open; application behavior remains primary
- **Portability:** instrumentation must stay vendor-neutral OTLP so Azure adoption later is configuration-driven rather than rewrite-driven
