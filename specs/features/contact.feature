Feature: Contact Page (Kontakt)

  As a visitor
  I want to find contact details and submit a message
  So that I can get in touch with DJ's Training

  @contact
  Scenario: Page displays contact information
    Given I navigate to the "Kontakt" page
    Then I should see the heading "Kontakt"
    And I should see the address "Rösslimattstrasse 2c"
    And I should see "CH-5033 Buchs AG"
    And I should see phone number "+41 78 611 24 79" as a clickable link
    And I should see email "info@dj-training.com" as a clickable link

  @contact
  Scenario: Page displays free trial CTA
    Given I navigate to the "Kontakt" page
    Then I should see "Kostenloses Probetraining"

  @contact
  Scenario: Contact form is displayed with all fields
    Given I navigate to the "Kontakt" page
    Then I should see a contact form with fields:
      | field     | type     | required |
      | Name      | text     | yes      |
      | E-Mail    | email    | yes      |
      | Telefon   | tel      | no       |
      | Nachricht | textarea | yes      |
    And I should see a "Nachricht senden" submit button

  @contact
  Scenario: Contact form validates required fields
    Given I navigate to the "Kontakt" page
    When I submit the contact form without filling in required fields
    Then I should see validation error messages

  @contact
  Scenario: Contact form submits successfully
    Given I navigate to the "Kontakt" page
    When I fill in the contact form with valid data
    And I submit the contact form
    Then I should see a success message

  @contact
  Scenario: Page displays map placeholder
    Given I navigate to the "Kontakt" page
    Then I should see a map section or placeholder
