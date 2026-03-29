Feature: Authentication
  As a visitor to the DJ Training website
  I want to register and log in
  So that I can access member features

  Scenario: Registration page displays form in German
    Given I am on the registration page
    Then I should see the heading "Konto erstellen"
    And I should see a username field
    And I should see a password field
    And I should see a "Registrieren" button

  Scenario: Login page displays form in German
    Given I am on the login page
    Then I should see the heading "Anmelden"
    And I should see a "Anmelden" button
    And I should see a link to registration

  Scenario: Navigation shows auth state
    Given I am logged in
    When I visit the homepage
    Then I should see my username in the navigation
    And I should see a "Abmelden" option
    And I should NOT see "Anmelden" link
