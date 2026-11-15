# Proposal

## Why

During a Stage the user rarely knows what they just did right or wrong. The only signal is a coloured ring around the Dog for 0.5 s after a mark, and the Debrief at the end. Learning to walk a dog depends on fast, specific feedback, which is exactly what the app teaches the user to give their Dog: mark the right moment within a second, and say what to do instead of punishing. The app should do the same for the user, with the feel of a video game, so every good action is rewarding and every mistake explains itself.

## What Changes

- **A message for every right and wrong action** in a walking Stage, shown near the Dog. Each kind of message has a full Hint and a short wording once seen, recorded in the Dog record's `seenHints` like the Coach marks. Wrong messages always say what to try next.
- **Game-style effects with each message, scaled to how much it matters:**
  - small (e.g. "Nice turn!"): pop-up word, event icon, small spark burst, short tick sound;
  - medium (e.g. "Perfect!" mark timing): star burst, bounce, chime, haptic;
  - big (e.g. a completed chain such as turn, look, mark, sniff): banner, glowing screen edge, Combo counter, short fanfare;
  - wrong: the word wobbles, a grey puff, a soft "bonk", with no screen shake, red flash or loss of Meter Points.
- **An icon and sound per kind of event** (paw for a followed turn, eye/heart for a Check-in, nose for Go Sniff, hourglass for waiting, sparkle for a fresh move, star for a chain, grey puff for a mistake), so events can be told apart at a glance.
- **Meter Points that fly into Stage Meters.** Each positive event adds Meter Points that visibly fly into the meter they feed, and the Stage's handling score (and so its stars) comes from the same points, so the end result matches what the user saw during the walk. Meter names and which events feed them are set per Stage by the scenario.
- **Marker timing grades**: Perfect, Good, or Late with the reason.
- **Combos**: repeats combine ("Nice turn x3") and the tick's pitch rises with the Combo.
- **One message at a time**: if two happen together the more important one wins (a mistake before a success), the other is dropped, and nothing queues.
- **Game sounds in a Stage.** Today UI sounds may not play during a running Stage. They now play straight away but drop in volume while a Voice Cue or Dog sound plays, so the cue is always heard. The existing sound and haptics settings turn them off, and reduced motion turns bursts into fades with the same information.
- **Hints fold in.** A Hint is the first-time, fuller form of a Feedback Message. The existing event Hints (leash colours, Marker, Poste, leash Taut or Rigid Pull) keep their behaviour but use the same one-at-a-time slot, so a Hint and a Feedback Message never stack.
- **The Taste Stage shows only right messages**, because it is built to end with the Dog Reactive (ADR 0010).
- **The simulation only emits events**; all messages, effects and sounds stay in the shell/bundle and never change the simulation, its seed or its telemetry. New simulation events are added where an action has none today (for example, mark timing).
- All text comes from the i18n catalog in Spanish and English. Icons and burst shapes are drawn in the LeadMate Design System canvas; sounds come from a CC0 source (licence to confirm) or are made for the app.

## Capabilities

### New Capabilities
- `stage-action-feedback`: the in-Stage messages, their first-time and short forms, the effect tiers, icons, sounds, Combos, priority and rate rules.
- `stage-meters`: Stage Meters a scenario may declare, the Meter Points events add to them, how Meter Points visibly fly into them, and the handling score computed from them. A Stage with no meters keeps today's handling score (ADR 0005), so the Daily Stage leaderboard is not affected; Meter Points are shown only in Stages that have Stage Meters.

### Modified Capabilities
- `ui-feedback`: game sounds may play during a running Stage, lowered under the Voice Pack and Dog sounds, instead of never playing there.
- `reward-timing`: hits get a Marker timing grade (Perfect, Good), and a press just after a window closed becomes a Late Marker press instead of a wasted press with no explanation.
- `simulation-telemetry`: the payload adds Marker timing grade counts and, in Stages with meters, the meter results.
- `power-efficiency`: limits on feedback effects during a Stage.

`reward-celebration` keeps its rule (stars from the handling score); only where the score comes from changes, in `stage-meters`.

## Impact

- **Code**: `bundle/src/StageScene.ts` (effects, replacing the flash ring), `bundle/src/overlay.ts`, `src/hud/*` (message layer, meters), `src/sim/sim.ts` events, `src/sim/payload.ts`, the shell's feedback backends (`src/shell/ui/feedbackBackends.ts`), i18n catalogs.
- **Assets**: new SFX set and icon/burst art.
- **Scope**: works in every walking Stage, not only World 6. Which events a Stage reports follows from its mechanics, so older Stages show messages for the actions they already have (turns, Check-ins, marks, Go Sniff, Disengagements).
- **Dependencies**: none on other changes. `rethink-unpredictable-walk-stage` depends on this one.
