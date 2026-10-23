# Tasks

## 1. Action Minigame engine

- [x] 1.1 Add `src/shell/nodes/readDog.ts`: Dog states, action set, state→correct action table, beat scripts for Harness Ritual and Doorbell Mat built from a seed, and a pure `stepReadDog`. Verify with `readDog.test.ts` (correct advances, wrong marks a mistake and allows one retry, timeout is missed, every script ends calm, all four actions are correct for at least one state, same seed gives the same script).
- [x] 1.2 Add result metrics (`poste`/`timing` and `tension`) and the handling score per decision 3. Verify in `readDog.test.ts` with a perfect run (1, 1 and 1000), a run with one failed beat (750/800) and a run with mistakes (lower tension).
- [x] 1.3 Delete `doorbellMat.ts` and its test, and remove `HARNESS_RITUAL` and the `variant` option from `posteMinigame.ts`. Verify with `npx tsc --noEmit` and the existing test suite.

## 2. Expressive Dog

- [x] 2.1 Extend `CaninePosture`, `PostureSpec` (eyes, emote), `SPECS` and `COLLAR_POINT` in `ui/canine.ts` with the new postures. Verify in `canine.test.ts` that every posture has spec, label, cue, collar point, and that any two readable states differ in pose and at least one other feature.
- [x] 2.2 Draw the new postures, eye variants and the emote bubble in `CanineMinigameAvatar.tsx`, honouring reduced motion via `useMotion`. Verify by rendering each posture in the app (web) and checking it reads at a glance, and with reduced motion on that the state changes without animation.

## 3. Views

- [x] 3.1 Add `ActionButtonRow` (2×2, icon, label, accessibility label) and a Harness prop (harness on/off) and door chime/mat highlight to the scenes in `ui/MinigameProps.tsx`. Verify with the existing `noRawColors` and `hudTokens` tests and visually in the app.
- [x] 3.2 Add `ReadDogView` and rewire `DoorbellMatView` and the Harness Ritual to it; simplify `PosteMinigameView`. Update `NodeScreens.tsx` and `node.ts` as needed. Verify by playing both Nodes end to end and reaching the Debrief with the metrics shown.
- [x] 3.3 Announce the Dog's state at each new beat and give each action button an accessible label (name and effect). Verify with a component test of the labels and a screen reader pass on web.
- [x] 3.4 Show the one-line hint after a wrong choice and the pip/result chip per beat. Verify manually with a wrong choice in each state and that the caption names the Dog state.

## 4. Text and content

- [x] 4.1 Add and update i18n keys (actions, cues, hints, outcomes, help) in `src/i18n/es.ts` and every other locale file; remove unused `minigame.harness.hold`, `minigame.doorbell.mark` and related keys. Verify with the localization test and a search for unused keys.
- [x] 4.2 Review the Harness Ritual and Doorbell Mat primers, questions and exercise copy for the new mechanic. Verify by reading the two Nodes in the app.

## 5. Specs and regression

- [x] 5.1 Make `node.ts` pass the action Minigame's handling score to `starsFor` and keep the Poste practice at 1 star; update `reward-celebration` behaviour tests. Update `node.test.ts` and `world.test.ts` for the changed Minigames. Verify with `npm test` passing.
- [x] 5.2 Run `openspec validate read-the-dog-minigames` and fix any issues; playtest both Nodes for pacing (decision window, number of beats) and adjust the constants. Verify with a clean validate and a note of the chosen values in design.md.
