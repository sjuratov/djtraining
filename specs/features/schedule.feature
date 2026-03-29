Feature: Training Schedule (Trainingszeiten)

  As a visitor
  I want to see the weekly training schedule
  So that I can plan when to train

  @schedule
  Scenario: Page displays Personal Training schedule
    Given I navigate to the "Trainingszeiten" page
    Then I should see the heading "Trainingszeiten"
    And I should see "Personal Training" schedule section
    And I should see Personal Training hours "9:00–12:00" and "16:00–21:00" for weekdays

  @schedule
  Scenario: Page displays Gruppentraining schedule
    Given I navigate to the "Trainingszeiten" page
    Then I should see "Gruppentraining" schedule section
    And I should see Gruppentraining on "Montag" at "18:00" and "19:15"
    And I should see Gruppentraining on "Donnerstag" at "18:00" and "19:15"

  @schedule
  Scenario: Weekend days shown as closed
    Given I navigate to the "Trainingszeiten" page
    Then I should see "Samstag" marked as "Geschlossen"
    And I should see "Sonntag" marked as "Geschlossen"

  @schedule
  Scenario: Page has CTA to contact page
    Given I navigate to the "Trainingszeiten" page
    Then I should see a link to "/kontakt" with text "Kontakt aufnehmen"
