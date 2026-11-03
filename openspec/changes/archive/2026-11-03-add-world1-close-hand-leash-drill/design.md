# Design

## Context

See proposal.md for motivation. Current state that shapes the approach:

- The close view is one Phaser scene (`CloseExerciseScene`, registered as `close_exercise` in `bundle/main.ts`) driving one pure sim (`src/sim/closeExercise.ts`) with a declarative control scheme (`controls: 'leash_drill'`, ADR 0020). Its only content is `NARROW_STREET_PASS` in World 4: an approaching dog Distractor with shielding, Poste (`poste`), leash gather and Marker.
- `closeExercise` already has the pieces a hand drill needs: `effectiveLeashLength` with gather/release, arousal and reaction tiers, calm timing (`calmSeconds`), a reward window and a `markBudget`. A run ends with `exercise-complete` and `success = tier !== 'reactive'`.
- A Node counts as completed when its Debrief is reached, even if the technique failed (`training-node-loop`, "Practice before technique"). The no-fail rule rides on this.
- `DISTRACTOR_KINDS` in `src/sim/learning.ts` is `child | bicycle | dog | skateboard | food | other`; the Trigger Profile is keyed by it.
- Coach marks (`src/hud/coach.ts`, `onboarding/hints.ts`) cover the walking Stage only (`coach-move`, `coach-mark`), remembered in `DogRecord.seenHints`.
- World 1 is composed per Dog in `src/shell/world.ts`.
- `DogRecord.ageBand` is `puppy | adolescent | adult | senior | null`.
- The dog-basics-world Purpose says the basics come before any leash work. The new drill is an indoor hand-and-leash drill, so the Purpose line is reworded when this change is archived (a delta cannot edit a Purpose).

## Goals / Non-Goals

**Goals:**
- A playable close-view Node inside the first minutes of World 1 for every Dog.
- Reuse the close sim; add only what the hand drill needs.
- Tailor by age band through copy and config values only.

**Non-Goals:**
- A bite-training simulation, or any exercise inside a biting Home Stretch.
- The guarding / "drop it" technique, ear-tugging or handling segments.
- Per-age art, new characters or new audio.
- Any leash lift, jerk or verbal correction as a mechanic.

## Decisions

**1. A second control scheme value, not a new scene.** Add `controls: 'hand_drill'` next to `'leash_drill'` and branch inside the existing sim/scene. *Why:* ADR 0020 makes the scheme declarative, and the camera, sprites, HUD, telemetry and Debrief plumbing are shared. *Alternative:* a separate scene and sim for the hand drill. Rejected: duplicates about 1,400 lines for a drill whose rules are a subset of the leash drill. *Alternative:* reuse `'leash_drill'` with a hand `kind` only. Rejected: the shield control must be hidden and the pass rule differs, so the scheme is the right switch.

**2. `hand` Distractor kind, stationary.** Add `'hand'` to `DISTRACTOR_KINDS`. The Distractor sits near the Handler (`startPos == endPos`) and is active for the drill's duration instead of travelling. *Why:* the arousal model keys on Distractor distance and the Trigger Profile, so a hand near the Dog raises arousal with no new physics. *Risk:* the Trigger Profile and learning snapshot are keyed by kind; the new kind needs a default level (usual) and must not change the learned profile of a real Dog. The drill pins the hand to the usual level (`HAND_DRILL_TRIGGER_LEVEL`) at run start, because calm runs lower a kind's level and a hand at 0 gave a Dog that never got excited (found in playtesting); the record is left alone. Check every `Record<DistractorKind, ...>` consumer.

**3. No-fail result.** In `'hand_drill'` the run ends on a calm hold for `calmSeconds` (success) or on a maximum duration (timeout), never on the reactive tier. A lunge adds to `lungesPrevented`/lunge telemetry and lowers the handling score. The cap is 60 seconds. The Debrief for a timeout is neutral ("not calm yet") with one tip and no failure screen, and replay is offered, not required. Reaching the Debrief always earns the normal completion reward with at least one star (as the skip credit of ADR 0021); the handling score only adds stars above the first. *Why:* the signed-off biting safety stance is that a simulation that can be failed is the wrong way to teach bite handling; this drill sits in Basics, but its subject is close to it, so it takes the same stance. *Alternative:* the World 4 rule `success = tier !== 'reactive'`. Rejected: that is a fail state.

**4. Leash model: gather holds distance; there is no lift.** The video's upward leash lift is not modelled. Gathering shortens the effective leash so the hand stays out of reach, and `poste` buffers a strain. *Why:* matches the existing leash physics and the World 1 "No physical correction" requirement.

**5. Age tailoring is data.** The node keeps one `closeScenario` and the shell builds the config and chooses i18n keys from `ageBand` (neutral copy and middle-of-the-road tuning for `null`). Adolescent/adult/senior change copy (excited-greeting framing) and a few numbers (hand speed, calm window). No per-age sprites. *Alternative:* four Node definitions. Rejected: four ids to complete and sync for one drill.

**6. Coach marks use the existing mechanism.** New hint ids for the close-view controls are added to `HINT_IDS` and stored in `seenHints`. Mark positions come from the close HUD layout. The walking `coach-mark` does not count for the close Marker. *Why:* one persistence path, and reset-progress already clears `seenHints`.

**7. Trail placement and gating.** The Hand Drill is the first Node of Basics Stretch 1, before `dog-as-dog`, and needs only the how-to-play Lesson (`howto-choose-action`) read: it is an exception to "a Node needs every Lesson of its Stretch", made so the user plays within minutes rather than after three Lessons and a minigame. The Stretch's Mission needs both Nodes (`prerequisites`). The per-Dog World 1 ordering is unchanged: the Stretch is still the one holding the how-to-play Lesson. *Alternative:* after `dog-as-dog` with the normal gate. Rejected: that is about as late as the first Node already is, which defeats the goal. The cost is a Primer that must teach the Dog-as-a-dog frame in two cards, since `dog-as-dog` has not been played yet.

**7a. Skipped runs count.** The pause-menu "skip simulation" completes the Node like any other simulation Node (`skipped: true`), so a user who skips still reaches the Debrief and unlocks the Mission.

**8. Biting pointers are copy only.** The biting Lessons and Missions add a line pointing to the Node. `REQUIRED_PARTS` and the home-behaviour content table are unchanged, so the known-gaps logic needs no edit.

**9. Readability and look: design 18 (added after playtesting).** The first build was unplayable: the HUD sat inside the zoomed world camera, the art was jagged and nothing said what to do. The hand drill is now drawn by an HTML/SVG view (`bundle/src/handDrillView.ts`) over the Phaser canvas, built from design 18's own SVG symbols (`handDrillArt.ts`: Migas in stand, sit and open-mouth poses, the isometric slab, hand, treat, ball, sparkle, icons) and its CSS (ink outlines, hard shadows, segmented meters, step pills, bubble, round buttons, Fredoka). The Phaser scene keeps the clock, the sim and the input and builds no world for this scheme; a how-to-play card holds the clock until "Empezar". The Dog sits when calm, stands and bounces when worked up, slides along the slab when the leash is gathered and gets an open mouth, the reward and sparkles on a mark; the last frame is held 1.3 s before the Debrief. The Gather button is bottom-right (right hand) and the Marker bottom-left (left hand), Poste above Gather; the shell's Coach marks follow `closeHudLayout`, now the round-button centers, with Gather and Poste labels left of their buttons and the Marker label to the right of its button. *Alternative:* the Kenney CC0 sprites in Phaser, tried first and rejected as off-style. *Alternative:* redraw design 18 in Phaser shapes. Rejected: it cannot match hand-tuned SVG. The generated close-up atlas stays for the narrow-street exercise, antialiased by supersampling.

## Related decisions

ADR 0022 (`docs/adr/0022-hand-drill-is-no-fail-and-sits-in-basics.md`) records the no-fail rule and the Basics placement.

## Risks / Trade-offs

- [Introducing close controls before the user has met any] → Coach marks, a gentle first-run config and a long calm window; the drill is replayable.
- [A hand near a dog reads as encouraging mouthing] → The hand never reaches the Dog's mouth, the copy frames it as "keeping the Dog calm around hands", and the biting professional-help note stays first in the biting Lessons.
- [Adding a Distractor kind touches the learning snapshot and Trigger Profile] → Default level for `hand`, test that existing snapshots and sync merge are unchanged.
- [Copy variants multiply translation work] → Four short variants for primer, hint and exercise copy only; the generic puppy text is the fallback.
- [Content asserts a training technique from third-party videos] → The drill teaches only gather, hold, mark and reward; it copies no guarding, handling or correction steps from the videos.

## Migration Plan

1. Ship the sim/scene changes and the Node behind the normal trail; no data migration (the app has no existing users).
2. Reword the dog-basics-world Purpose in the main spec when archiving.
3. Rollback: remove the Node from the Stretch; `completedNodes` entries for the id are ignored by the trail.
