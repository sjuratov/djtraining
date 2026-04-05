Feature: Client Booking Month Calendar
  As described in frd-client-booking-calendar.md,
  the booking page shows a standard month calendar view
  so clients can navigate months and select dates naturally.

  @client-booking-calendar @smoke
  Scenario: Booking page shows a month calendar for date selection
    Given I am a logged-in client on the booking page
    When I select a training type
    Then I should see a month calendar view for the current month
    And the calendar should show day headers for the week
    And dates should show available slot counts where applicable

  @client-booking-calendar @smoke
  Scenario: Client navigates booking calendar by month
    Given I am a logged-in client on the booking page
    And I have selected a training type
    When I click the next month navigation button
    Then I should see the next month displayed
    When I click the previous month navigation button
    Then I should see the current month displayed again

  @client-booking-calendar
  Scenario: Client selects a date to see available time slots
    Given I am a logged-in client on the booking page
    And I have selected a training type
    When I click on a date in the month calendar
    Then I should see the available time slots for that date

  @client-booking-calendar
  Scenario: Training type selection persists across month navigation
    Given I am a logged-in client on the booking page
    And I have selected a training type
    When I navigate to the next month and back
    Then the selected training type should still be active

  @client-booking-calendar
  Scenario: Full booking flow through month calendar
    Given I am a logged-in client with an active package on the booking page
    When I select a training type
    And I select a date with available slots in the month calendar
    And I select an available time slot
    And I confirm the booking
    Then I should be redirected to Meine Termine with a success message

  @client-booking-calendar @edge-case
  Scenario: Month with no available slots shows empty state
    Given I am a logged-in client on the booking page
    And I have selected a training type
    When I navigate to a month with no available slots
    And I click on a date in that month
    Then I should see an empty state message for the slot list
