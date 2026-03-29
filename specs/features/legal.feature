Feature: Legal Pages

  As a visitor
  I want to access legal information
  So that I know the business details, terms, and privacy policy

  # Impressum
  @legal @impressum
  Scenario: Impressum displays business information
    Given I navigate to the "Impressum" page
    Then I should see the heading "Impressum"
    And I should see "DJ's Training-Fitness Studio Juratovic"
    And I should see "Diana Juratovic"
    And I should see "Rösslimattstrasse 2c"
    And I should see "CH-5033 Buchs AG"
    And I should see "CH-400.1.035.771-0"
    And I should see phone "+41 78 611 24 79" as a clickable link
    And I should see email "info@dj-training.com" as a clickable link

  # AGB
  @legal @agb
  Scenario: AGB displays terms and conditions
    Given I navigate to the "AGB" page
    Then I should see the heading "Allgemeine Geschäftsbedingungen"
    And I should see "24 Stunden" cancellation policy
    And I should see "Gesundheitsfragebogen" requirement
    And I should see "saubere Hallenschuhe" requirement
    And I should see payment terms section
    And I should see liability section

  @legal @agb
  Scenario: AGB has numbered sections
    Given I navigate to the "AGB" page
    Then I should see section "1. Geltungsbereich"
    And I should see section "2. Terminvereinbarung und Absage"
    And I should see section "10. Gerichtsstand"

  # Datenschutz
  @legal @datenschutz
  Scenario: Datenschutz displays privacy policy
    Given I navigate to the "Datenschutz" page
    Then I should see the heading "Datenschutzerklärung"
    And I should see reference to "Datenschutz (DSG)"
    And I should see section about data collection
    And I should see section about cookies
    And I should see contact information for data requests "info@dj-training.com"

  @legal @datenschutz
  Scenario: Datenschutz describes user rights
    Given I navigate to the "Datenschutz" page
    Then I should see "Recht auf Auskunft"
    And I should see "Recht auf Berichtigung"
    And I should see "Recht auf Löschung"
