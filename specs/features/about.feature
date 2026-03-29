Feature: About Page (Über mich)

  As a visitor
  I want to read about Diana's background and qualifications
  So that I feel confident in her expertise as a personal trainer

  @about
  Scenario: Page displays biography
    Given I navigate to the "Über mich" page
    Then I should see the heading "Über mich"
    And I should see text about Diana being born in Croatia
    And I should see text about her fitness career starting in 2004 in England
    And I should see text about international experience
    And I should see text about her private studio in Buchs AG

  @about
  Scenario: Page displays professional qualifications
    Given I navigate to the "Über mich" page
    Then I should see the heading "Meine Qualifikationen"
    And I should see "Zertifizierte Personal Trainerin"
    And I should see "Ernährungscoach"
    And I should see "Pilates Trainerin"
    And I should see "HIIT Spezialistin"

  @about
  Scenario: Page displays studio information
    Given I navigate to the "Über mich" page
    Then I should see the heading "Mein Studio"
    And I should see text about "Rösslimattstrasse 2c"

  @about
  Scenario: Page displays photo or placeholder
    Given I navigate to the "Über mich" page
    Then I should see an image with alt text containing "Diana Juratovic"

  @about
  Scenario: Page has CTA to contact page
    Given I navigate to the "Über mich" page
    Then I should see a link to "/kontakt" with text "Kontakt aufnehmen"

  @about
  Scenario: Page is responsive
    Given I navigate to the "Über mich" page on a mobile device
    Then the page should render without horizontal overflow
