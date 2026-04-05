Feature: Local Runtime Config Rebase
  As a developer working on DJ Training locally
  I want rebased shared runtime defaults for web, API, docs, and test tooling
  So that Aspire and standalone development use the same non-conflicting local contract

  @local-orchestration @smoke
  Scenario: Rebased local defaults expose the web and API on higher local ports
    Given the DJ Training app is using its default local runtime configuration
    When I run the web and API outside Aspire
    Then the web app should use "http://localhost:3101" as its default local URL
    And the API should use "http://localhost:5101" as its default local URL

  @local-orchestration
  Scenario: Local docs development no longer uses port 8000
    Given the DJ Training app is using its default local runtime configuration
    When I run the local docs server
    Then the docs server should use a local port higher than 8000
    And the docs server should not use port 8000

  @local-orchestration
  Scenario: Shared local URL settings stay aligned across runtime and test tooling
    Given the DJ Training app is using its default local runtime configuration
    When I inspect the local web, API, and test harness settings
    Then the web runtime should target "http://localhost:5101" for API requests
    And the API runtime should target "http://localhost:3101" as the local app URL
    And the local test harness should use the same rebased web and API URLs

  @local-orchestration
  Scenario: Explicit environment URLs override the rebased defaults
    Given the DJ Training app has explicit local environment values for app and API URLs
    When I start the affected runtime
    Then the explicit environment values should be used
    And the rebased defaults should not overwrite them

  @local-orchestration @edge-case
  Scenario: DJ Training can run on rebased ports while another local app keeps the old defaults
    Given another local application is already using the old default ports "3001" and "5001"
    When I start the DJ Training app with its rebased local defaults
    Then the DJ Training app should use "3101" and "5101" instead
    And existing DJ Training behavior should remain unchanged

  @local-orchestration @error
  Scenario: Missing local base URL wiring is surfaced before cross-service routing breaks
    Given the DJ Training app is missing required local base URL wiring
    When I start the affected runtime
    Then I should receive a clear configuration error
    And the app should not silently fall back to broken cross-service URLs

  @local-orchestration
  Scenario: Existing authenticated and booking flows remain reachable after the port rebase
    Given the DJ Training app is running with the rebased local defaults
    When a user opens the site, signs in, and visits the booking flow
    Then the user should still be able to reach the authenticated pages
    And the user should still be able to reach the booking flow
