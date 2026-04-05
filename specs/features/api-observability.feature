Feature: API OpenTelemetry signals
  As described in frd-observability.md,
  this feature covers OTLP-based traces, metrics, and correlated logs
  for the DJ Training API without breaking normal request handling.

  @api-observability @smoke
  Scenario: API request emits correlated trace, metric, and log telemetry
    Given the DJ Training API telemetry is enabled
    And the API exports telemetry to the configured OTLP endpoint
    When a client sends a successful request to the API
    Then the API should emit a trace for that request
    And the API should emit request metrics for that request
    And the API logs for that request should include correlation data linking to the active trace or span

  @api-observability
  Scenario: API telemetry identifies the service as DJ Training API
    Given the DJ Training API telemetry is enabled
    When the API exports telemetry to the configured OTLP endpoint
    Then the exported telemetry should identify the service as "dj-training-api"
    And the exported telemetry should include environment-driven resource metadata for the API service

  @api-observability @edge-case
  Scenario: Auth and verification flows do not export sensitive data
    Given the DJ Training API telemetry is enabled
    When a client performs an authentication or verification flow
    Then the exported traces, metrics, and logs should not include passwords
    And the exported traces, metrics, and logs should not include verification tokens
    And the exported traces, metrics, and logs should not include session secrets or auth codes

  @api-observability @error
  Scenario: API remains available when the telemetry collector is unavailable
    Given the DJ Training API telemetry is enabled
    And the configured telemetry collector is unavailable
    When a client sends a request to the API
    Then the API should still serve the request normally
    And the API should surface a non-fatal telemetry export diagnostic
    And the API should not crash or block request handling because telemetry export failed

  @api-observability @error
  Scenario: Invalid telemetry exporter configuration is surfaced without blocking normal traffic
    Given the DJ Training API has invalid telemetry exporter configuration
    When the API starts
    Then the API should surface a clear telemetry configuration error
    And the API should remain reachable for normal application traffic
    And the API should not require source code changes to target a different OTLP endpoint later
