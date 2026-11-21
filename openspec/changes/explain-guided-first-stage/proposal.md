# Proposal

## Why

The guided first Stage is the first walk where the player must act, but it shows more than it explains. Coach marks cover the joystick and Marker button, and Hints cover leash colours, the Marker, the Poste and an approaching dog. Everything else is left to guess: the Dog signs (the yellow "!" when the Dog fixates, the eye when it looks at you, and the rest), the icons and floating points over the Dog, the meters, the Mark and Jackpot badges, and (with `telegraph-marker-timing`) the ring. If the player can't tell what is going on, the first walk teaches nothing and they can't act on it. The Taste Stage is meant to be failed and stays as it is.

## What Changes

- **Inventory first:** list every sign, icon, meter, badge and control the guided first Stage can show, and map each one to a briefing line and/or a Hint. The list is kept in code as the single source, and a test fails when a sign the Stage can show has no explanation.
- **Briefing:** a new overview card in the existing Theory Primer before the guided first Stage, with a labelled capture of the real Stage: the controls on screen and the signs around the Dog. It runs before the simulation, so no Stage time passes while the player reads.
- **One-shot Hints:** the first time each sign appears in the guided first Stage, a non-blocking Hint says what it means, using the existing Hint mechanism (`seenHints`, Spanish and English, no Dog name unless needed). This includes every Dog sign (the "!" of a Fixation, the Alert circle, the eye, bark arcs, scent dots, the Sintonía glow) that the guided first walk can reach.
- **One Hint for the first Fixation:** in the guided first Stage a single merged Hint explains the "!" and the ring together (replacing the rhythm Hint's wording there). The approaching-dog warning waits its turn. Hints stay non-blocking: no pause, about 4 seconds minimum on screen.
- **Coordination:** at most one Hint at a time, queued in a fixed order. Signs that `introduce-walk-feedback-gradually` holds back in the first Stage are not explained until they are Introduced.
- **Lookup later:** "Cómo se juega: Pasear" gets a control, "Las señales del perro", that reuses the Hint text and the overview capture, so a player who forgot the Hints can look the signs up.
- **Not changing:** the Taste Stage and its briefing, the simulation and its payload, and Dogs that already played the first Stage (no backfill, no record migration).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `first-run-coaching`: one-shot Hints for every sign the guided first Stage shows, queued so they never overlap, and the requirement that no shown sign goes unexplained.
- `onboarding-funnel`: the guided first Stage's Primer gains the overview card with the labelled capture, and the walking How-to-play Lesson gains the Dog signs control.

## Impact

- `src/shell/onboarding/hints.ts` (new Hint ids and signal mapping), the i18n catalogs (es and en), and the Stage-signal messages in `src/sim/messages.ts` (new signals only, no logic).
- `bundle/src/StageScene.ts` and `bundle/src/effectsView.ts`: emit the new signals when a sign is first drawn.
- Primer content and its capture (`scripts/capture-controls.mjs` or the lesson art path), plus the baseline content regeneration if the Primer lives in content.
- Tests: an inventory-coverage test, hints and i18n parity tests, and a Hint queue test.
- Works with `telegraph-marker-timing` and `introduce-walk-feedback-gradually`.
