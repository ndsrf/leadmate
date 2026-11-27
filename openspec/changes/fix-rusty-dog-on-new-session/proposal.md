# Proposal

## Why

Whether the Dog is Rusty is decided once per app process, so an app that the phone keeps alive in the
background never turns the Dog Rusty when the 3-day gap is reached, and an old warm-up or skip outlives
the day it was made. The decision belongs to the App Session, which also starts on a return after 30
minutes or more away (Linear LEA-5).

LEA-5 reports that the counter on the rusty dog screen does not count down. The warm-up walk shows no
countdown at all, and none was found in the git history, so the owner asked for one to be added. The
decision defect above was found while investigating the issue and is fixed in the same change.

## What Changes

- The Rusty decision is made again, from the stored last-Stage date, every time a new App Session starts:
  at launch (as today) and on a return to the foreground after 30 minutes or more away (new).
- A new App Session forgets a completed or skipped warm-up, as a restart of the app already does.
- A shorter absence keeps the current decision and warm-up outcome.
- The warm-up walk shows a countdown from 40 s to 0 s. It follows the walk's own clock, so it stands
  still while paused, and it is gone when the walk ends. No other Stage shows it.
- No stored data changes.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `dog-learning-model`: new requirements state when the Rusty decision is made and how long it and the
  warm-up outcome hold, and add the warm-up countdown.

## Impact

- `App.tsx`: the Rusty decision and warm-up outcome move out; the foreground handler and the progress
  reset restart them.
- New `src/shell/useRustyDog.ts`, with tests, plus App-level wiring tests in `src/App.test.tsx`.
- Countdown: a scenario flag set by the warm-up, a new bundle-to-shell message sent by the Stage, a shell
  overlay in `src/shell/Overlays.tsx`, and new Spanish and English catalog keys. The hint panel sits
  lower on devices with a tall top inset, so it does not cover the countdown.
- No change to the Dog record, sync, analytics events or content packs. The embedded Stage bundle must be
  rebuilt with the app (`npm run sim:embed`).
