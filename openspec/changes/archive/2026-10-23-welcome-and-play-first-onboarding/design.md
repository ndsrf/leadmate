# Design

## Context

See proposal.md for motivation. Facts that shape the approach:

- The funnel is a list of persisted steps in `onboarding/flow.ts` (`setup`, `diagnostic`, `plan`, `paywall`, `first-stage`, `done`). `inFunnel` is true before `first-stage`, and `routeFor` in `navigation.ts` maps the step to a screen. `first-stage` is routed on its own. The registration prompt is not a step but a transient flow opened from `App.tsx` after the first Stage, when a backend exists.
- `DogRecord` has `coat` but no name, and `onboarding: { step, firstStageCompletedAt, trialStartedAt, diagnosticLatency, plan }`. `completeFirstStage` runs `applyStage` and moves the step on.
- The simulation is pure and seeded, takes a read-only learning snapshot in and sends a payload out (ADR 0002, 0003). It never touches storage, so running a Stage and discarding its payload changes nothing.
- `app-shell-navigation` (archived 2026-10-22, its specs now in `openspec/specs`) already modified `Funnel order` and `Resumable funnel` in `onboarding-funnel`. The deltas here are written on top of its wording.

## Goals / Non-Goals

**Goals:**
- A new user plays the real simulation, and feels the Dog react, before any setup question.
- The taste costs nothing to the Dog record and needs no new simulation code.
- The first Stage introduces the game's core theory and mechanics through a complete "Node 0" loop (Theory Primer ➔ Checkpoint ➔ Guided Walk ➔ Debrief) so the user understands the mechanics and plays with intent.
- Users already in the old funnel are not disturbed.

**Non-Goals:**
- A contextual paywall trigger, entitlement checks or a free week (follow-up change).
- Per-step analytics.
- A forced-failure mode in the simulation.
- Changing the Diagnostic.

## Decisions

**1. New steps in the same step list, ahead of `setup`.**
`welcome`, `dog` and `taste` join `ONBOARDING_STEPS` before `setup`, and `paywall` moves after `first-stage`, giving `welcome, dog, taste, setup, diagnostic, plan, first-stage, paywall, done`. The Funnel is every step before `done`, so `inFunnel` is true up to and including `paywall`, and `paywall` routes as its own page like `first-stage`. `inFunnel` and `pageForStep` are updated so the routing stays one pure function (the app-shell rule). Alternative: a separate pre-funnel state machine. Rejected: two sources of truth for "where is the user" would need their own persistence and reset rules.

**2. The taste is a scenario config, tuned to fail.**
A Stage config with a `dog` Distractor (high Trigger level, large `triggerRadius`, short `activateAfterMeters`, small `startOffset`), a default snapshot with no Cue skill, and a short time limit. The shell ends it on the first Reactive tier. Alternative: a `forceReaction` flag in the simulation. Rejected: it adds a demo mode to a pure sim for one screen, and the user decided that "hard enough that nobody succeeds" is enough. A user who holds on anyway reaches the same Payoff Screen (spec scenario "Succeeding anyway"). See ADR 0010. The Taste Stage shows no Hints, but one fixed control line (for example "Walk the Dog away from the trigger") is shown over it. It is not a Hint, is never stored, and goes away at the first input.

**3. The taste's payload is dropped, not applied.**
The shell never calls `applyStage`, `applyActivity` or the hint recorder for it. The only record change is the onboarding step. Alternative: apply it as a normal Stage. Rejected: the Dog would "learn" from a Stage played on defaults before the user's setup answers exist.

**4. Closing during the taste restarts it.**
The step stays `taste` until the Stage ends, so a restart plays it again. Nothing in the Stage is persisted mid-play.

**5. Name is a plain optional field on the Dog record, synced with it.**
`name: string` (trimmed, 1 to 20 characters on entry, empty string for old records) and a record version bump with a migration that adds `''`. It travels with the record under the existing last-write-wins rule, so no new conflict rule is needed. Syncing keeps a cloud Dog's name on a second device. Anywhere the text uses the name and it is empty (a user who was already past `dog` before the update), the catalog uses a neutral "your Dog". Settings lets the user set or edit the name, and existing users are never prompted for it.

**6. Coat moves from setup to the name-and-look step.**
Setup keeps Equipment, weights and the Trigger Profile. The coat control component is reused, and settings keeps its own coat picker.

**7. Existing users are routed by their persisted step.**
A record whose step is `setup` or later keeps it. Only a record in the first-run state (a new Dog or one reset) starts at `welcome`. `NEW_ONBOARDING.step` becomes `welcome`, so a reset also starts there. A record that finished the funnel is never moved back. Reset Progress also clears the name and coat, since the Funnel asks for both again. The welcome screen has a secondary "I already have an account" link to login (not a second primary action and not a form field). If login finds a cloud Dog, it replaces the first-run record and that Dog's own step applies, with no prompt (a device that was paired before, or is past `welcome`, still gets the choose-Dog prompt). Reset Progress is offered only to a Dog with no cloud copy: signed out and not paired (ADR 0009).

**8. The paywall moves after the first Stage and the registration prompt.**
It stays a stub (both buttons continue, nothing is gated). The position is a deliberate placeholder so the screen is not lost. A contextual trigger, such as the third Stage or a 3-day Streak, replaces it in a follow-up. The registration prompt is a transient flow, not a step, so the persisted step is the source of truth: finishing the first Stage sets the step to `paywall` before the registration prompt opens. When registration or auth ends, routing follows the step, and auth reached from the Funnel returns to `paywall`, not `map`. Registration comes before the paywall.

**9. New screens reuse the Paper Meadow components.**
The welcome is the splash screen itself in a ready state (one screen, no second one after it); name and payoff are built from the existing `Panel`, `GameButton`, `TextField`, `Choice`, `MeadowBackdrop` and `Migas` pieces. The text comes from the i18n catalog (`catalog-usage` test applies).

**10. The first Stage is structured as an introductory "Node 0" loop.**
The first Stage replaces the uncontextualized raw walk with the full LeadMate learning loop: Theory Primer cards ➔ Checkpoint quiz ➔ Guided walk simulation ➔ Debrief.
- **Primer**: 4 cards. Card 1 (real-world): Slack leash ("the smile") and why tension drives arousal. Card 2 (virtual-dog): Walking & steering controls to keep slack. Card 3 (virtual-dog): Leash tension indicators (Green/Yellow/Red) and the Poste anchor (stopping when tension rises). Card 4 (virtual-dog): Marking check-ins and rewarding calm behavior.
- **Checkpoint**: A quick quiz question confirming the anchor rule ("What do you do when tension spikes? Stop and anchor").
- **Simulation**: The guided first walk with in-game hints reinforcing the concepts.
- **Debrief**: Displays handling score and metrics, giving a rewarding conclusion before proceeding to registration and the paywall.
- **Implementation**: Reuses `PrimerScreen`, `CheckpointScreen`, and `DebriefScreen` by running an intro `NodeRun` inside the existing `first-stage` onboarding step, ensuring persisted step backward-compatibility without altering the step enum.

## Risks / Trade-offs

- [A guaranteed-feeling failure reads as punishing in the first 20 seconds] → The payoff screen frames it as the problem the game fixes, names the Dog, and the time limit keeps it short. Check it on a device before shipping.
- [A skilled user succeeds and the payoff looks wrong] → One payoff text that holds either way, and the scenario is tuned hard.
- [The taste scenario drifts as the sim's tunables change] → A test asserts the scenario reaches Reactive within the time limit with scripted input (a still Handler and a straight-walking Handler) across several seeds, so a retune that makes it easy fails the build.
- [Two changes edit the same requirements] → Archive `app-shell-navigation` first. The deltas here repeat its wording for `Funnel order` and `Resumable funnel`.
- [Record version bump affects sync with older app versions] → The new field is optional on read, so old records sync in and an older client ignores it.

## Migration Plan

1. Bump the record version and add `name: ''` on read.
2. Ship the new steps. Records in `setup` through `done` keep their step, and only new or reset records start at `welcome`.
3. Rollback: the extra steps are skipped by routing a first-run record to `setup`, and the name field is ignored when absent.

## Open Questions

- The Spanish copy for the welcome, the name prompt, the payoff and the control line is supplied by the user (the board has none for these screens).
- The exact scenario numbers, to settle while tuning on the sim. The time limit starts at 20 seconds.
