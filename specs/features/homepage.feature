Feature: Homepage
  As a visitor to the DJ Training website
  I want to see an overview of the business
  So that I can understand what services are offered

  Scenario: Hero section displays tagline and CTA
    Given I am on the homepage
    Then I should see the tagline "Starte mit mir deine persönliche Reise zu mehr Gesundheit, Fitness & Wohlbefinden"
    And I should see a CTA button "Kostenloses Probetraining"

  Scenario: About teaser section
    Given I am on the homepage
    Then I should see an "Über mich" section
    And I should see text about Diana Juratovic
    And I should see a "Mehr erfahren" link to the about page

  Scenario: Service cards display three offerings
    Given I am on the homepage
    Then I should see exactly 3 service cards
    And I should see a "Personal Training" card linking to "/personal-training"
    And I should see a "Gruppentraining" card linking to "/gruppentraining"
    And I should see an "Ernährungscoaching" card linking to "/ernaehrungscoaching"

  Scenario: SEO meta tags are present
    Given I am on the homepage
    Then the page title should contain "DJ's Training"
    And the meta description should contain "Gesundheit" or "Fitness"
