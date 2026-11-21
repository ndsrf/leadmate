# Proposal

## Why

The core skill LeadMate teaches is **reading the Dog and acting at the right moment**. Today most of that reading is taught as text: Lessons of 350 to 700 words, Primer cards and quizzes. We think new players don't read it, and that they're confused after the first walk. A fast reflex game that teaches body language by playing it gives value in seconds and replaces reading with doing.

## What Changes

- Add **Read the Dog**, a short reflex Minigame (about 20 to 30 seconds per round):
  - The Dog shows one body-language state at a time: for example soft and loose, ears up and still, a frozen stare, a lip lick, hackles up, a play bow.
  - The player classifies it with one tap or swipe into its **Signal Class** (**Calm**, **Alert**, **About to react**) before a short timer runs out. A Signal Class is the reading of the pose, not the Dog's Reaction Tier.
  - Every answer gets instant feedback (right or wrong, with a one-line name for the signal: "Freeze: he's about to react"), using the existing Feedback Message tiers, sounds and haptics.
  - Streaks of right answers build a Combo. Each round ends with a score and an instant replay (one tap to play again, not a recorded playback).
  - The states get faster and subtler as the player improves. Signals the player gets wrong come back more often.
- Use Read the Dog in the onboarding funnel **in place of the current Diagnostic**. It is already a 15-second "watch the Dog, tap" game. It still records the player's reaction latency on the old scale, so it keeps seeding the Dog's starting reconnection latency exactly once, and it still feeds the diagnostic card (with reworded label) and the Personal Plan.
- Playable with a screen reader (longer timer, spoken body descriptions) and with reduced motion.
- The Dog is drawn with the existing Minigame Dog art (breed and coat) and its readable states. New states are added where needed.
- All signal names and feedback text come from the i18n catalog.

**Open question:** whether Read the Dog should also replace some World 1 static choose-the-action Minigames. World 1 teaches reading the Dog at home, so it fits. We'll decide after the analytics baseline (`add-product-analytics`) shows how World 1 performs.

## Capabilities

### New Capabilities
- `read-the-dog-game`: the round structure, the set of body-language states and their correct class, the timer and how it speeds up, feedback, combo and scoring, repeating missed signals, and the result it reports.

### Modified Capabilities
- `onboarding-funnel`: the Diagnostic step becomes a Read the Dog round. It keeps recording reaction latency once, and keeps the diagnostic card and Personal Plan inputs.
- `canine-minigames`: the Diagnostic scene becomes the Read the Dog scene, and a new requirement adds the readable body-language states, drawn on the Dog in its breed and coat. The Expressive Dog requirement for the action Minigames is unchanged.

## Impact

- A new shell screen `ReadTheDogView.tsx` replacing `DiagnosticView.tsx` (not the Phaser bundle), driven by a new pure engine `src/shell/nodes/readTheDog.ts`. The World 1 action Minigame engine `readDog.ts` is not reused or changed (design Decision 1).
- New Dog art states for subtle signals (freeze, lip lick, hackles, whale eye, play bow).
- i18n catalog entries in every supported language, and a reworded `plan.latency` label on the diagnostic card.
- New domain terms for `GLOSSARY.md` (Read the Dog, Body Signal, Signal Class) and widened Feedback Message, Combo, Diagnostic and Minigame definitions, applied outside this change.
- Analytics: emit the round result as an event once `add-product-analytics` lands.
