# Tasks

## 1. Inventory and coverage test

- [x] 1.1 Run the guided first Stage on web and in the bundle source, and write `src/shell/onboarding/stageSigns.ts` listing every sign, icon, meter, badge and control it can show (including every Dog sign drawn in `StageScene.draw`, Feedback Message icons, flying meter points, Stage meters, Mark and Jackpot badges, the Approach ring and Check-in arc) with `hint` and/or `overview` for each. Verify: the list is reviewed with the product owner.
- [x] 1.2 Add a sim test over seeds 1 to 8 of the guided first scenario that records which Dog signs can occur, and a test that fails for any atlas frame or Feedback kind the guided first Stage can draw that is not in the list, and for any entry with neither a Hint nor an overview line, skipping kinds that are not Introduced. Verify: `npx jest src/shell/onboarding/stageSigns` fails for the right reason before 2.x and passes after.

## 2. Hints for signs

- [x] 2.1 Add the new `StageSignal`s and their `decode` validation in `src/sim/messages.ts`, with tests that reject malformed shapes. Verify: `npx jest src/sim/messages` passes and no other file under `src/sim/` changes.
- [x] 2.2 Emit each new signal from `StageScene` and `effectsView` the first time its sign is drawn, through the signal gate. Verify: build the bundle with no type errors, and a test with a fake scene shows each signal once per Stage.
- [ ] 2.3 Add the Hint ids, `HINT_FOR_SIGNAL` entries and es/en text (no `{name}` unless needed). Verify: `npx jest src/shell/onboarding/hints src/i18n` passes, including parity.
- [ ] 2.4 Add the Hint queue (one at a time, fixed priority, drop stale, pause with the Stage) and tests for two close signs, a stale sign and a paused Stage. Verify: tests pass.
- [ ] 2.5 Show the Hints in the guided first Stage only and record them in `seenHints` (not in the Taste Stage). Verify: tests cover first Stage, replay and Taste, and the record is unchanged in Taste.

## 3. Overview card

- [ ] 3.1 Add the overview card to the Primer of the guided first Stage, with its es/en text, after the movement controls card. Verify: Primer tests pass and the Taste briefing test is unchanged.
- [ ] 3.2 Extend the existing capture script to run the guided scenario with a fixed seed to the first Fixation and capture it with labels on the controls and Dog signs, then register the art. Verify: the script regenerates it without hand editing and it reads at 320 points wide.
- [ ] 3.3 Add a test that every sign with an `overview` line has a label in the card. Verify: test passes.

- [ ] 3.4 Add the control "Las señales del perro" to `content/beta/lessons/howto-walking` (es and en, `controls` and images updated), reusing the capture and the catalog text of the Hints. Verify: a test that the Lesson text matches the catalog entries, `npx jest src/shell/lessons` passes and the baseline is regenerated. Coordinate with `telegraph-marker-timing` section 9, which edits the same lesson.

## 4. Integration checks

- [ ] 4.1 Play the guided first Stage on web and on a device after a progress reset, in Spanish and in English. Verify: every sign that appears has been explained by the overview or a Hint, no two Hints overlap, none blocks input, and the walk still takes under 25 seconds of play.
- [ ] 4.2 Run `npm test` and `npx tsc --noEmit`. Verify: both pass.

## Workflow follow-up

- No backfill: Dogs that already finished the first Stage see the new Hints only after a replay or reset.
- Rebase the rhythm Hint wording with `telegraph-marker-timing` if its Hint ids change before this change archives.
- Archive this change once implemented and reviewed.
