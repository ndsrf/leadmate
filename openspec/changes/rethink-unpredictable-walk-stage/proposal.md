# Proposal

## Why

The Stage for Unpredictable Walks (World 6, `park-unpredictable`) shipped with interim scoring that was judged not fun. The cause is structural: the Dog's only Drive steers it toward the Handler's next waypoint, so the Dog already "knows" the route and a zig-zag turn is never a surprise (ADR 0030). Sniffing exists only as a reward after a Disengagement; nothing in the park ever pulls the Dog, even though the Stage is full of lamp posts, bins and bushes. A real walk is a contest for the Dog's attention between the world (mostly smells) and the Handler. Sniffing is the Dog's most important need on a walk, and Unpredictable Walking is the tool for winning its attention back kindly. World 6 should teach both, one idea at a time, with real walks in between.

## What Changes

- **Scent Spots and the scent pull (simulator, opt-in per scenario).** Scenarios may declare Scent Spots, usually on scenery such as lamp posts, bushes and bins. A ScentDrive is blended with the Goal Drive, so the Dog drifts toward smells in range. In these Stages the Dog follows the Handler's heading instead of the Pathway (ADR 0030). Scenarios without Scent Spots behave exactly as today.
- **Autopilot and Novelty.** Steady, straight walking raises Autopilot and the scent pull grows. A change of direction, pace or a stop wins the Dog back. Repeating the same change lowers its Novelty, so the user must vary their moves. A **Chain** (change → the Dog follows → Marker on its look → walk on or Go Sniff) is rewarded.
- **Plant, marking and food.** At a strong Scent Spot the Dog Plants (don't drag: wait, or turn it into a Check-in). At a marking post it marks. Sniffed spots stop pulling. Food by a bin is the existing food Distractor, which also smells, and it needs Leave-it, not Go Sniff.
- **Go Sniff any time in these Stages**, not only after a Disengagement, and it does not end just because Arousal is already zero. Granting a sniff at a Scent Spot is the reward.
- **Jackpot.** A second, smaller button beside the Marker with its own budget: a high-value reward meant for hard moments.
- **Stage Meters Nose and Connection** (from `in-stage-feedback`) set each Stage's Stars (ADR 0029). There is no pass or fail.
- **World 6 becomes three Stretches, sniffing first**, each with one technique, its own Lesson and a real-walk Mission:
  1. **Let them sniff**: new Lesson `theory-sniffing-walks` → Stage `park-nose-on` → Mission: on one walk, give Go Sniff at least 3 times, each right after the Dog looks at you.
  2. **Unpredictable walks** (existing): the two existing Lessons → `park-unpredictable` (turn and look, now with Scent Spots) → new Stage `park-keep-fresh` (Novelty and Chains) → the existing Mission.
  3. **Sniffing on your terms**: new Lesson `theory-sniffing-on-your-terms` (Plant, marking, food, high-value rewards) → how-to-play Lesson for the Jackpot → Stages `park-plant-mark` and `park-not-that-one` → Mission: on one walk, wait out 2 sniffing stops without pulling and use Leave-it once on food or rubbish.
- **Debrief replay**: a timeline of right and wrong moments, with up to two things done well and one thing to try next.
- **Released in two content updates**: first Stretches 1 and 2, then Stretch 3.
- **Not in this change:** a "full park" Stage that mixes everything and the squirrel (they belong to a later busy-park Stretch of World 6), wind, tiredness, breed-dependent noses, scents in Worlds 3-5.

## Capabilities

### New Capabilities
- `scent-drive`: Scent Spots, the scent pull and its blend with the Goal Drive, Autopilot, Plant, marking, sniffed spots and food that also smells.
- `walk-novelty`: the Novelty of each kind of change, how it shapes the Dog's response, and the Chain.

### Modified Capabilities
- `dog-drives`: in scent Stages the Goal Drive follows the Handler's heading instead of the waypoint; the follow chance depends on Novelty and Autopilot, and pace changes and stops also open a follow window.
- `go-sniff`: in scent Stages, Go Sniff is available at any time with a Slack leash and does not end because Arousal is already zero; a Go Sniff at a Scent Spot uses it up.
- `recall-world`: World 6 holds three Stretches in the order above; the provisional Stage scoring is replaced by Stage Meters; the Debrief replays the walk.
- `reward-timing`: a scenario may add the Jackpot beside the Marker.
- `simulation-telemetry`: the payload carries scent-walk results and a walk timeline.
- `stage-action-feedback` (from `in-stage-feedback`): scent-walk actions get their own Feedback Messages.
- `world-progression`: a Stretch inserted ahead of one in progress, or Stops added to a finished Stretch, never re-lock a Stop the user could already reach.

## Impact

- **Simulator**: `src/sim/drives.ts`, `src/sim/sim.ts`, `src/sim/config.ts`, `src/sim/payload.ts`, `src/sim/scenery.ts` validation, with deterministic seeded tests.
- **App**: the Jackpot button in the HUD; the Debrief timeline in the Node screens; progression availability for inserted Stretches.
- **Content**: World 6 in `content/beta/` (three new Lessons, four new Stage Nodes, two new Missions, `park-unpredictable` retuned, `worlds/recall.yaml` restructured), wordless art, Spanish and English text, then promotion to stable with a `minAppVersion` bump, in two releases.
- **Docs**: `GLOSSARY.md` (done during planning), ADR 0029 and ADR 0030.
- **Depends on** `readable-dog` (Canine Posture, including Plant and marking, must be visible) and `in-stage-feedback` (Feedback Messages, Stage Meters, Marker timing grades).
