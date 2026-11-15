# Spec Delta

## ADDED Requirements

### Requirement: Scent walk actions answer back
In a scent Stage the system SHALL also show a Feedback Message for these actions. Right: a granted sniff, a waited Plant, a waited marking, a fresh move followed by the Dog, a Chain (big tier), a Leave-it on food, a smart Jackpot. Wrong: a scent dragged past, a dragged Plant, an interrupted marking, food eaten, a repeated move the Dog ignores, a Go Sniff with nothing to sniff, a wasted Jackpot. Each wrong Feedback Message SHALL say what to try instead.

#### Scenario: Dragged Plant
- **WHEN** the Handler drags the Dog during a Plant into Rigid Pull
- **THEN** a wrong Feedback Message says the Dog was busy sniffing and to wait or turn instead

#### Scenario: Chain
- **WHEN** a Chain is recorded
- **THEN** the big-tier banner, Combo counter and fanfare play

#### Scenario: Repeated move
- **WHEN** the Handler repeats a move the Dog then ignores
- **THEN** a message says the Dog expected that one and to try something different
