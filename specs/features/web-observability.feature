Feature: Web OpenTelemetry signals
  As described in frd-observability.md,
  this feature covers OTLP-based traces, metrics, and structured logs
  for the DJ Training web application across server-rendered requests,
  selected client-side navigation, and downstream API calls.

  @web-observability @smoke
  Scenario: Web page load and navigation emit correlated telemetry
    Given the DJ Training web telemetry is enabled
    And the web app exports telemetry to the configured OTLP endpoint
    When a user loads the homepage and navigates to another page
    Then the web app should emit server-side traces for that journey
    And the web app should emit selected page or navigation metrics for that journey
    And the web logs for that journey should include correlation data where available

  @web-observability
  Scenario: Web telemetry identifies the service as DJ Training web
    Given the DJ Training web telemetry is enabled
    When the web app exports telemetry to the configured OTLP endpoint
    Then the exported web telemetry should identify the service as "dj-training-web"
    And the exported web telemetry should include environment-driven resource metadata for the web service

  @web-observability @smoke
  Scenario: End-to-end user journey links web telemetry to downstream API telemetry
    Given the DJ Training web telemetry is enabled
    And the DJ Training API telemetry is enabled
    When a user completes a web journey that calls the API
    Then the resulting telemetry should link the web request to the downstream API activity
    And the telemetry exporter configuration should remain environment-driven for both services

  @web-observability @edge-case
  Scenario: Browser telemetry transport limits do not break page behavior
    Given the DJ Training web telemetry is enabled
    And browser telemetry delivery is limited or unavailable
    When a user loads and navigates the site
    Then the page should still render normally
    And the user should still be able to interact with the site
    And the web app should skip unsupported browser telemetry cleanly

  @web-observability @error
  Scenario: Invalid or failing telemetry delivery does not block web rendering
    Given the DJ Training web telemetry is enabled
    And the web telemetry exporter configuration is invalid or unreachable
    When the web app handles a page request
    Then the page should still render successfully
    And the web app should surface a non-fatal telemetry diagnostic
    And the web app should not require hardcoded deployment-specific telemetry URLs in source files
