# Design

## Context

Both Minigames are pure step functions driven by a ticker in a view: `stepDoorbell` (one Mark press, three phases) and `stepPosteMinigame` (hold until settled, with a `HARNESS_RITUAL` config). The Dog is drawn by `CanineMinigameAvatar` from a `CaninePosture` (7 values) looked up in `SPECS` in `ui/canine.ts`; `MinigameProps.tsx` holds the scenes, caption, pips, result chip and the single `MinigameButton`. `node.ts` selects the view with `MinigameKind` (`poste-hold`, `harness-ritual`, `doorbell-mat`) and the Debrief reads `poste`, `timing`, `tension`. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One reusable, testable engine for "read the Dog, pick the action", used by both Nodes with different scripts and button sets.
- A Dog whose state can be told at a glance and by caption.
- Debrief metrics, dog record, sync and Node unlocking untouched.

**Non-Goals:**
- Changing the Poste practice, Stages, or the Diagnostic.
- Per-breed art, new audio, or a difficulty setting.

## Decisions

**1. Beat-based scene scripts, not a random state each tap.** A scene is a list of beats. Each beat has a Dog state, the correct action, a decision window (5 s, generous, no panic; 4 beats for the Harness Ritual and 5 for the Doorbell Mat, about 30 s a scene), and for a wrong action a hint key. Correct advances to the next beat. Wrong marks a mistake, plays an agitated reaction for about 1.2 s (reuse `AGITATION_SECONDS`) and then the same beat stays open once more before it counts as failed and the scene moves on, so the user cannot stall. Timeout counts as missed. *Alternative:* independent random states per tap; rejected because the scene would not feel like a small story (bell, barking, mat, settle) and could not show the harness going on.

**2. Scripts, with seed-driven variation.** Harness Ritual: jumping at the door (Wait), sniffing away (Cue), sitting and looking up (Put on harness), harness on and relaxed (Marker). Doorbell Mat: bell rings, barking at the door (Send to mat), unsettled on the mat (Wait), sniffing away (Cue), lying relaxed on the mat (Marker). The seed (`createRng`) picks whether a distraction beat appears and shuffles which of two equivalent entry states opens, so repeats differ while each scene ends calm. The correct action for a state is defined once in a table, so a script is only a list of states.

**3. Marker and Cue are the Stage buttons.** The buttons use the glossary terms Marker and Cue (on screen "Marcar" and "Llamar"), and Cue plays through the existing resolved-Cue audio, so the Minigame teaches the real controls. "Reward" is not used.

**3b. Pure engine `readDog.ts`.** `stepReadDog(state, dt, action | null)` mirrors the style of `stepDoorbell`, with no React or timers, so it is tested with plain unit tests. The config carries the script builder, actions and the metric names. Metrics: first metric = correct beats / beats; `tension` = 1 − wrongChoices / beats, floored at 0. The Harness maps the first metric to `poste`, the Doorbell to `timing`. The result also carries a handling score, 1000 × (1 − failed beats / beats), fed to `starsFor`: 3 stars with no failed beat, 2 with one (750 of 4, 800 of 5), 1 with two or more. A failed beat is one still wrong after its single retry, or timed out; `tension` counts every wrong choice. The Poste practice keeps no score.

**5. Expressive Dog by extending the posture table.** Add postures `jumping`, `sniffing`, `sitting_attentive`, `staring_door`, `unsettled_on_mat` and `relaxed_lying`, and add `eyes` (open, wide, closed) and `emote` (`alert`, `distracted`, `love`, `sleepy`, `none`) to `PostureSpec`. The avatar draws the emote as a small SVG bubble beside the head; the caption remains the text signal. Existing postures stay, since the Poste practice and Diagnostic use them. Collar points for the leash are only needed for postures used in leash scenes. *Alternative:* a skeletal animation rig; rejected as too large for this change.

**6. UI.** A `ActionButtonRow` (2×2 grid, large targets, icon plus label, `accessibilityLabel`) replaces `MinigameButton` in these two views only. A single `ReadDogView` renders both Nodes, taking the config and a scene component (door/mat props or harness props). `DoorbellMatView` becomes a thin wrapper and `PosteMinigameView` loses its `variant`. `MinigameKind` keeps its three names so Node definitions, saves and sync keep working.

**7. Text.** All new strings (actions, per-state cues, hints, outcomes, help, primer) go through i18n keys in every locale file; `es` is written first-hand, and other locales follow the same fallback the project uses for new keys.

## Risks / Trade-offs

- [Right answer too obvious or too ambiguous] → keep states visually and verbally distinct, keep the hint on a wrong choice, and playtest the two scripts with a few users before release.
- [Large avatar file grows further] → add postures through small helpers inside `Pose`, with a snapshot-free test of the posture table (every posture has a spec, label, cue and collar point).
- [Removing the timing mechanic loses the "reward timing" concept taught in the primers] → keep the Marker beat last in both scripts so the lesson ("mark the calm") is still the payoff, and check the primer copy still matches.
- [Metric meaning shifts for `timing`/`poste`] → they remain 0–1 scores; Debrief copy for the two Nodes is reviewed as part of the tasks.

## Migration Plan

No data migration: Node ids, `MinigameKind` values and metric names are unchanged. The change ships in one release. Rollback is a revert.

## Chosen values

Kept as designed after a scripted play-through of both Nodes in the web app (no timing data from real users yet): decision window 5 s (`READ_DOG.decisionSeconds`), 4 beats for the Harness Ritual and 5 for the Doorbell Mat (`READ_DOG.beats`), reaction time 1.2 s (`AGITATION_SECONDS`), and 1.2 s on the finished scene before the Debrief so the last good beat is seen. Revisit the window and beat counts after the first playtest with users.
