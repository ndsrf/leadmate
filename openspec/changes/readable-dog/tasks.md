# Tasks

## 1. Spike: a rigged dog the pipeline can render

- [ ] 1.1 Find a rigged quadruped dog GLB with walk/trot/idle clips and head, ear and tail bones under a licence that allows shipping (CC0 preferred); record the source, licence and bone names in design.md under Decision 3, and verify the licence text is saved next to the asset.
- [ ] 1.2 Add a bone `overrides` step to `scripts/kenney/render-sprites.mjs` and render one test pose (walk with head turned to the Handler) in all 8 directions; verify by looking at the 8 frames and at the packed result in a Stage on the Android test device.
- [ ] 1.3 Measure the atlas size and load time with an estimated full clip set (~240 Dog frames) on the low-end Android device and record go/no-go in design.md; if no-go, switch to the fallback rig described under Risks before continuing.

## 2. Derived Canine Posture

- [x] 2.1 Extend `DogPose` in `src/hud/pose.ts` with `gaze`, `head`, `ears`, `tail` and `action`, keeping the existing flags; verify with new `pose.test.ts` cases for each situation in the "Canine Posture follows the Dog's situation" requirement (calm, Check-in, Alert, Reactive, Rigid Pull, sniffing, looking away).
- [x] 2.2 Add a test that runs a seeded Stage with and without deriving poses and asserts identical debrief payloads; verify it passes with `npm test`.

## 3. Walking Dog sprite

- [ ] 3.1 Render the full clip set (`idle`, `walk`, `walk_wag`, `trot`, `sniffwalk`, `sniff`, `planted`, `mark`, `lunge`, `look_l`, `look_r`) in 8 directions and pack it into the atlas; verify the frame names in `sprites.json` and that `bundle/src/sprites.test.ts` covers each clip and direction.
- [ ] 3.2 Choose the Dog's frame from the new Canine Posture in `StageScene.drawActors` (head turned back while walking away, planted, marking, lunge); verify with a debug scene or the devSeed that each action shows, in every Dog coat.
- [ ] 3.3 Keep the Check-in gaze line and eye; with reduced motion, use the still `walk` pose with a raised tail instead of `walk_wag`; verify on device with reduced motion on and off.

## 4. Dog portrait

- [ ] 4.1 Draw the Dog portrait layers (body, heads, ears, eyes, tails) in the LeadMate Design System canvas, export them as PNG and pack a `portrait` atlas; verify every layer named in design.md Decision 5 is present.
- [ ] 4.2 Add the Dog portrait's position to `src/hud/layout.ts` and draw it in the Stage HUD from the derived state, tinted by coat; verify with layout tests at 320, 375 and 768 points wide that it overlaps no control or Coach mark and respects safe-area insets.
- [ ] 4.3 Redraw the Dog portrait only when the state changes or on a wag step, and never in close exercises; verify with the HUD dirty-tracking tests (`src/hud/dirty.test.ts`) and by checking no Dog portrait appears in a close exercise.
- [ ] 4.4 Make the Dog portrait ignore touches; verify that a drag starting on it moves nobody and a tap does nothing.

## 5. Integration checks

- [ ] 5.1 Run the `power-efficiency` scenario regression check and the energy readout on Android and web; verify results stay within the existing budget and tolerances.
- [ ] 5.2 Playtest a World 3 and a World 5 Stage on a phone and confirm a tester can say, without help, when the Dog looks at the Handler, looks away and is Alert; note the result in design.md.
