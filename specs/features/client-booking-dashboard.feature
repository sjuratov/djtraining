Feature: Client Booking Dashboard
  As described in frd-booking.md (client dashboard scope),
  authenticated clients can view their upcoming and past bookings,
  cancel or reschedule sessions, see a 24-hour cancellation warning,
  and view their active package balance on the Meine Termine page.

  @client-booking-dashboard @smoke
  Scenario: Client sees upcoming bookings on Meine Termine
    Given I am a logged-in client with a confirmed booking for tomorrow
    When I visit the "/meine-termine" page
    Then I should see the booking date, time, and training type
    And I should see a "Stornieren" button for the booking
    And I should see a "Umbuchen" button for the booking

  @client-booking-dashboard @smoke
  Scenario: Client sees completed bookings in a collapsible section
    Given I am a logged-in client with a completed booking
    When I visit the "/meine-termine" page
    Then the completed booking should not appear in the upcoming section
    And I should be able to view the completed booking details

  @client-booking-dashboard @smoke
  Scenario: Client cancels a future booking
    Given I am a logged-in client with a confirmed booking for next week
    When I visit the "/meine-termine" page
    And I click "Stornieren" on the booking
    And I confirm the cancellation in the modal
    Then I should see a success message "Termin erfolgreich storniert"
    And the booking should no longer appear in my upcoming bookings

  @client-booking-dashboard @edge-case
  Scenario: Client sees 24-hour warning when cancelling a booking within 24 hours
    Given I am a logged-in client with a confirmed booking starting within 24 hours
    When I visit the "/meine-termine" page
    And I click "Stornieren" on the booking
    Then I should see a warning about the 24-hour cancellation policy
    And I should still be able to confirm the cancellation

  @client-booking-dashboard
  Scenario: Client reschedules a booking via cancel and rebook
    Given I am a logged-in client with a confirmed booking for next week
    When I visit the "/meine-termine" page
    And I click "Umbuchen" on the booking
    Then the current booking should be cancelled
    And I should be redirected to the booking flow to select a new slot

  @client-booking-dashboard
  Scenario: Client sees package balance on Meine Termine
    Given I am a logged-in client with an active training package
    When I visit the "/meine-termine" page
    Then I should see my package name
    And I should see my remaining sessions out of total sessions

  @client-booking-dashboard
  Scenario: Client with no active package sees appropriate message
    Given I am a logged-in client with no active package
    When I visit the "/meine-termine" page
    Then I should see "Kein aktives Paket"

  @client-booking-dashboard
  Scenario: Navigation includes Meine Termine for authenticated users
    Given I am logged in as a regular user
    When I visit the homepage
    Then the navigation should include a "Meine Termine" link

  @client-booking-dashboard
  Scenario: Client with no bookings sees an empty state with booking CTA
    Given I am a logged-in client with no bookings
    When I visit the "/meine-termine" page
    Then I should see a message indicating no upcoming appointments
    And I should see a "Neuen Termin buchen" link to the booking flow

  @client-booking-dashboard @error
  Scenario: Unauthenticated user is redirected to login
    Given I am not logged in
    When I try to visit the "/meine-termine" page
    Then I should be redirected to the login page
