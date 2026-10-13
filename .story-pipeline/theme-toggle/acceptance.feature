Feature: Theme toggle
  As a visitor of toyn.dev
  I want to switch between the light and the dark theme
  So that I can read the site in the theme I prefer, whatever my system setting

  # Assumptions (labelled, not asked):
  # A1. "Browser preferences" means the `prefers-color-scheme` media feature.
  # A2. Until the visitor toggles, the site keeps following the system, including a system change
  #     while the page is open. After a toggle, the stored choice wins on every later visit.
  # A3. The toggle flips the theme currently shown, whatever its source (system or stored choice).
  # A4. No "reset to system" control: not requested.
  # A5. "Between sessions" means across page loads and browser restarts, via localStorage on this
  #     origin. If storage is unavailable, the toggle still works for the current page.
  # A6. Printing always uses the light theme (existing rule), whatever the toggle says.

  Background:
    Given JavaScript is enabled

  Scenario Outline: On first visit, the theme matches the system preference
    Given I have never used the theme toggle
    And my system prefers the <system> color scheme
    When I open any page
    Then the page is shown in the <system> theme
    And the theme toggle "Dark theme" is <pressed>

    Examples:
      | system | pressed     |
      | light  | not pressed |
      | dark   | pressed     |

  Scenario Outline: The toggle switches to the other theme
    Given the page is shown in the <from> theme
    When I activate the theme toggle
    Then the page is shown in the <to> theme
    And the theme toggle "Dark theme" is <pressed>

    Examples:
      | from  | to    | pressed     |
      | light | dark  | pressed     |
      | dark  | light | not pressed |

  Scenario: The toggle works from the keyboard
    Given the page is shown in the light theme
    When I move focus to the theme toggle with the Tab key
    Then the toggle shows a visible focus ring
    When I press Enter
    Then the page is shown in the dark theme
    When I press Space
    Then the page is shown in the light theme

  Scenario Outline: The chosen theme is remembered on later visits
    Given my system prefers the <system> color scheme
    And I switched the theme to <chosen>
    When I close the browser and open the site again
    Then the page is shown in the <chosen> theme
    And the theme toggle "Dark theme" is <pressed>

    Examples:
      | system | chosen | pressed     |
      | light  | dark   | pressed     |
      | dark   | light  | not pressed |

  Scenario: The chosen theme applies on every page
    Given I switched the theme to dark on the home page
    When I follow a link to the résumé
    Then the résumé is shown in the dark theme

  Scenario: The remembered theme is applied before the page is first painted
    Given I switched the theme to dark
    When I reload the page
    Then the page is never painted in the light theme

  Scenario: A system change is followed until the visitor chooses
    Given I have never used the theme toggle
    And the page is shown in the light theme
    When my system switches to the dark color scheme
    Then the page is shown in the dark theme
    And the theme toggle "Dark theme" is pressed

  Scenario: The toggle still works when storage is unavailable
    Given the browser blocks site storage
    When I activate the theme toggle
    Then the page is shown in the other theme
    And no error is reported

  Scenario: Printing always uses the light theme
    Given I switched the theme to dark
    When I print the page
    Then the printout uses the light colours

  Scenario: Without JavaScript, the theme follows the system and no toggle is shown
    Given JavaScript is disabled
    And my system prefers the dark color scheme
    When I open any page
    Then the page is shown in the dark theme
    And no theme toggle is shown
