# Proposal

## Why

The first two Nodes of World 1, the Harness Ritual and the Doorbell Mat, are the first Minigames a new user plays, and both are dull. The Doorbell Mat is a single "Mark" button pressed at the right instant, which feels arbitrary. The Harness Ritual is "hold a button until the Dog stops", which has no decision in it. The Dog also shows too little to read: a few postures, no face change, no emotion. The result is a poor first impression of the whole app.

## What Changes

- Replace the Harness Ritual and the Doorbell Mat with a shared "read the Dog, pick the action" Minigame: each beat shows the Dog in one clearly readable state, and the user chooses one of several action buttons that fits what they see. A right choice moves the little scene forward; a wrong choice makes the Dog react visibly.
- Harness Ritual actions: Wait, Cue, Marker, Put on harness. Doorbell Mat actions: Wait, Cue, Marker, Send to mat. Each scripted scene has several beats with different Dog states, so the right button changes from beat to beat.
- Make the Minigame Dog more expressive: new postures (jumping, spinning, sniffing the floor, staring at the door, sitting and looking up, lying relaxed), eye, ear, tail and mouth changes per state, and an emote bubble (alert, distracted, love, sleepy) near the head, always paired with a text caption so colour or icon is never the only signal.
- Show a short explanation after a wrong choice ("Jumping Dogs get no harness: wait for four paws on the floor") so the user learns the reading.
- Cue plays the user's chosen Cue and Marker uses the existing Marker term, so the Minigame practises the same buttons used in Stages.
- The Harness is drawn on the Dog only when Put on harness is the right action; a wrong try is refused by the Dog.
- Give the two action Minigames a handling score from failed Action beats so they earn 1 to 3 stars (the Poste practice stays at 1 star).
- Scenes are 4 beats (Harness Ritual) and 5 beats (Doorbell Mat) with a 5 second decision window.
- Keep the Poste practice as the hold-to-settle Minigame; it is not part of this change.
- Remove the timing-window Doorbell Mat and the Harness Ritual variant of the hold Minigame.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `canine-minigames`: the Doorbell Mat and Harness Ritual become choose-the-action Minigames; the Dog gains richer postures and emotes; the posture, scene and timing requirements that name the old mechanics change.
- `reward-celebration`: action Minigames earn 2 or 3 stars from failed Action beats instead of always 1.
- `world-progression`: World 1 Minigames are no longer described as Tap & Hold and timing exercises only; the Harness Ritual and Doorbell Mat are decision Minigames.

## Impact

- Code: `src/shell/nodes/doorbellMat.ts` and `posteMinigame.ts` (remove Harness variant), a new shared choose-the-action module under `src/shell/nodes/`, `src/shell/screens/DoorbellMatView.tsx` and `PosteMinigameView.tsx`, a new view for the action Minigame, `src/shell/ui/canine.ts`, `CanineMinigameAvatar.tsx`, `MinigameProps.tsx` (action button row, emote bubble), `src/shell/nodes/content.ts`, `node.ts` (`MinigameKind`), `NodeScreens.tsx`.
- Text: new and changed keys in `src/i18n/es.ts` and the other locale files (action labels, cues, per-state hints, outcomes); help copy for both Nodes and their primers.
- Tests: replace `doorbellMat.test.ts`, update `canine.test.ts`, `node.test.ts`, `world.test.ts`.
- Debrief metrics keep the same names so Node results, the dog record and sync are unaffected.
- Out of scope: Poste practice, Stage scenarios, Diagnostic, art for breeds other than the existing Dog drawing, new audio.
