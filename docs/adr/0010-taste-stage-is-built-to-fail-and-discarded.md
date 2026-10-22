# The Taste Stage is built to end in a reaction and its result is discarded

A new user plays a Taste Stage before any setup question: a strong Distractor meets a Dog with no Cue skill, tuned so nearly any play ends with the Dog Reactive. The point is to let the user feel the problem the game solves, so every later question has a reason. The shell never applies its payload, so the Dog record changes only by the onboarding step (ADR 0002, 0003).

## Considered options

- **A `forceReaction` flag in the simulation:** guarantees the outcome, but puts a demo mode into a pure simulation for one screen. Rejected; a hard enough scenario is enough, and a user who holds on anyway reaches the same Payoff Screen.
- **Apply the Taste Stage as a normal Stage:** the Dog would "learn" from a walk played on defaults, before the user's setup answers exist. Rejected.
- **Keep the old order (setup questions first):** no hook before four screens of questions. Rejected as the reason for this change.

## Consequences

The scenario can drift as simulation tunables change, so a test asserts that scripted default input (a still Handler and a straight-walking Handler, across several seeds) reaches Reactive within the time limit. A first impression of failure is deliberate; the Payoff Screen frames it and names the Dog.
