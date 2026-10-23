## ADDED Requirements

### Requirement: Diagnostic scene
The system SHALL draw the onboarding Diagnostic as one scene with vector art for the Dog in its breed and coat on a meadow, name the Dog's current state in a short caption, show progress as a row of paws, and take its input from a round Marker button. The Dog SHALL stand calm until the signal and then show ears up and a fixed gaze while the signal is on.

#### Scenario: Dog drawn in its breed and coat
- **WHEN** the Diagnostic opens for a Chocolate Teckel
- **THEN** the scene shows a Teckel silhouette in chocolate

#### Scenario: Cue and caption agree
- **WHEN** the signal turns on
- **THEN** the Dog changes to the looking posture and the caption names it, so the cue is not colour only

#### Scenario: Progress paws
- **WHEN** the user lands a valid response
- **THEN** one more paw in the progress row is filled and its label reads the count of filled paws out of the total

#### Scenario: Reduced motion
- **WHEN** the device asks for reduced motion
- **THEN** the posture change is immediate with no animation and the Diagnostic works the same
