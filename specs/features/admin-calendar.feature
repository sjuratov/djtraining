Feature: Admin Calendar & Management
  As described in frd-booking.md (admin calendar scope),
  admins can view all time slots and bookings in a calendar view,
  create ad-hoc slots, manage bookings (cancel, reschedule, mark status),
  book on behalf of clients, and bulk-cancel date ranges.

  @admin-calendar @smoke
  Scenario: Admin sees calendar with time slots and booking counts
    Given I am logged in as admin
    And time slots exist for the current week
    When I visit the admin calendar page
    Then I should see a calendar view with time slots
    And each slot should show the booking count and capacity

  @admin-calendar
  Scenario: Admin calendar is color-coded by training type
    Given I am logged in as admin
    And slots of different training types exist
    When I visit the admin calendar page
    Then slots should be visually distinguished by training type

  @admin-calendar @smoke
  Scenario: Admin creates an ad-hoc time slot from the calendar
    Given I am logged in as admin
    When I visit the admin calendar page
    And I create a new ad-hoc time slot for next week
    Then the new slot should appear on the calendar

  @admin-calendar
  Scenario: Admin views slot details with participant list
    Given I am logged in as admin
    And a slot exists with a confirmed booking
    When I visit the admin calendar page
    And I click on the slot with a booking
    Then I should see the participant list for that slot
    And I should see the capacity status

  @admin-calendar
  Scenario: Admin cancels a time slot
    Given I am logged in as admin
    And a future time slot exists
    When I visit the admin calendar page
    And I cancel the time slot
    Then the slot should show as cancelled on the calendar

  @admin-calendar
  Scenario: Admin bulk-cancels slots for a date range
    Given I am logged in as admin
    And multiple future slots exist
    When I visit the admin calendar page
    And I bulk-cancel slots for a date range
    Then all slots in that range should be cancelled

  @admin-calendar
  Scenario: Admin books on behalf of a client
    Given I am logged in as admin
    And a client user exists
    And an available time slot exists
    When I visit the admin calendar page
    And I book the slot on behalf of the client
    Then the booking should appear in the slot details

  @admin-calendar
  Scenario: Admin marks a booking as completed or no-show
    Given I am logged in as admin
    And a slot exists with a confirmed booking
    When I visit the admin calendar page
    And I click on the slot with a booking
    And I mark the booking as "completed"
    Then the booking status should update to "completed"

  @admin-calendar @error
  Scenario: Non-admin user cannot access the admin calendar
    Given I am logged in as a regular user
    When I try to visit the admin calendar page
    Then I should see an access denied message
