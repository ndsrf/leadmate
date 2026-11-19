# Tasks

## 1. Starting set and the Introduced-set helper (pure, test-first)

- [x] 1.1 Add `STARTING_KINDS` beside `FEEDBACK_ACTION_KINDS` in `src/sim/feedbackKinds.ts` (design decision 2), with a comment on `FEEDBACK_ACTION_KINDS` that every new kind needs the starting set or a Node that Introduces it; verify with a test that every starting kind is a key of `FEEDBACK_ACTION_KINDS` and that `src/sim/payloadBaseline.test.ts` stays green.
- [x] 1.2 Write a failing table test `src/shell/introductions.test.ts` covering every scenario of the `walk-introductions` requirements "Starting set", "Nodes Introduce action kinds", "Introduced actions follow the trail", "Taste Stage and guided first Stage use the starting set" and "Daily Stage uses completed Nodes", on fixture worlds and nodes (including a replay of an earlier Node by an advanced player and a Node not on any trail). Verify it fails.
- [x] 1.3 Implement `introducedKinds(context, worlds?, nodes?)` in `src/shell/introductions.ts` (design decision 4: contexts `node`, `taste`, `first`, `daily`; cumulative in worldNumber, Stretch, Stop order). Verify 1.2 passes.

## 2. Content format and validation

- [x] 2.1 Add optional `introduces: string[]` to the Node schema, parser and resolver (`src/shell/content/schema.ts`, `parser.ts`, `resolver.ts`) so that `NodeDef.introduces` is set. Verify with a resolver test on a fixture Node that has and one that lacks the field.
- [x] 2.2 Write failing validator tests in `src/shell/content/validator.test.ts` for the scenarios of "Introductions are validated" and the stage-meters scenario "Meter Points for an action not yet Introduced": unknown kind, starting kind, Introduced twice (both Nodes named), meter kind not yet Introduced (Node, meter and kind named), and a never-Introduced kind as a warning only. Implement the checks in `validator.ts` (design decision 5). Verify they pass.
- [ ] 2.3 Document `introduces`, the starting set and the list of Introducible kinds in `content/FORMAT.md` (§3.4 and a short authoring note), and extend `src/shell/content/formatConformance.test.ts` so that a mismatch with `FEEDBACK_ACTION_KINDS` fails. Verify the test passes.
- [ ] 2.4 Add the `introduces` lists of design decision 3 to the beta Nodes (`walk-distraction`, `poste-practice`, `leave-it-intro`, `park-nose-on`, `park-unpredictable`, `park-plant-mark`). Verify `npm run content:validate -- --channel beta` passes with no introduction warnings, and that `--channel stable` passes (warnings allowed, listed in the PR).

## 3. Feedback gate in the HUD

- [x] 3.1 Write failing tests in `src/hud/feedback.test.ts`: with an Introduced set that lacks `followed-turn` and `harsh-stop`, a followed turn and a harsh stop produce no message, sound, haptic or icon; they neither join nor end a running Check-in Combo; no Hint is reported as newly seen for them; an absent set behaves as today; the Taste Stage rule still holds. Verify they fail.
- [x] 3.2 Add an optional `introducedKinds` option to `FeedbackDecider` and drop not-Introduced kinds before any Combo, Hint or seen logic. Verify 3.1 passes and the existing feedback tests stay green.
- [x] 3.3 Add optional `introducedKinds` to the bridge `start` message type and pass it from `StageScene` (and its `lastStartMessage` fallback) into `FeedbackDecider`. Verify with a bundle test that a started Stage without the field answers every kind and one with the field answers only the given kinds; verify `npm run sim:build` passes.

- [x] 3.4 In `StageScene`, when the start message carries an Introduced set without `go-sniff`, draw no Go Sniff button or prompt and ignore the Go Sniff keyboard shortcut (design decision 4). Verify with a bundle test that a scent Stage and a post-Disengagement offer show no button and send no `sniff` input in that case, and show it as today when `go-sniff` is Introduced or the field is absent; verify `npm run sim:build` passes.

## 4. Shell wiring

- [ ] 4.1 In `App.tsx` `startStage`, compute the context (Taste route → `taste`; the guided first Stage → `first`; Daily → `daily` with the completed Nodes; a Node flow → `node` with its id, including each Encounter of a Series) and send `introducedKinds`. Verify with `App.test.tsx` that the start message for the first Stage carries exactly the starting set and that `park-unpredictable` includes `followed-turn`.
- [ ] 4.2 Gate the Poste event Hint and the Coach marks by the same set (design decision 4: control → kinds mapping). Verify with `App.test.tsx` that the guided first Stage shows no Poste Hint and records none as seen, that the movement and Marker marks still appear there, and that a close exercise still shows Gather, Poste and Marker marks.
- [x] 4.3 Filter the Debrief walk timeline (`src/shell/screens/DebriefTimeline.tsx`) by the Stage's Introduced set, leaving the payload untouched. Verify with a component test on a `park-nose-on` payload containing a `followed-turn` moment.
- [ ] 4.4 Add a payload-identity test: the same seeded Stage and inputs give identical debrief payloads, meter values and handling score with only the starting set and with every kind Introduced (scenario "Same seed, different Introduced sets"). Verify `npx jest`, `npm run typecheck` and `npm run sim:build` pass.

## 5. Docs

- [ ] 5.1 Check that the GLOSSARY entry "Introduced action" and `docs/adr/0036-walk-feedback-follows-the-trail-presentation-only.md` (written during planning) still match the implementation, and update them if not. Verify `openspec validate introduce-walk-feedback-gradually --strict` passes and the glossary term is used unchanged in the code comments and the format guide.

## 6. Integration check

- [ ] 6.1 Manual run (web or device) after a progress reset. In the Taste Stage and the guided first Stage, only leash and Marker feedback appears (no "Nice turn!", no Poste Hint). `walk-distraction` in World 3 shows no "Nice turn!" and does offer the Go Sniff button; a new player's Daily Stage shows no Go Sniff button. After a dev unlock to World 6, `park-unpredictable` shows the followed-turn Hint the first time. Note the results in the PR.

## Workflow follow-up

- Promote the `introduces` lists to stable through the normal beta → stable promotion, after playtest.
- Archive after `add-product-analytics`, `add-read-the-dog-game`, `telegraph-marker-timing` and `split-walks-into-encounters` (all of them touch `stage-action-feedback` or the content format), with "Sync now".
