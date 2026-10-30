# Spec Delta

## ADDED Requirements

### Requirement: System back pauses the Stage
On platforms with a system back button, pressing it during a running Stage SHALL pause the Stage and show the Pause Menu with its Resume and Exit actions, and SHALL NOT leave the Stage or the app by itself. While the Pause Menu is shown, pressing system back SHALL act as Resume.

#### Scenario: Back during a Node Stage
- **WHEN** the user presses system back while a Node's Stage is running
- **THEN** the Stage pauses, no Stage time elapses, and the Pause Menu with Resume and Exit is shown

#### Scenario: Back during the Daily Stage or warm-up
- **WHEN** the user presses system back during the Daily Stage or a warm-up Stage
- **THEN** the Stage pauses and the Pause Menu is shown

#### Scenario: Back again resumes
- **WHEN** the Pause Menu is shown and the user presses system back
- **THEN** the menu closes and the Stage resumes, the same as choosing Resume

#### Scenario: Exit from the menu
- **WHEN** the user chooses Exit in the Pause Menu opened by system back
- **THEN** the Stage is left the same way as Exit from any other pause, returning to the World Map

#### Scenario: Back during an onboarding Stage
- **WHEN** the user presses system back during the onboarding taste or first Stage
- **THEN** the Stage pauses and the Pause Menu is shown, and Exit there carries on with the Stage as it does today

#### Scenario: Back while the Stage is loading
- **WHEN** the user presses system back while the Stage is still loading
- **THEN** the press is consumed and the app stays on the Stage

#### Scenario: Back when the Stage failed to load
- **WHEN** the Stage failed to load and its error is shown, and the user presses system back
- **THEN** the World Map is shown, except during the onboarding taste or first Stage, where the press is consumed
