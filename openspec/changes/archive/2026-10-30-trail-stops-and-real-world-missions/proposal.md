# Proposal

## Why

Each World today is three or four Nodes in a row, and the only theory on the trail is the short Theory Primer inside each Node. A user can finish a whole World in one sitting without ever walking their real dog. The Walk Diary also asks "how did it go?" on the Debrief, minutes after the simulation and before any walk has happened. The app trains the thumb, not the walk.

We want each World to be a longer, mixed trail (theory, how-to-play guides, Minigames, Stages) cut into short daily Stretches. Each Stretch ends with a concrete real-world Mission that is checked in on a later day, and only that check-in opens the next Stretch. When a walk went badly, the app gives real material to correct it instead of just logging it. The decision is recorded in `docs/adr/0013-real-world-mission-gate.md`, and the vocabulary is already in `GLOSSARY.md`.

## What Changes

- **Trail Stops replace "Node-only" Worlds.** A World becomes an ordered list of **Stops** of three kinds:
  - a **Lesson Stop**: a theory or How-to-play Lesson;
  - a **Node Stop**: an existing Node, either a Minigame or a Stage;
  - a **Mission Stop**: a real-world task.

  Stops are grouped into **Stretches**. Each Stretch trains exactly one technique and ends with exactly one Mission.
- **How-to-play Lessons.** A new Lesson kind explains the simulator's controls (hold, joystick, leash, Cue buttons, Poste, Go Sniff) with annotated images and clips. The trail order for a technique is: theory Lesson → How-to-play Lesson (only when the controls are new) → Node(s) → Mission.
- **Primer becomes a recap.** On the trail, a Node's Theory Primer shrinks to one or two cards recapping the Lessons before it, and the Checkpoint tests that Lesson's theory. The guided first Stage's introductory Node keeps its full dual-aspect Primer.
- **The real-world gate is the only daily limit.** Within an open Stretch the user can do as much as they like.
  - The Mission brief opens right after the Stretch's last Debrief. It shows a clear target, plus "Tu foco", the Debrief's weakest-metric exercise.
  - The wait starts when the user taps "Start mission".
  - The check-in opens on the next calendar day **and** at least 8 hours after the start.
  - Until the check-in, every Stop past the Mission stays locked. Completed Stops, the Daily Stage and the Theory Library stay available.
- **Mission check-in with corrective material.** The check-in uses the three existing answers:
  - *¡Conseguido!*: the Mission passes and the next Stretch opens.
  - *Costó un poco*: the user picks the problem from a fixed list, or "Otra cosa". They then get a **Fix** page:
    1. reassurance;
    2. the likely cause;
    3. corrections, with image or video;
    4. an easier target;
    5. "Practise again", which opens the related Stop.

    The wait restarts. Passing the easier target passes the Mission. From the second struggle on, the user may "Move on anyway".
  - *Hoy no pudimos*: no penalty and the wait restarts. After three skips in a row, the app offers the easier target.
- **Fixes stay available.** Every Fix the user has seen is listed in the Theory Library under "Tus ajustes".
- **Walk Diary moves to Missions.** **BREAKING (behaviour):** the Debrief no longer shows the same-day check-in. Diary entries are now written by Mission check-ins and still count toward the Streak.
- **Map shows the new Stops.** Each Stop kind gets its own glyph. Missions get Stretch flags and a **waiting** state that says when the check-in opens, and the Dog marker waits at that Mission.
- **Restructured content for Worlds 1–4.** These Worlds get one Stretch per technique, with new theory Lessons, How-to-play Lessons, Missions and Fixes, all placeholder-flagged. Preview Worlds 5–8 are unchanged.
- **Existing progress is kept.** A Mission counts as passed when every Node Stop after it in its World is already completed. An unread Lesson before a completed Node never blocks the trail.
- **Out of scope:** check-in reminder notifications, free-text problem reports, and final copy and media.

## Capabilities

### New Capabilities
- `real-world-missions`: covers Mission Stops:
  - the brief and "Tu foco";
  - the later-day and 8-hour check-in;
  - the three outcomes;
  - the Fix page, easier targets, move-on after repeated struggles and the three-skip offer;
  - persistence, merge and grandfathering.

### Modified Capabilities
- `world-progression`: Worlds become Stretches of Stops (Lesson, Node, Mission), with one technique per Stretch. Completion and unlocking count every required Stop, and Missions gate the Stops after them.
- `world-map-screen`: Stop states gain *waiting*, Stops are drawn by kind with Stretch markers, and the Dog marker can wait at a Mission.
- `theory-lessons`: Lessons gain a kind (`theory` or `how-to-play`) and can be placed on the trail with no suggested Day. The Library gains a "Tus ajustes" section of seen Fixes.
- `training-node-loop`: on the trail the Primer is a one- to two-card recap and the Checkpoint tests the preceding Lesson. The Debrief loses its check-in, and its exercise becomes the Mission's "Tu foco".
- `walk-diary-streak`: the check-in happens on a Mission on a later day, not on the Debrief, and an entry records the Mission and the chosen problem.
- `progress-reset`: Reset Progress also clears Mission state and seen Fixes.
- `account-sync`: the conflict rules cover Mission state (a passed Mission wins) and seen Fixes (union). Walk Diary entries are keyed by date and Node or Mission.

## Impact

- `src/shell/world.ts`, `src/shell/mapModel.ts`: `WorldDef.nodes` becomes `stretches` of typed Stops. There are new helpers for unlocking, completion and next-up, and a new `waiting` state.
- New `src/shell/missions/`: Mission and Fix data, the state machine and the check-in rules. The trail content for Worlds 1–4 lives here too.
- `src/shell/lessons/`: the Lesson `kind`, an optional `day`, the new trail and How-to-play Lessons, and the "Tus ajustes" section.
- `src/shell/nodes/content.ts`: one- to two-card recap Primers for trail Nodes.
- `src/shell/dogRecord.ts`, `streak.ts`, `sync/merge.ts`, `reset.ts`: Mission state and seen Fixes on the record, the merge rules, and diary entries keyed by Mission.
- `src/shell/screens/WorldMapScreen.tsx`, `src/shell/ui/mapLayout.ts`: Stop glyphs, Stretch flags, the waiting state, and variable-length Worlds.
- `src/shell/screens/NodeScreens.tsx`: remove `WalkDiaryBar` from the Debrief.
- New `MissionScreens.tsx` (brief, waiting, check-in and problem picker). The Fix page is rendered with the Lesson renderer.
- `App.tsx`: a new `mission` flow, a Lesson `returnTo`, and opening the brief after the last Debrief.
- `src/i18n/es.ts`: Mission, Fix, How-to-play and trail Lesson strings.
- **Ordering:** this change modifies requirements that the unarchived `revamp-world-map` change also modifies, so `revamp-world-map` must be archived first.
