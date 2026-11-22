# Spec Delta

## MODIFIED Requirements

### Requirement: Scent walk actions answer back
In a scent Stage the system SHALL also show a Feedback Message for these actions. Right: a granted sniff, a waited Plant, a waited marking, a fresh move followed by the Dog, a Chain (big tier), a Leave-it on food, a smart Jackpot. Wrong: a scent dragged past, a dragged Plant, an interrupted marking, food eaten, a repeated move the Dog ignores, a Go Sniff with nothing to sniff, a wasted Jackpot. The repeated move message SHALL show at most once every 6 seconds and SHALL NOT reset Combos. A repeated turn followed by the Dog SHALL NOT show a right Feedback Message.

#### Scenario: Dragged Plant
- **WHEN** the Handler drags the Dog during a Plant into Rigid Pull
- **THEN** a wrong Feedback Message says the Dog was busy sniffing and to wait or turn instead

#### Scenario: Chain
- **WHEN** a Chain is recorded
- **THEN** the big-tier banner, Combo counter and fanfare play

#### Scenario: Repeated move
- **WHEN** the Handler repeats a move the Dog then ignores
- **THEN** a message says the Dog expected that one and to try something different without clearing active Combos

#### Scenario: Repeated move rate-limited
- **WHEN** the Dog ignores three repeated moves within 4 seconds
- **THEN** the repeated move Feedback Message is shown at most once

#### Scenario: Repeated turn followed shows no praise
- **WHEN** the Handler makes a repeated turn and the Dog follows it
- **THEN** no followed turn right Feedback Message is shown
