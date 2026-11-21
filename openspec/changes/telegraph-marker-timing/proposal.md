# Proposal

## Why

Marker timing is the moment in a walk that feels best when you get it right. The game already grades it (Perfect / Good / Late), plays combos, and gives effects, sounds and haptics. But the Reward Window opens *by surprise* on Disengagement and lasts about 1 second, so players react to it after it has happened instead of anticipating it. Rhythm games feel good because you **see the beat coming**. New players also don't know what the "right rhythm" is in the first place: stop, stay calm, wait, then mark. So the game must make that easy to figure out at first, then gradually take the help away.

The real skill points the same way. An experienced handler sees the Dog's disengagement building before it happens. Showing that build-up teaches the anticipation we want players to take onto real walks.

## What Changes

- **Approach ring:** while the Dog is fixated and the Handler is holding the calm (stopped, no Rigid Pull), a ring shrinks toward the Dog in step with the calm period's progress. It lands exactly when the Disengagement opens the Reward Window, which is where the Perfect grade sits. If the Handler moves or the leash goes into Rigid Pull, the calm period restarts, and the ring visibly snaps back open. That teaches the Poste ("hold still and the beat comes") without any text.
- **Check-in arc:** a smaller arc builds up at the Dog's head just before a Check-in whose start the seeded Stage has already decided, so the player can anticipate those Marker presses too.
- **Learning the rhythm (assist that fades):**
  - **Full assist** at the start: the ring, a 3-2-1 tick sound on the way in, a highlighted Marker button at the Perfect moment, and a first-time rhythm Hint that takes the place of the existing first-Fixation Marker Hint ("Stop and wait for the ring to close, then tap Marker.").
  - **Ring only:** the ticks and button highlight go away.
  - **Late ring:** the ring appears only for the last part of the approach, and the Check-in arc only just before the look.
  - **Off:** the player reads the Dog's head turn alone.
  - The assist level goes down based on **the player's own results** (a run of Marker hits graded Perfect or Good), not on World number alone. It goes back up a level after a run of misses, Late Marker presses or early presses. Steps are silent; the change shows from the next approach.
  - A Settings option keeps the full assist on permanently, as an accessibility choice.
- **Rhythm feel:** the sound played for Perfect Marker presses in a row rises in pitch with each one. Optionally, walk footsteps and music lock onto the Sintonía trot (deferred to a later change; see design Non-Goals).
- **The first meeting is a gentle practice:** the first telegraphed Marker presses happen in the guided first Stage, with full assist and its existing forgiving Distractor, before any Stage where a miss matters. The existing Poste practice Node (a hold Minigame with no Marker) shows the same ring closing on its hold.
- **The how-to-play Lessons explain the ring:** "Cómo se juega: Pasear" gets a new control, "El aro de la mirada" (the ring closes while you stay still, the Dog then looks at you, that is the moment to tap Marker; the Marker button lights up and three ticks play at first, and both fade as you improve), and its Poste control mentions the ring. "Cómo se juega: tocar y mantener" explains the Poste practice ring (closes while holding Stop, lands when the Dog settles, snaps open on an early release). Both lessons get real captures, in Spanish and English. Without this, players can't tell what the ring is for.
- **The simulation is unchanged:** the telegraph and assist are HUD-only. The calm period, Reward Window length, grade thresholds, seeded results and debrief payload all stay the same. The HUD only reads calm-period progress and upcoming Check-ins from the simulation's existing state; it doesn't change them.

## Capabilities

### New Capabilities
- `marker-telegraph`: the approach ring and Check-in arc, how they map to calm-period progress and to the Perfect grade, the assist levels, how the assist goes down and back up based on the player's results, rhythm sounds, and the permanent-assist setting.

### Modified Capabilities
- `stage-action-feedback`: adds the pitch rise for Perfect Marker presses in a row to the Feedback Message sounds, under its existing rules (one message at a time, never changes the Stage, sound setting).
- `settings-screen`: adds the "always show timing help" option.
- `first-run-coaching`: the guided first Stage introduces the approach ring with full assist, and the rhythm Hint takes the place of the first-Fixation Marker Hint at full assist.

## Impact

- `bundle/` HUD (Phaser): drawing the ring and button highlight, plus audio ticks.
- `src/hud/`: pure logic for the assist level and its result-based progression. Needs tests.
- `src/sim/`: no logic change. The HUD reads existing `SimState` fields; only the bridge message types in `src/sim/messages.ts` gain fields.
- `src/shell/`: the Dog record stores the current assist level and runs so they persist and sync (whole-record last-write-wins, no version bump). A progress reset clears them. A device-local setting keeps full assist on.
- Analytics (`add-product-analytics`): not in this change. A follow-up adds Marker grade per assist level once that change is archived, to check that players really do move off the assist.
- Works together with `split-walks-into-encounters`: short Encounters give many quick practice beats.
