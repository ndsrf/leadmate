# Proposal

## Why

The walk feels good when you do things right, but it's hard to keep doing things right for 60 to 90 seconds. Mistakes pile up, the Dog reacts, and the whole minute gets judged on how it ended. A retry means replaying the whole walk. Short, focused attempts that end while the player is still doing well, with an instant retry, give that "I did it right" feeling more often and in less time.

## What Changes

- Add **Encounters**: short walking set pieces of about 10 to 20 seconds, each built around **one** situation and **one** decision (its **Aim**). Examples: a dog appears round a corner (turn away), a dog fixates at the leash limit (Poste, then Mark), a skateboarder crosses (keep Slack and keep moving). Each Encounter attempt is an ordinary walking Stage.
- Each Encounter ends at its own waypoint or time limit and gives an instant result of **1 to 3 Paws**, based on the existing signals: tension shares, Marker grades, peak Reaction Tier.
- **Instant retry**: one tap restarts the same seeded Encounter with no loading screen, no briefing and no quiz. The best attempt of each Encounter counts (the latest on a tie).
- A walking Node's Interactive Simulation can be an **Encounter Series** instead of one long Stage: 3 to 5 Encounters played in order. ("Series", not "chain": Chain already names the follow-mark-walk-on sequence of the Unpredictable Walk.)
- A Node played as an Encounter Series takes its handling score, and so its Stars, from the kept Paws, and updates the Dog once, from the kept attempts, when its Debrief is reached.
- Sintonía, Marker grades, Feedback Messages and combos stay as they are, per Stage. Encounters only change how long a stretch of play lasts and how it is scored.
- **Prototype first:** convert one World 3 Stretch (`walk-distraction`) into an Encounter Series and compare its completion rate and retry rate (from `add-product-analytics`) with the current long walk, before and after, before converting other Worlds. The Daily Stage and every other Node are unchanged.

## Capabilities

### New Capabilities
- `walk-encounters`: the definition of an Encounter (one situation, one Aim, short route), the 1-to-3-Paw result, instant retry, the Encounter Series inside a Node, its score, and leaving it early.

### Modified Capabilities
- `stage-flow`: an Encounter's result is a 1-to-3-Paw card with an instant Retry and Next, instead of the results screen; Exit from the Pause Menu during an Encounter Series ends the whole Series.
- `training-node-loop`: the Interactive Simulation of a walking Node can be an Encounter Series, and its sizing is updated (currently 60 to 90 seconds).
- `simulation-telemetry`: every walking Stage payload reports its peak Reaction Tier; the Node's payload of an Encounter Series lists each Encounter's kept Paws and attempts and combines the kept attempts.
- `content-packs`: a Node's structure file can define an Encounter Series, with validation rules, a `minAppVersion` gate and format-guide coverage.

## Impact

- `src/sim/`: one new seeded payload field (`peakReactionTier`); the simulation stays pure and seeded (ADR 0002). An Encounter is a short scenario, and the existing waypoint and time-limit end conditions already cover it.
- `src/shell/nodes/`: Paw rule, kept attempt, combined payload and the Series state in the Node reducer, all pure.
- Content pack Node format, validator, parser and format guide: Series definitions and Encounter titles; packs that use them need a newer `minAppVersion`.
- Shell flow between Stages (`App.tsx`, `Overlays.tsx`): result card, Retry and Next on the same Stage view, Exit from a Series.
- Debrief: lists each Encounter's kept Paws and attempts.
- Domain language: new terms Encounter, Encounter Series, Aim and Paw, and the Node definition widened to "one or more Stages" (GLOSSARY.md), plus a proposed ADR for Series scoring.
- Depends on `add-product-analytics` to measure whether the prototype works; the Series works without it.
