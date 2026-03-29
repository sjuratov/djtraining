Feature: Admin Dashboard
  As an admin of DJ Training
  I want to manage registered users
  So that I can control access to the platform

  Scenario: Admin can view user list
    Given I am logged in as admin
    When I visit the admin page
    Then I should see the heading "Admin Dashboard"
    And I should see a table of users

  Scenario: Non-admin cannot access admin page
    Given I am logged in as a regular user
    When I visit the admin page
    Then I should see an access denied message
