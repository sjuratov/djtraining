Feature: Site Layout and Navigation
  As a visitor to the DJ Training website
  I want consistent navigation and footer on every page
  So that I can easily find and access all sections

  Scenario: Header displays brand name and navigation links
    Given I am on the homepage
    Then I should see "DJ's Training" in the header
    And I should see navigation links for "Home, Über mich, Angebot, Trainingszeiten, Kundenstimmen, Kontakt"

  Scenario: Footer displays business information
    Given I am on the homepage
    Then I should see "DJ's Training" in the footer
    And I should see "Rösslimattstrasse 2c" in the footer
    And I should see "CH-5033 Buchs AG" in the footer
    And I should see a phone link "+41 78 611 24 79" in the footer
    And I should see an email link "info@dj-training.com" in the footer

  Scenario: Footer contains legal links
    Given I am on the homepage
    Then I should see footer links to "Impressum, AGB, Datenschutz"

  Scenario: Navigation highlights active page
    Given I am on the homepage
    Then the "Home" navigation link should be highlighted

  Scenario: Mobile hamburger menu
    Given I am on the homepage on a mobile device
    Then I should see a hamburger menu icon
    When I tap the hamburger menu icon
    Then I should see all navigation links in the mobile menu
