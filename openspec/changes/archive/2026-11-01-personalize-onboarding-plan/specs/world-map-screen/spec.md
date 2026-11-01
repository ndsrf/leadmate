## ADDED Requirements

### Requirement: Map follows the personal plan
Inside each World the World Map SHALL order the Stretches for the Dog by the personal plan: the Stretches the plan names come first, in plan order, after any Stretch the user has already started, and the others keep trail order. The first unlocked, not yet completed Stop of the first open plan Stretch SHALL be next-up and carry a "Start here" mark, falling back to trail order when the plan is empty or has nothing open. The plan SHALL NOT change which Worlds are locked or how they unlock, nor the Stops inside a Stretch; the existing gate that a Stretch opens when the Mission of the Stretch before it is passed stays, applied to the Dog's order.

#### Scenario: Plan sets next-up
- **WHEN** the plan's first item is the "En casa se descansa" Stretch and nothing is completed
- **THEN** that Stretch is the first of its World for the Dog, its first Stop shows "Start here" and is next-up

#### Scenario: Started Stretch keeps its place
- **WHEN** the user has already read a Lesson of a Stretch the plan does not name first
- **THEN** that Stretch stays ahead of the plan's Stretches in its World

#### Scenario: Locked item skipped
- **WHEN** a plan item lies in a locked World
- **THEN** it is not next-up and the next open plan item is used

#### Scenario: No plan
- **WHEN** the Dog has no plan
- **THEN** next-up is the first open Stop in trail order

### Requirement: Home Behaviours section
The World Map SHALL show a Home Behaviours section with one Stretch per Home Behaviour. A Stretch whose Concern level is 0 SHALL be collapsed to a header row reading that it is not a Concern for the Dog, SHALL stay tappable to expand and play, and SHALL offer a "this is a concern now" action that sets the level to 1. Nothing SHALL be hidden. A Stretch without content SHALL appear as a "coming soon" placeholder.

#### Scenario: Not a concern
- **WHEN** barking at home is level 0
- **THEN** its Stretch is a collapsed header row marked not a concern for the Dog

#### Scenario: Expanded anyway
- **WHEN** the user taps a collapsed header
- **THEN** the Stretch expands and its answers are unchanged

#### Scenario: Becomes a concern
- **WHEN** the user chooses "this is a concern now"
- **THEN** the level is 1 and the Stretch is shown as a Concern

#### Scenario: No content yet
- **WHEN** a Home Behaviour has no Lesson
- **THEN** its Stretch is a "coming soon" placeholder

### Requirement: Home Behaviours never gate progress
A Home Behaviour Stretch that is not a Concern SHALL be excluded from completion, unlocks and progress counts. One that is a Concern SHALL count toward its own progress only and SHALL NOT gate any World.

#### Scenario: Never blocks
- **WHEN** a user has Home Behaviour Stretches not done
- **THEN** no World stays locked because of them and World completion ignores them
