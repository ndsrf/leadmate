# Spec Delta

## ADDED Requirements

### Requirement: Every shown sign is explained in the guided first Stage
Every sign, icon, meter, badge and control that the guided first Stage can show SHALL have an explanation: a Hint at the moment it first appears, a line in the Primer overview, or both. A sign held back because its action kind is not yet Introduced is exempt until it is Introduced. The set of signs SHALL be kept in one list in the code, and a test SHALL fail when the Stage can show a sign that is not on the list or a listed sign has neither a Hint nor an overview line.

#### Scenario: Sign with no explanation
- **WHEN** a sign the Stage can show is added without a Hint or an overview line
- **THEN** the coverage test fails

#### Scenario: Held back sign
- **WHEN** a sign belongs to an action kind that is not yet Introduced in the guided first Stage
- **THEN** it is neither drawn nor explained until it is Introduced

### Requirement: One-shot Hints for signs around the Dog
The first time a sign appears over or around the Dog in the guided first Stage (every Dog sign the guided first scenario can reach, such as the "!" of a Fixation and the eye when the Dog looks at the Handler, the Feedback Message icons and floating meter points, and the Approach ring), the system SHALL show a Hint that says what it means and what to do, once, and record it in `seenHints`. Hints SHALL NOT block input, SHALL take their text from the i18n catalog in Spanish and English, and SHALL NOT use the Dog's name unless the text needs it.

#### Scenario: Dog notices a distraction
- **WHEN** the Dog first fixates in the guided first Stage
- **THEN** one Hint explains the "!" and the ring together and says to stop and then tap Marker, and it is recorded as seen

#### Scenario: Unreachable Dog sign
- **WHEN** a Dog sign cannot occur in the guided first scenario for any seed from 1 to 8
- **THEN** it is exempt from explanation and listed as exempt

#### Scenario: Hint does not pause the Stage
- **WHEN** a Hint is shown
- **THEN** the simulation keeps running, and the Hint stays on screen for at least about 4 seconds unless its sign has gone

#### Scenario: Feedback icon
- **WHEN** a Feedback Message with an icon is first shown in the guided first Stage
- **THEN** its Hint says what the icon means, and the sound and haptic are unchanged

#### Scenario: Seen already
- **WHEN** a sign appears again, or the first Stage is replayed
- **THEN** its Hint is not shown again

### Requirement: Hints never overlap
At most one Hint SHALL be shown at a time in the guided first Stage. A Hint that becomes due while another is shown SHALL wait and show when the first ends, in a fixed order, and SHALL be dropped if the sign it explains is no longer on screen by then. The Hint for the first Fixation (the rhythm Hint, or the Marker Hint below Full assist) SHALL come before the approaching-dog warning.

#### Scenario: Two signs close together
- **WHEN** the Dog notices a distraction while the leash-colour Hint is shown
- **THEN** the new Hint waits and shows after the first one ends

#### Scenario: Sign gone before its turn
- **WHEN** a waiting Hint's sign is no longer on screen when its turn comes
- **THEN** the Hint is not shown and not recorded as seen

#### Scenario: Paused
- **WHEN** the Stage is paused while a Hint is shown or waiting
- **THEN** the Hint timer stops until the Stage resumes
