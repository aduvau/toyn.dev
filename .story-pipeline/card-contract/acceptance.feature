Feature: View contract on cards
  As a hiring manager looking at the "Selected work" cards
  I want to open the contract a card was built from
  So that I can see that the design system is real, not just claimed

  # Assumptions (labelled, not asked):
  # A1. The contract is new UI on the cards, not new content: the panel shows the Card contract's
  #     purpose, selectors, accessibility rules, contrast pairs and don'ts, generated from
  #     `src/system/contracts.ts`.
  # A2. Source files appear as plain paths (`src/system/contracts.ts`, `tests/system.test.ts`), not
  #     links. On 2026-10-13 Antoine removed the Codeberg source links from the writing, so the one
  #     link in the panel goes to the Card entry on `/system`.
  # A3. While a card's contract is open, only its title links to the case study, so the rest of the card
  #     (lines, labels, panel) can be read and selected without leaving the page.
  # A4. Each card opens and closes on its own. Opening one does not open the others.
  # A5. The labels are visual only. Screen readers get the same information from the panel's
  #     "Selectors" row, not from the drawn labels.
  # A6. The button keeps the name "View contract" in both states; its expanded state carries the rest.

  Background:
    Given I am on the home page

  Scenario: Every card has a closed contract button at its bottom right
    Then every work card ends with a "View contract" button
    And the button is collapsed
    And the button sits at the bottom right of its card, below the card's content

  Scenario: Opening the contract shows the panel generated from the Card contract
    When I activate "View contract" on the first card
    Then the button is expanded
    And a panel below the button shows the Card contract's purpose, selectors, accessibility, contrast and don't rules
    And the panel links to the Card entry on the design system page

  Scenario: Opening the contract draws construction lines on each part of the card
    When I activate "View contract" on the first card
    Then the cover, eyebrow, title, summary and impact of that card are each drawn with crossing corner lines
    And each part is labelled with its class name in a monospace label
    And the other cards show no construction lines

  Scenario: An open card holds still
    Given the first card's contract is open
    When I hover over the first card
    Then the card does not lift
    And its cover detail does not rise

  Scenario: Closing the contract removes the panel and the lines
    Given the first card's contract is open
    When I activate "View contract" on the first card again
    Then the button is collapsed
    And the panel is hidden
    And the card shows no construction lines

  Scenario: The button is keyboard operable
    When I move focus to the first card's "View contract" button with the Tab key
    Then the button shows a visible focus ring
    When I press Enter
    Then the button is expanded
    When I press Space
    Then the button is collapsed

  Scenario: The button does not follow the card link
    When I click "View contract" on the first card
    Then I am still on the home page

  Scenario: The panel's link goes to the Card contract on /system
    Given the first card's contract is open
    When I follow the panel's link
    Then I am on the design system page at the Card entry

  Scenario: Only the title links to the case study while the contract is open
    Given the first card's contract is open
    When I click the card's summary text
    Then I am still on the home page
    When I click the card's title
    Then I am on that case study

  Scenario: Works without JavaScript
    Given JavaScript is disabled
    When I activate "View contract" on the first card
    Then the panel and the construction lines are shown

  Scenario: Fits a phone screen
    Given the viewport is 390 pixels wide
    When I activate "View contract" on the first card
    Then the page does not scroll horizontally

  Scenario Outline: Readable in both themes
    Given the <theme> theme is shown
    When I open the first card's contract
    Then the labels, lines, button and panel text meet WCAG AA contrast

    Examples:
      | theme |
      | light |
      | dark  |
