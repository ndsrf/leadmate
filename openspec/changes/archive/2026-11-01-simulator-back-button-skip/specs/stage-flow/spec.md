# Spec Delta

## ADDED Requirements

### Requirement: On-screen back button in simulator
The system SHALL display an on-screen back button in the simulator overlay during active simulations, including walking Stages, close leash exercise Stages, and Daily walks. Tapping the on-screen back button SHALL pause the running simulation and display the Pause Menu with Resume and Exit actions.

#### Scenario: Tap back button during a Stage
- **WHEN** the user taps the on-screen back button while a Stage is running
- **THEN** the Stage pauses, no simulation time elapses, and the Pause Menu is displayed

#### Scenario: Tap back button during a Close Exercise
- **WHEN** the user taps the on-screen back button while a Close Exercise is running
- **THEN** the simulation pauses and the Pause Menu is displayed

#### Scenario: Tap back button during a Daily walk
- **WHEN** the user taps the on-screen back button during a Daily walk
- **THEN** the walk pauses and the Pause Menu is displayed

#### Scenario: Safe area positioning
- **WHEN** the simulation is displayed on devices with safe area insets
- **THEN** the on-screen back button is positioned clear of notch and top status bar obstructions

## MODIFIED Requirements

### Requirement: System back pauses the Stage
On platforms with a system back button, pressing it during a running Stage SHALL pause the Stage and show the Pause Menu with its Resume and Exit actions, and SHALL NOT leave the Stage or the app by itself. While the Pause Menu is shown, pressing system back SHALL act as Resume. Choosing Exit from the Pause Menu SHALL skip the simulation and advance to its completion/debrief screen.

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
- **WHEN** the user chooses Exit in the Pause Menu during a trail Node simulation (Stage or Close Exercise)
- **THEN** the simulation is skipped and the Node advances directly to its Debrief screen with completion credit

#### Scenario: Exit during Daily walk
- **WHEN** the user chooses Exit in the Pause Menu during a Daily walk
- **THEN** the walk simulation is skipped and the system advances directly to the Daily Results screen with completion credit

#### Scenario: Exit during first-stage onboarding
- **WHEN** the user chooses Exit in the Pause Menu during the first-stage onboarding simulation
- **THEN** the simulation is skipped and advances directly to the first-stage Debrief screen with completion credit

#### Scenario: Exit during warm-up
- **WHEN** the user chooses Exit in the Pause Menu during the warm-up Stage
- **THEN** the warm-up is completed and the app returns to the World Map

#### Scenario: Exit during taste
- **WHEN** the user chooses Exit in the Pause Menu during the onboarding taste
- **THEN** the taste simulation ends and the taste payoff screen is shown

#### Scenario: Back during an onboarding Stage
- **WHEN** the user presses system back during the onboarding taste or first Stage
- **THEN** the Stage pauses and the Pause Menu is shown

#### Scenario: Back while the Stage is loading
- **WHEN** the user presses system back while the Stage is still loading
- **THEN** the press is consumed and the app stays on the Stage

#### Scenario: Back when the Stage failed to load
- **WHEN** the Stage failed to load and its error is shown, and the user presses system back
- **THEN** the World Map is shown, except during the onboarding taste or first Stage, where the press is consumed
