Feature: Aspire local orchestration and OTLP endpoint
  As described in frd-local-orchestration.md and frd-observability.md,
  this feature covers running the DJ Training local stack through Aspire
  with healthy web and API endpoints plus a dedicated local OTLP endpoint.

  @local-orchestration @aspire @smoke
  Scenario: Developer runs the DJ Training stack with Aspire and receives healthy web and API endpoints
    Given the DJ Training Aspire app host is configured for local orchestration
    When I run the DJ Training stack with Aspire
    Then the web app should become healthy on "http://localhost:3101"
    And the API should become healthy on "http://localhost:5101"
    And the local docs server should be available on a higher non-conflicting local port

  @local-orchestration @aspire @smoke
  Scenario: Local OTLP endpoint is available for application telemetry
    Given the DJ Training stack is running with Aspire
    When I inspect the local telemetry resources
    Then a dedicated local OTLP endpoint should be available for telemetry export
    And the OTLP endpoint should use non-default local ports
    And the OTLP endpoint should be inspectable without editing source-controlled configuration files

  @local-orchestration @aspire
  Scenario: Aspire injects consistent base URL and telemetry exporter settings into the application services
    Given the DJ Training Aspire app host is configured for local orchestration
    When the web app and API start through Aspire
    Then the application services should receive consistent local app and API base URLs
    And the application services should receive environment-driven OTLP exporter settings
    And the application should not require hardcoded telemetry endpoints in source files

  @local-orchestration @aspire @edge-case
  Scenario: Standalone local development still works outside Aspire after OTLP orchestration is added
    Given the DJ Training app supports standalone local development
    When I run the web app or API directly without Aspire
    Then the application should still start with sane local defaults
    And the application should still work when the local telemetry collector is unavailable

  @local-orchestration @aspire @error
  Scenario: Missing OTLP endpoint wiring is surfaced without breaking application reachability
    Given the DJ Training stack has malformed or missing OTLP endpoint configuration
    When I start the affected service
    Then I should receive a clear telemetry configuration failure
    And the service should remain reachable for normal local development traffic
