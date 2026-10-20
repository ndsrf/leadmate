# Design

## Context

Phase 4 of 4: Retention, content breadth, game feel, and the world progression map. Builds on `training-loop-and-learning` (Arousal meter, Learning Attributes, proactive Cues, Dog snapshot/payload pattern per [ADR 0003](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0003-learning-state-snapshot-in-update-out.md) and [ADR 0004](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0004-arousal-causes-fixation.md)). Establishes [ADR 0005](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0005-daily-stage-leaderboard-scoring.md) for Daily Stage determinism and leaderboard scoring. Terms strictly follow [`GLOSSARY.md`](file:///home/jgm/dev/projects/web-projects/leadmate/GLOSSARY.md).

## Goals / Non-Goals

**Goals:**
- Provide a rich, 4-world progression with distinct mechanics and environments (indoor apartment boundaries, outdoor suburban sidewalks, urban visual shields, and open park 3m leashes).
- Make Dog reactivity visible and audible across three distinct Reaction Tiers (Calm, Alert, Reactive) without compromising fixed-step simulation determinism.
- Introduce arcade game-feel loops: Sintonía sync combo and Go Sniff decompression reward.
- Establish the daily habit loop: 1-tap Walk Diary debrief check-ins, calendar streaks, and deterministic Daily Stages ready for future cross-player leaderboards.

**Non-Goals:**
- Multiplayer networking or real-time online matchmaking (leaderboard submission consumes completed payloads asynchronously).
- Real-world GPS walk tracking (Walk Diary is a 1-tap outcome log for debrief homework).
- Procedural audio synthesis (audio uses bundled Voice Pack / sound assets in the Expo shell).

## Decisions

1. **Terminology and Glossary Alignment:** Terms follow [`GLOSSARY.md`](file:///home/jgm/dev/projects/web-projects/leadmate/GLOSSARY.md). We use **World** for progression chapters, **Node** for lesson units, **Stage** (or **Daily Stage**) for scenario runs (banning "level"), **Arousal** for the physiological meter (banning "stress"), and **Reaction Tier** (Calm, Alert, Reactive) for behavioral escalation (avoiding collision with scenario "Stage").
2. **World Progression Schema (`WorldDef`):** 
   - Shell defines `WorldDef { id: string, title: TextKey, worldNumber: number, nodes: string[], unlockedBy?: string }`.
   - Worlds unlock sequentially: World $N+1$ unlocks when all required Nodes of World $N$ are completed in `DogRecord.completedNodes`.
   - Mechanics map:
     - **World 1 (Home & Thresholds):** Indoor hallways, elevators, doorways; static minigames only (Tap & Hold, timing exercises; no analog joystick walking).
     - **World 2 (The Quiet Sidewalk):** 2.5D walking, Slack U-shape leash, blind corners, Poste technique, Go Sniff reward.
     - **World 3 (Urban Navigations):** Fast distractors (scooters at 4.5 m/s), parked cars as visual shields, ground food temptations.
     - **World 4 (Fast Wheels & High Arousal):** Open park scenery, sudden jogger velocity triggers, 3-meter leash physics.
3. **Corridor Geometry & Wall Collision:**
   - Scenarios replace single waypoints with waypoint sequences (`waypoints: Vec2[]`) and solid boundaries (`walls: Wall[]` where `Wall = { from: Vec2, to: Vec2 }`).
   - Movement collision blocks Dog and Handler along wall surface normals.
   - Boundaries automatically occlude line-of-sight raycasts to Distractors.
   - Leash physics wraps around intersecting boundary corner vertices so leash tension measures actual geometric distance around corners without cutting through solid walls.
4. **Multi-Cue Progression & Distractor Matching:**
   - World 1–2: HUD displays single **"Let's Go"** Cue button.
   - World 3: Introduces **"Leave It"** Cue for stationary ground food.
   - Pedagogical ramp: The introductory Node for "Leave It" isolates that button on the HUD. Subsequent mixed Nodes present both buttons ("Let's Go" and "Leave It") with distinct icons. The Dog only responds when the matching Cue is triggered (e.g. "Leave It" for ground food, "Let's Go" for moving triggers).
5. **Dog Reactivity Tiers & Audio Bridge:**
   - **Calm:** $\text{Arousal} < 0.6 \times T_R$. Standard relaxed animations.
   - **Alert:** $0.6 \times T_R \le \text{Arousal} < T_R$. Head perks up, ears erect, slight deceleration, glances at Distractor without barking.
   - **Reactive:** $\text{Arousal} \ge T_R$. Dog fixates aggressively, barks, lunges toward Distractor ($+1.5\text{ m/s}^2$ outward force pulling leash into Rigid Pull). Any Marker press is classified as `marker-reactive` (zero hit credit).
   - Audio integration: Simulation dispatches `{ type: 'reaction-tier-change', tier: 'calm' | 'alert' | 'reactive', time: number }` across the WebView bridge. The shell's audio manager (`src/shell/audio.ts`) triggers fire-and-forget vocalizations (low whine/growl on Alert, sharp barks on Reactive) via `expo-audio`, preserving pure simulation determinism ([ADR 0001](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0001-phaser-in-webview.md) & [ADR 0002](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0002-pure-seeded-simulation.md)).
   - Recovery: Once line of sight breaks or distance exceeds trigger radius, Arousal naturally decays back to Alert and Calm.
6. **Go Sniff Contextual Reward:**
   - Available on the HUD for 3.0s in Slack following Disengagement from an Alert or Reactive encounter (after the Marker Reward Window closes or is hit).
   - Activating shifts the Dog to an ambient sniffing drive for up to 4.0s ($0.4\text{ m/s}$ wandering speed) while Arousal decays at $3\times$ standard decay rate.
   - Immediately terminates if leash Tension Ratio reaches or exceeds 0.85 (Taut) or Arousal drops to 0.
7. **Sintonía Sync Combo:**
   - Detects sustained handling flow: leash Tension Ratio $< 0.85$, Handler forward velocity $> 0.4\text{ m/s}$, continuous angular turning rate $|\omega| \in [0.2, 1.8]\text{ rad/s}$ without sharp reversals ($> 90^\circ$ in $< 0.5\text{ s}$) for $\ge 2.0$ continuous seconds.
   - Renders subtle green glow and rhythmic trotting gait.
   - Breaks immediately upon Tension Ratio $\ge 0.85$, stopping, or sharp reversals.
   - Logs `sintoniaTimeSeconds` in payload telemetry for scoring without distorting underlying sim physics.
8. **Daily Stage ("El Paseo del Día") & Leaderboards (ADR 0005):**
   - Deterministic calendar date seed (`YYYY-MM-DD` in local time).
   - Gameplay-critical elements (waypoints, boundaries, Distractor schedule) are strictly seed-locked for fair play; decorative props retain styling variance.
   - Normalized 0–1,000 score: Composure ($100 - \text{peakArousal}$, up to 400 pts), Slack % (up to 300 pts), Marker accuracy (up to 200 pts), and Sintonía duration (up to 100 pts).
   - Replayable within the 24-hour window for high scores.
   - Credits Streak on first clear, clears Rusty Dog status for the session, but leaves persistent `Learning Attributes` and campaign progression untouched.
9. **Walk Diary & Streak:**
   - Debrief offers 3-option homework log: `'completed'`, `'struggled'`, `'skipped'`.
   - Streak stored in `DogRecord.streak { current: number, best: number, lastActiveDate: string }`.
   - Any activity (Node Debrief, Walk Diary entry, Daily Stage) marks the local calendar date active.
   - Missed calendar day resets streak counter to 1 on next activity. Streak resets never modify Learning Attributes.
10. **Scenery Sets & Density Validation:**
    - Scenarios declare prop arrays (`SceneryItem { type: string, pos: Vec2, visualShield?: boolean }`) matching environment themes (`'indoor_apartment'`, `'quiet_suburb'`, `'urban_street'`).
    - Enforced by automated scenario validator: at least 1 prop per 5m of route (minimum 8 props per walking scenario).

## Risks / Trade-offs

- **Corner Leash Wrapping:** Calculating multi-segment corner leash wrapping in fixed-step TypeScript must remain lightweight for 60fps mobile execution. Limiting corner vertex tests to walls within leash radius keeps it $O(k)$ where $k \le 4$.
- **Reactivity Audio Fatigue:** If the Dog enters and exits Alert rapidly, frequent audio re-triggering could be jarring. Shell audio applies a 2.0s cooldown between identical tier vocalizations.
- **Timezone Turnover in Daily Stages:** Using device local date string (`YYYY-MM-DD`) prevents punishing traveling or late-night users, but players crossing timezones could encounter the next day early; accepted as standard mobile game convention.

## Implementation notes

Where the specs left a choice open, this is what was built.

- **Waypoints:** `waypoints` are the corridor points *before* `waypoint`, which stays the end of the route (so existing scenarios keep working). The Dog heads for the next point once the Handler or the Dog is within `waypointRadius` of the current one.
- **Walls:** the Handler and the Dog are discs of 0.3 m that slide along walls. The leash is the shortest path around wall corner vertices (the 4 corners nearest the leash, Dijkstra over their visibility graph); Tension Ratio is that length over the leash length, and without walls it is exactly the straight distance. A move that would stretch a wrapped leash is stopped at the limit rather than slid.
- **Reactive lunge:** a Reactive Dog fixated on a Distractor accelerates toward it at `lungeAccel` (capped at 4 m/s) and, while it does, cannot be dragged by a Handler who keeps walking away, which is what keeps the Rigid Pull. With the Handler standing (Poste) the leash simply holds it at Taut, so the calm period that ends a Fixation still works.
- **Marker lock-out:** a press while Reactive is a `marker-reactive` without credit, except inside the Reward Window after a Disengagement (that press is the whole point of the Window, and Arousal can still be above the threshold then).
- **Sintonía:** the turning rate is the heading change summed over the last 0.5 s, so a weave counts as turning all the way through; it still needs 0.2 rad/s, so a straight stretch of 0.5 s or more breaks the flow, as the spec says ("continuous turning").
- **Go Sniff:** every Fixation is a Reactive one (Fixation starts at the threshold), so the Alert-only case never reaches a Disengagement; the offer opens when the Reward Window closes (hit or miss) and the button shows only while the leash is Slack.
- **Cue matching:** "Leave It" on a fixated Dog on food disengages it at once and drops its Arousal; the wrong Cue does nothing and does not start the cooldown. A Stage's HUD shows the Cues in `scenario.cues`.
- **Stationary Distractors** (food) never move, use `salience` in the Arousal formula in place of speed, and count as passed once handled or once the Dog was near and left. A schedule (`moreDistractors`) moves to the next one when the current has passed.
- **Daily Stage:** see ADR 0005, "As delivered". World 1's Harness Ritual reuses the Poste hold-to-settle exercise with its own timings; the Doorbell Mat is a new timing exercise (mark in the 1.1 s after the Dog settles).
- **Audio:** the dog sounds are synthesized placeholders (`scripts/gen-dog-sounds.mjs`); the "Leave It" Cue plays the same spoken Cue as "Let's Go" until a recorded one is added.

## Playtest observations (task 9.3)

Played in headless Chrome (desktop 900x700 and phone 390x844 for the shell, 844x390 touch emulation for the Stage; `scripts/playtest.mjs`, `scripts/worlds.mjs`, `scripts/touch.mjs`), all checks passing: a new Dog sees World 1 open and Worlds 2-4 locked; the Harness Ritual and Doorbell Mat run to a Debrief; the Walk Diary answer is stored with date and Node and the Streak flame shows; completing World 1 opens World 2 and leaves World 3 locked; a World 2 Stage has scenery and Go Sniff; the Daily Stage skips the Primer and Checkpoint, gives the identical Stage on replay, keeps the best score, adds the Streak once and leaves the campaign Nodes alone; both Cue buttons and Go Sniff work by touch; the Alert and Reactive poses, the Sintonía glow and trot, the walls and the corner scenery render.

Things worth tuning that the checks showed (nothing changed, the specs are met as written):

- **Go Sniff is on offer for a very short time.** With the Handler standing still, after a Marker hit the button is on offer for about 1 s (the Dog needs about 1.25 s to come back to Slack, and the 3.0 s window runs from the end of the Reward Window), and after a missed Reward Window the Dog walks off at once, so the leash is Taut and the button never shows. The spec's conditions (3.0 s, Slack required) are met; if the reward should be easier to catch, the window could start when the leash first turns Slack, or the Dog could stay at the Handler's side after a Disengagement.
- **Sintonía needs real arcs.** Walking forward along a straight sidewalk never earns it (no turning), and the 2 s hold plus the 0.5 s measurement means the glow appears after about 2 s of continuous curves. Keyboard play can hardly do it; it is meant for the joystick.
- **Headless Chrome has no emoji font,** so the Streak flame is drawn from shapes instead of an emoji.
- The web shell's Metro dev server did not pick up a changed file once; restarting it with `--clear` fixed it.
