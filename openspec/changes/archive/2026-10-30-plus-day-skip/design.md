# Design

## Context

- Mission state is a small pure state machine in `src/shell/missions/mission.ts` (`MissionState`, `checkInOpensAt`, `checkIn`, `moveOn`). The wait is anchored on `startedAt` or the last attempt (ADR 0013, real-world Mission gate). The Day Skip follows ADR 0014.
- Gating is computed in `src/shell/world.ts`. `doneness()` feeds both `stopLock()` (what opens) and `isWorldComplete()` (what unlocks the next World). Today these two agree: a Mission is done only when `passedOn` is set or it is grandfathered.
- `src/shell/mapModel.ts` turns `stopStatus()` into map states (`done | locked | waiting | open/next`) and chooses `nextUp` / `waitingAt`.
- No entitlement exists. `onboarding.trialStartedAt` is recorded once by `passPaywall()`, and the paywall advertises "7 días gratis". The paywall is already reachable as a flow from the map (`{ name: 'paywall' }` in `App.tsx`).
- The Activity Log (`src/shell/activity.ts`) is display-only (ADR 0013, activity log). The Diary model (`src/shell/diary.ts`) builds days from it and from the Walk Diary.
- Sync (`src/shell/sync/merge.ts`) merges Missions per id with `mergeMission`, and a passed Mission wins.
- The in-flight changes `trail-stops-and-real-world-missions` and `diary-screen` own the base specs this change builds on. Their code is merged.

## Goals / Non-Goals

**Goals:**
- A Day Skip changes only what opens. It never changes what a Mission asks for or when its check-in opens.
- Owed state is derived from one stored timestamp, so gating, the map, the Diary and sync all agree.
- One `isPlus()` seam that real billing can replace without touching callers.

**Non-Goals:**
- Real billing, prices, receipts, account-bound trials, or collecting details to start a trial.
- Changing Reset Progress. It still clears `trialStartedAt`, so a signed-out user can reset and start a new trial (see Risks).
- Re-locking anything in a free World when Plus ends. Owed Missions and the Stops they opened stay as they are, and only new Day Skips need Plus (ADR 0014). A Plus World does lock again, and an Owed Mission inside it locks with it (decision 2).
- Skips for anything other than a Mission wait (Lessons, Nodes and the Daily Stage have no wait).

## Decisions

**1. Owed = `skippedAt` set and `passedOn` unset.** We add an optional `skippedAt?: string` (ISO) to `MissionState`, and `isOwed(state) = !!state.skippedAt && !state.passedOn`. `skipDay(state, now)` sets it only when the Mission is started, not passed, not already skipped, and its check-in is not yet open (`!canCheckIn`). It leaves `startedAt`, `target`, `skipRun` and `attempts` untouched, so `checkInOpensAt` keeps working unchanged.
*Alternative:* a separate `owed: boolean` that a pass clears. Rejected: it adds a second fact that can drift from `passedOn`. With a timestamp it can't drift, and the Diary can also say when the skip happened.

**2. Split "done for gating" from "done for completion" in `world.ts`.** `doneness()` gains an `owed` flag. A Mission returns `{ done: true, owed: true }` when `isOwed`. `stopLock()` keeps using `.done`, so the trail after an Owed Mission opens. `isWorldComplete()` requires `done && !owed`. `stopStatus()` reports a new `StopState` value, `'owed'`, carrying `opensAt` / `checkInDue`. It reports `'locked'` instead when the Mission's World is locked (a Plus World after the trial), so a debt there is not drawn as actionable. Other locks don't apply to an owed Mission, because the Stops its skip opened stay open. The panel and the unlock banner read the owed Stops from the map model, which already knows about that lock. A separate `owedMissions(world, progress)` helper was dropped in review: it couldn't see the lock and nothing else used it.
*Alternative:* treat Owed Missions as not done and special-case the gate. Rejected: `stopLock` would then need to know about owed state, which spreads the rule across files.

**3. Last Mission of a World is never skippable.** `canSkipDay(missionId, progress, now)` in `missionView.ts` checks that the Mission is waiting and not owed, and that `isLastMissionOfWorld(missionId)` is false. The last Mission gates only the World's completion, and an owed one can't complete a World, so a skip there would have no effect.

**4. Plus = active trial, behind `isPlus(record, now)`.** New `src/shell/plus.ts` with `TRIAL_DAYS = 7` and `isPlus = trialStartedAt <= now < trialStartedAt + 7 days`. A clock earlier than the start counts as not Plus. Callers only ever call `isPlus`. Billing will later swap the body. The trail's gating reads Plus as `progress.plus`, and `progressAt(record, now)` in `plus.ts` fills it in. `App.tsx` passes every record through it before it reaches `celebrationsFor`, `missionEntryOf`, `canSkipDay` or `missionAfterDebrief`, so a Plus World's lock and its unlock celebration agree. The World Map takes the record (`membership`) and calls `isPlus` against its own clock. That clock also wakes at `plusEndsAt`, so Plus Worlds lock on screen when the trial ends.
*Alternative:* a stored `plus` flag. Rejected for now: the user decided an active trial is Plus, and a flag would need a writer that doesn't exist yet.

**5. Free-user skip goes through the paywall with a pending action.** The waiting screen calls `onSkip(missionId)`. `App.tsx` applies it when `isPlus` holds. Otherwise it pushes `{ name: 'paywall', then: { skipMission: missionId } }`. On "Empezar prueba", `passPaywall(r, true, now)` is followed by `applyDaySkip(r, missionId, now)` in the same `update`, and the flow returns to the map. "Quizá más tarde" or close returns to the Mission. A trial that already ended can't be restarted (`passPaywall` already keeps the first start), so the skip is not applied. `canStartTrial` tells `App.tsx` that ahead of time, and the flow returns to the Mission instead of the map. Either way, the Mission reopens on the view `missionEntryOf` gives at that moment, so a check-in that opened while the paywall was up is shown, not the old wait.

**6. `applyDaySkip(record, missionId, now)` in `dogRecord.ts`**, next to `applyMissionCheckIn`. It updates the Mission through `updateMission(…, skipDay)` and appends `activityAt(now, { kind: 'skip', id: missionId })` to the Activity Log. If `skipDay` left the state unchanged, the record is returned as is, with no log entry. Streak, Walk Diary and Learning Attributes are not touched.

**7. Map model.** `MapStop.state` gains `'owed'` (`opensAt`, `opensTomorrow`, `checkInDue`). Next-up selection skips owed Stops on the first pass. If no `next` was found, the first owed Stop with `checkInDue` becomes `next`. An owed Mission that isn't due sets `waitingAt` only when nothing else is open, so the Dog rests there. `MapWorld` gains `owed: { stop, opensAt?, opensTomorrow?, checkInDue? }[]` for the "Cerrar el mundo" panel. `unlockRequirement` gains `owedCount` when the previous World's only missing Stops are owed. `done` counts exclude owed Stops, so "X de Y paradas" doesn't reach Y while debts remain.

**8. Diary.** `ActivityKind` gains `'skip'` and `DayMark` gains `'skip'`. `isActiveDay` ignores `'skip'`, as it ignores `'lesson'`. The day card renders a skip entry with the Mission title. A Walk Diary entry is labelled as closing an owed Mission when it is a `completed` answer and its Mission has `skippedAt` (`closedSkipDate`). This is derived, nothing extra is stored. A passed Mission can't be skipped, so the pass always came after the skip and no time comparison is needed. A struggle or "Hoy no pudimos" given while owed did not close anything, so it gets no note. `DiaryTotals` gains `skips` (count of `'skip'` events) and `owed` (count of `isOwed` Missions, read from the record, not the log).

**9. Sync.** `mergeMission` keeps the earliest `skippedAt` of the two copies. The existing rule that `passedOn` wins makes a passed Mission not owed. Older app versions drop the unknown field when reading. A newer device re-adds it on merge, because the union rule keeps any `skippedAt`. Adding an optional field needs no `RECORD_VERSION` bump.

**10. Celebrations.** No new celebration. `celebrationsFor` already diffs before/after. A skip doesn't set `passedOn`, so no Mission celebration plays. The World unlock celebration fires when the last owed Mission is passed, because `celebrationsFor` compares `isWorldUnlocked` before and after, and that is built on `isWorldComplete`.

## Risks / Trade-offs

- [A signed-out user can Reset Progress and start a fresh 7-day trial] → Accepted for now. Reset wipes all progress, so the gain is small, and the planned "give details to start the trial" step will close it.
- [The device clock can be moved forward to stay inside or outside the trial] → Same exposure as the existing Mission wait. Accepted until there is server-side billing.
- [Plus users may skip every Mission and pile up debts, then face a wall of check-ins at the World's end] → The "Cerrar el mundo" panel lists them, and they all count from their own start, so by the end most are due together. "Move on anyway" still limits the struggle path to two tries.
- [Owed Stops change the "X de Y" counter semantics] → Owed Stops are not counted as done, which matches "the World is not closed yet".
- [Spec order] → This change adds to `activity-diary` and modifies the `world-map-screen` "Node states" text as written by `trail-stops-and-real-world-missions`. Archive both in-flight changes before this one.

## Migration Plan

No data migration. Existing records have no `skippedAt`, so nothing is owed and every passed or grandfathered Mission keeps its state. Rollback: an older build ignores `skippedAt`. Owed Missions then show as waiting again and re-gate the Stops after them, but no progress is lost.

## Open Questions

- Final Spanish copy for "Saltar el día", "Pendiente", "Cerrar el mundo" and the Diary lines. The specs give working text, and it lives in the catalog either way.
