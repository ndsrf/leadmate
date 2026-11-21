# Spec Delta

## ADDED Requirements

### Requirement: Read the Dog scene
The system SHALL draw the onboarding Diagnostic, and every Read the Dog round, as one scene with vector art for the Dog in its breed and coat on a meadow, the answer timer, the Combo counter and the score above it, and the three answer buttons (Calm, Alert, About to react) below it. The Dog SHALL show the current body-language signal, and its name SHALL appear in a short caption only once the signal has been answered or missed.

#### Scenario: Dog drawn in its breed and coat
- **WHEN** the Diagnostic opens for a Chocolate Teckel
- **THEN** the scene shows a Teckel silhouette in chocolate

#### Scenario: Caption after the answer
- **WHEN** a signal is showing and has not been answered
- **THEN** no caption names it; once it is answered or missed, the caption names it together with the Feedback Message

#### Scenario: Controls do not cover the Dog
- **WHEN** the scene is shown on a 320 by 640 point screen
- **THEN** the Dog, the timer, the Combo counter, the score and the three buttons are all visible without overlap

#### Scenario: Reduced motion
- **WHEN** the device asks for reduced motion
- **THEN** the posture change is immediate with no animation and the Diagnostic works the same

### Requirement: Read the Dog scene keeps the Dog clear
Feedback Messages SHALL be drawn in the band above the Dog and SHALL NOT cover it. Swipes SHALL be taken only on the scene, away from the screen edges used by System Back.

#### Scenario: Feedback above the Dog
- **WHEN** a Feedback Message is still fading as the next signal appears
- **THEN** the Dog and its new signal are fully visible

#### Scenario: Edge swipe
- **WHEN** the user swipes in from the very edge of the screen
- **THEN** no answer is given and the system back gesture behaves as on any other screen

### Requirement: Body-language signals on the breed Dog
The breed-and-coat Dog SHALL be drawn in each Read the Dog signal for every breed and coat, from body parts that differ per signal: body (level, front lowered, leaning forward), ears (relaxed, up, pinned back), eyes (soft, whites showing, fixed), mouth (open and soft, tongue flick, closed tight), tail (low, loose wag, high and stiff) and a raised ridge for hackles.

#### Scenario: Signals look different
- **WHEN** the Dog moves between any two Read the Dog signals
- **THEN** at least one of body, ears, eyes, mouth, tail or hackles differs

#### Scenario: Every breed
- **WHEN** a hackles up signal is drawn for each breed silhouette in each coat
- **THEN** the raised ridge along the back is visible on all of them

#### Scenario: Readable on the smallest breeds
- **WHEN** a subtle signal is drawn for the smallest breed on a 320-point-wide screen
- **THEN** the part that shows it (eye white, tongue, tight mouth or tail) is drawn large enough to see, enlarging the Dog for that breed if needed, and no signal is dropped for any breed

#### Scenario: Play bow
- **WHEN** the play bow signal is shown
- **THEN** the Dog's front is lowered with its rear up and its tail raised

#### Scenario: Still tail with reduced motion
- **WHEN** reduced motion is requested and the loose wag signal is shown
- **THEN** the tail is drawn as a still, mid-height curved tail and no wag animation plays

## REMOVED Requirements

### Requirement: Diagnostic scene
**Reason**: The onboarding Diagnostic is now a Read the Dog round; its Marker button, paw progress row and single "looking" signal no longer exist.
**Migration**: See "Read the Dog scene" and "Body-language signals on the breed Dog". The meadow, the Dog drawn in its breed and coat, and the immediate posture change under reduced motion are kept.
