# Spec Delta

## ADDED Requirements

### Requirement: System back button follows the screen's own back
On platforms with a system back button, pressing it SHALL do exactly what the current screen's own back or close action does, so it returns to the World Map or to the screen that opened the current one. The shell SHALL handle the press and SHALL NOT leave the app unless the World Map, or an onboarding step with no previous screen, is shown. Where the current screen has no back or close action, pressing system back SHALL do nothing.

#### Scenario: Back from the Diary
- **WHEN** the user opens the Diary from the Streak chip and presses system back
- **THEN** the World Map is shown at its previous scroll position and the app stays open

#### Scenario: Back from Library, Settings or Guaudoku
- **WHEN** the user presses system back on the Theory Library, Settings or the Daily Barkdoku board opened from the map
- **THEN** the World Map is shown

#### Scenario: Back to the opener
- **WHEN** the user opens a Lesson from the Theory Library and presses system back
- **THEN** the Theory Library is shown, and pressing system back again shows the World Map

#### Scenario: Back inside a Mission
- **WHEN** the user is on a Mission's problem picker reached from its check-in and presses system back
- **THEN** the check-in screen is shown, the same as its on-screen back

#### Scenario: Back from login opened in Settings
- **WHEN** the user opens log in from Settings and presses system back
- **THEN** Settings is shown again

#### Scenario: Back on the World Map
- **WHEN** the World Map is shown with no Diary, Library, Settings or other screen open over it, including while a lock note is showing, and the user presses system back
- **THEN** the platform default applies and the app is left on the first press

#### Scenario: Back on a Node Debrief
- **WHEN** the user presses system back on a Node Debrief
- **THEN** the same happens as choosing its Done action: the Mission brief opens after the last Node of a Stretch, otherwise the World Map is shown, and the result already recorded is kept

#### Scenario: Back on a result screen
- **WHEN** the user presses system back on the Daily Stage result or a Mission passed screen
- **THEN** the World Map is shown and the result already recorded is kept

#### Scenario: Back in a Minigame with no exit
- **WHEN** the user presses system back while playing the Doorbell, harness or Poste Minigame
- **THEN** system back is consumed and the Minigame continues

#### Scenario: Back in Barkdoku
- **WHEN** the user presses system back on a Node's Barkdoku or the Daily Barkdoku board
- **THEN** the same happens as its on-screen exit, and the World Map is shown

#### Scenario: Back in the onboarding first Stage's Checkpoint or Debrief
- **WHEN** the user presses system back on the onboarding first Stage's Checkpoint or Debrief
- **THEN** system back is consumed and the screen stays

#### Scenario: Back on the taste payoff
- **WHEN** the payoff after the onboarding taste Stage is shown and the user presses system back
- **THEN** system back is consumed and the payoff stays

#### Scenario: Back while choosing a Dog
- **WHEN** the Choose Dog screen is shown after sign-in and the user presses system back
- **THEN** system back is consumed and the choice stays on screen

#### Scenario: Back on a timed Checkpoint
- **WHEN** the user presses system back on a Node's timed Checkpoint question
- **THEN** system back is consumed and the question stays on screen
