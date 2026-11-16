# scent-drive Specification

## Purpose
Makes the Dog want what real dogs want on a walk: to reach and sniff interesting smells. Scent Spots in a scenario pull the Dog, more so on Autopilot, and some make it Plant or mark, so the Handler has to choose between granting a sniff and winning the Dog's attention back.

## Requirements

### Requirement: Scent Spots in a scenario
A scenario SHALL be able to declare Scent Spots, each with a position, a strength (weak, normal, hot) and a nose radius. A scenario that declares none SHALL behave exactly as before. Content validation SHALL reject a Scent Spot without a position or with an unknown strength.

#### Scenario: No scents
- **WHEN** a Stage runs whose scenario declares no Scent Spots
- **THEN** the Dog moves exactly as it did before this change, for the same seed and inputs

#### Scenario: Invalid spot
- **WHEN** content declares a Scent Spot with strength "strong"
- **THEN** content validation fails and names the spot and field

### Requirement: Scent pulls the Dog
While the Dog follows its Drive and an unsniffed Scent Spot is within its nose radius, the Dog SHALL drift toward that spot with a pull that grows with the spot's strength and with Autopilot, and SHALL reach the leash limit if the Handler does not follow or turn away.

#### Scenario: Weak scent nearby
- **WHEN** the Handler walks past a weak Scent Spot on a fresh walk
- **THEN** the Dog veers toward it but stays within Slack if the Handler keeps a normal pace

#### Scenario: Strong pull on autopilot
- **WHEN** Autopilot is high and the Dog passes a normal Scent Spot
- **THEN** the Dog heads for the spot and the leash becomes Taut unless the Handler follows or turns away

### Requirement: Autopilot
The simulation SHALL keep an Autopilot level from 0 to 1 that rises while the Handler keeps the same heading and pace with no stop, and drops when the Handler changes direction, pace or stops, by an amount set by that change's novelty (see `walk-novelty`).

#### Scenario: Straight steady walking
- **WHEN** the Handler walks straight at a steady pace for 10 seconds
- **THEN** Autopilot has risen and the Dog's scent pull is stronger than at the start

#### Scenario: Sudden stop
- **WHEN** the Handler stops suddenly after a straight stretch
- **THEN** Autopilot drops and the Dog's scent pull weakens

### Requirement: Plant at a hot Scent Spot
When the Dog reaches a hot Scent Spot it SHALL Plant: it stays at the spot, sniffing, for a set time, and does not move toward the Handler even if the leash goes Taut. Pulling during a Plant SHALL count as Rigid Pull and raise Arousal. Waiting with a Slack leash until it finishes, or a turn that the Dog follows, SHALL end the Plant without Rigid Pull.

#### Scenario: Handler waits
- **WHEN** the Dog Plants and the Handler stands still with the leash Slack or Taut
- **THEN** the Dog finishes sniffing and walks on, and a waited Plant is recorded

#### Scenario: Handler drags
- **WHEN** the Dog Plants and the Handler keeps walking into Rigid Pull
- **THEN** Arousal rises and a dragged Plant is recorded

### Requirement: Marking
At a Scent Spot marked as a marking post, the Dog SHALL stop and mark for a set time. Rigid Pull during marking SHALL raise Arousal and be recorded as an interrupted marking; waiting until it finishes SHALL be recorded as a waited marking.

#### Scenario: Waited marking
- **WHEN** the Dog marks a post and the Handler waits until it ends
- **THEN** a waited marking is recorded and the Dog walks on

### Requirement: Used-up scents
A Scent Spot the Dog has sniffed, by a Go Sniff at it or by a Plant at it, SHALL stop pulling the Dog for the rest of the Stage.

#### Scenario: After sniffing
- **WHEN** the Dog has had a Go Sniff at a spot
- **THEN** walking past that spot again does not pull the Dog

### Requirement: Forbidden smells need Leave-it
A stationary food Distractor in a scent Stage SHALL pull the Dog like a hot Scent Spot. Go Sniff while the Dog is at the food SHALL let the Dog eat it, recorded as food eaten. The Leave-it Cue SHALL work on it as it does today.

#### Scenario: Leave-it at the bin
- **WHEN** the Dog heads for food by a bin and the Handler gives Leave-it
- **THEN** the Dog turns away from the food as with any food Distractor and the food is not eaten

#### Scenario: Go Sniff on food
- **WHEN** the Dog is at the food and the Handler presses Go Sniff
- **THEN** the Dog eats the food and food eaten is recorded

### Requirement: Scent behaviour is repeatable
Scent pull, Autopilot, Plants, marking and sniffed spots SHALL depend only on the seed, the scenario and the inputs.

#### Scenario: Same seed
- **WHEN** two scent Stages run with the same seed and inputs
- **THEN** the Dog's path and every recorded scent result are identical
