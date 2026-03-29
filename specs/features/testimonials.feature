Feature: Testimonials (Kundenstimmen)
  As a visitor to the DJ Training website
  I want to read testimonials from real clients
  So that I feel confident about the quality of training

  Scenario: Page displays heading and intro text
    Given I am on the testimonials page
    Then I should see the heading "Kundenstimmen"
    And I should see intro text about client experiences

  Scenario: All 17 testimonials are displayed
    Given I am on the testimonials page
    Then I should see exactly 17 testimonial cards

  Scenario: Each testimonial displays the client name
    Given I am on the testimonials page
    Then I should see testimonial from "Sandra M."
    And I should see testimonial from "Thomas K."
    And I should see testimonial from "Monika W."
    And I should see testimonial from "Peter S."
    And I should see testimonial from "Claudia B."
    And I should see testimonial from "Marco R."
    And I should see testimonial from "Sabine L."
    And I should see testimonial from "Andreas H."
    And I should see testimonial from "Nicole F."
    And I should see testimonial from "Reto D."
    And I should see testimonial from "Karin P."
    And I should see testimonial from "Stefan G."
    And I should see testimonial from "Lisa M."
    And I should see testimonial from "Daniel V."
    And I should see testimonial from "Martina J."
    And I should see testimonial from "Urs B."
    And I should see testimonial from "Franziska E."

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
