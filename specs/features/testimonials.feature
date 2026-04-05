Feature: Testimonials (Kundenstimmen)
  As a visitor to the DJ Training website
  I want to read testimonials from real clients
  So that I feel confident about the quality of training

  Scenario: Page displays heading and intro text
    Given I am on the testimonials page
    Then I should see the heading "Kundenstimmen"
    And I should see intro text about client experiences

  Scenario: All 18 testimonials are displayed
    Given I am on the testimonials page
    Then I should see exactly 18 testimonial cards

  Scenario: Each testimonial displays the client name
    Given I am on the testimonials page
    Then I should see testimonial from "Monika Huber"
    And I should see testimonial from "Andrea Gut"
    And I should see testimonial from "Marina Hunziker"
    And I should see testimonial from "Martina Lindörfer-Karnafelova"
    And I should see testimonial from "Vecaribica"
    And I should see testimonial from "Martina Stratmann"
    And I should see testimonial from "Michael Müller"
    And I should see testimonial from "Sabine Do-Thuong"
    And I should see testimonial from "Myophysio"
    And I should see testimonial from "F.S."
    And I should see testimonial from "Erika K."
    And I should see testimonial from "Sukey"
    And I should see testimonial from "Nicole Tellenbach"
    And I should see testimonial from "Regina Lanner"
    And I should see testimonial from "Stefanie"
    And I should see testimonial from "BR"
    And I should see testimonial from "Juliana"
    And I should see testimonial from "Paula Cruz"

  Scenario: Testimonials are in a responsive grid layout
    Given I am on the testimonials page
    Then testimonials should be displayed in a responsive grid
    And the grid should show 1 column on mobile
    And the grid should show 2 columns on tablet
    And the grid should show 3 columns on desktop

  Scenario: Feedback CTA section is present
    Given I am on the testimonials page
    Then I should see a feedback CTA section with heading "Deine Meinung zählt!"
    And I should see a "Feedback senden" link

  Scenario: SEO meta tags are present
    Given I am on the testimonials page
    Then the page title should contain "Kundenstimmen"
    And the meta description should mention "Bewertungen"
