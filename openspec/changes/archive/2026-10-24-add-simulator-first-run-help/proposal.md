# Proposal

## Why

The first time the simulator appears, users do not understand how to play it: nothing shows where to drag to move or what the Marker button is for, and the moment another dog approaches gives no warning. Today the only help is one line of text (taste Stage) or text hints that fire after the fact. Short drawn Coach marks over the controls, and a warning when a dog approaches, make the first Stage understandable without reading.

## What Changes

- Show drawn **Coach marks** over the Stage the first time the simulator is shown: a pointer at the joystick ("drag to move") and at the Marker button ("tap to reward"), above the Stage and never blocking input.
- Show a **dog-approaching warning** the first time a dog Distractor comes toward the Dog: "A dog is coming — careful that {name} doesn't react", using the Dog's name, with a pointer toward the approaching dog.
- The simulation reports a new one-shot `dog-approaching` Stage signal when a Distractor of kind `dog` activates and is within an approach range before its trigger radius.
- Coach marks are per control: the movement mark goes at the first movement, the Marker mark stays until the first press (or 20 s). Each is recorded as used, including in the taste Stage, so the first guided Stage re-shows only marks for controls the user never used.
- The approaching-dog warning only warns (no instructions, no difficulty change). It shows in the taste Stage unrecorded and once more in the first guided Stage, recorded.
- New glossary term **Coach mark**, distinct from **Hint**.
- The taste Stage's single text control line is replaced by the drawn Coach marks.
- New text in the i18n catalog.

## Capabilities

### New Capabilities
- `first-run-coaching`: drawn, non-blocking, one-shot on-Stage help for new users: the Coach marks and the approaching-dog warning, and when each is shown, dismissed and remembered.

### Modified Capabilities
- `onboarding-funnel`: the taste Stage shows the Coach marks instead of the text control line, and the guided first Stage's event hints include the approaching-dog warning.

## Impact

- `src/sim/messages.ts` (new `dog-approaching` and `control-used` signals), `src/sim/sim.ts` (approach detection event), `bundle/src/StageScene.ts` (emit the signal).
- `GLOSSARY.md` (Coach mark), `src/shell/onboarding/hints.ts` (new hint ids, text mapping), `src/shell/onboarding/taste.ts`, `App.tsx` (hint state and overlays), `src/shell/Overlays.tsx` (new guide overlays), `src/hud/layout.ts` (reused to place the pointers).
- `src/i18n/es.ts` (new keys; no other catalog exists).
- Stored `seenHints` gains two ids; existing records stay valid.
