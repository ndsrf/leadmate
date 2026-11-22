# Spec Delta

## ADDED Requirements

### Requirement: Unpredictable walks lesson teaches reading Autopilot
The "Paseos impredecibles" Lesson (`theory-unpredictable-walks`) SHALL teach the user to read when the Dog is on Autopilot by watching for a wandering gaze in the Dog portrait and the drifting cloud Dog sign, and explaining how unexpected turns and stops break that routine. Its steps, do / don't comparison and illustrations SHALL instruct on these visual cues within the teaching pattern and depth limits.

#### Scenario: Autopilot cue explained
- **WHEN** the user reads `theory-unpredictable-walks`
- **THEN** it explicitly names the Dog portrait's wandering gaze and the drifting cloud sign as indicators that the Dog is on Autopilot

#### Scenario: Pattern and depth kept
- **WHEN** the content check runs on `theory-unpredictable-walks`
- **THEN** it passes: every teaching-pattern section is present, the body is 350 to 700 words, and there are at least two illustrations, three numbered steps and two takeaways
