Feature: Services Pages (Angebot)

  As a visitor
  I want to see the training services offered
  So that I can choose the right option and understand pricing

  # Services Overview
  @services
  Scenario: Overview page displays three service cards
    Given I navigate to the "Angebot" page
    Then I should see the heading "Mein Angebot"
    And I should see a card for "Personal Training" linking to "/personal-training"
    And I should see a card for "Gruppentraining" linking to "/gruppentraining"
    And I should see a card for "Ernährungscoaching" linking to "/ernaehrungscoaching"

  # Personal Training
  @services @personal-training
  Scenario: Personal Training page displays sub-services
    Given I navigate to the "Personal Training" page
    Then I should see the heading "Personal Training"
    And I should see "Individuelles Training"
    And I should see "HIIT Training"
    And I should see "Vibrationstraining"

  @services @personal-training
  Scenario: Personal Training shows correct pricing for Individuelles Training
    Given I navigate to the "Personal Training" page
    Then I should see Individuelles Training pricing:
      | Paket        | Preis     |
      | Einzelstunde | 100 CHF   |
      | 20er-Abo     | 1'900 CHF |
      | 40er-Abo     | 3'600 CHF |

  @services @personal-training
  Scenario: Personal Training shows correct pricing for HIIT Training
    Given I navigate to the "Personal Training" page
    Then I should see HIIT Training pricing:
      | Paket        | Preis     |
      | Einzelstunde | 50 CHF    |
      | 20er-Abo     | 960 CHF   |
      | 40er-Abo     | 1'800 CHF |

  @services @personal-training
  Scenario: Personal Training shows correct pricing for Vibrationstraining
    Given I navigate to the "Personal Training" page
    Then I should see Vibrationstraining pricing:
      | Paket        | Preis     |
      | Einzelstunde | 80 CHF    |
      | 20er-Abo     | 1'440 CHF |
      | 40er-Abo     | 2'560 CHF |

  @services @personal-training
  Scenario: Personal Training mentions pair training
    Given I navigate to the "Personal Training" page
    Then I should see text about "Paartraining"

  @services @personal-training
  Scenario: Personal Training shows training hours
    Given I navigate to the "Personal Training" page
    Then I should see "Montag bis Freitag"
    And I should see "9:00–12:00"
    And I should see "16:00–21:00"

  @services @personal-training
  Scenario: Personal Training has CTA to contact
    Given I navigate to the "Personal Training" page
    Then I should see a link to "/kontakt"

  # Gruppentraining
  @services @gruppentraining
  Scenario: Gruppentraining displays group details
    Given I navigate to the "Gruppentraining" page
    Then I should see the heading "Gruppentraining"
    And I should see "5 Personen"
    And I should see "60 Minuten"

  @services @gruppentraining
  Scenario: Gruppentraining shows correct schedule
    Given I navigate to the "Gruppentraining" page
    Then I should see "Montag" with times "18:00" and "19:15"
    And I should see "Donnerstag" with times "18:00" and "19:15"

  @services @gruppentraining
  Scenario: Gruppentraining shows correct pricing
    Given I navigate to the "Gruppentraining" page
    Then I should see group training pricing:
      | Paket        | Preis   |
      | Einzelstunde | 25 CHF  |
      | 20er-Abo     | 460 CHF |
      | 40er-Abo     | 800 CHF |

  @services @gruppentraining
  Scenario: Gruppentraining highlights free trial
    Given I navigate to the "Gruppentraining" page
    Then I should see "Kostenloses Probetraining"

  # Ernährungscoaching
  @services @ernaehrungscoaching
  Scenario: Ernährungscoaching displays free initial consultation
    Given I navigate to the "Ernährungscoaching" page
    Then I should see the heading "Ernährungscoaching"
    And I should see "kostenlos"
    And I should see "Erstgespräch"

  @services @ernaehrungscoaching
  Scenario: Ernährungscoaching shows correct pricing
    Given I navigate to the "Ernährungscoaching" page
    Then I should see coaching pricing:
      | Paket        | Preis   |
      | Einzelstunde | 100 CHF |
      | 5er-Abo      | 450 CHF |
      | 10er-Abo     | 900 CHF |

  @services @ernaehrungscoaching
  Scenario: Ernährungscoaching has CTA for initial consultation
    Given I navigate to the "Ernährungscoaching" page
    Then I should see a link to "/kontakt" for booking
