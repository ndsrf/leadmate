# Tasks

## 1. Plus membership

- [x] 1.0 Find whether anything gates Plus Worlds today (`tier: 'plus'` in `src/shell/world.ts` and `mapModel.ts`). If something does, route it through `isPlus`; if nothing does, add `isPlus` to `isWorldUnlocked` for `tier: 'plus'`. Verify with a `world.test.ts` case for a Plus World during and after the trial.
- [x] 1.1 Add `src/shell/plus.ts` with `TRIAL_DAYS = 7` and `isPlus(record, now)`. Verify with new tests in `src/shell/plus.test.ts`: trial started today, day 7 boundary, 8 days later, never started, clock before the start.
- [x] 1.2 Add **Plus membership** to `GLOSSARY.md`: for now, an active 7-day free trial, read only through `isPlus`. Verify the wording matches `specs/plus-membership/spec.md`.

## 2. Mission state: Day Skip and Owed Missions

- [x] 2.1 In `src/shell/missions/mission.ts`, add `skippedAt?: string` to `MissionState`, plus `isOwed` and `skipDay(state, now)`. `skipDay` is a no-op unless the Mission is started, waiting, not passed and not already skipped. Read `skippedAt` in `readMissions`. Verify with new `mission.test.ts` cases: skip while waiting, no skip before start, no skip when the check-in is due, no second skip, target and `checkInOpensAt` unchanged after a skip, a pass clears owed (`completed` and `moveOn`), a struggle keeps it owed.
- [x] 2.2 In `src/shell/missions/missionView.ts`, add `isLastMissionOfWorld` (or put it in `world.ts`) and `canSkipDay(missionId, progress, now)`. Verify with tests that a World's last Mission is never skippable and an Owed Mission is not skippable again.
- [x] 2.3 Add `applyDaySkip(record, missionId, now)` to `src/shell/dogRecord.ts`. It applies `skipDay` and logs an Activity Log `skip` entry, and returns the same record when nothing changed. Verify with `dogRecord.test.ts` that Streak, Walk Diary and Learning Attributes are untouched and exactly one log entry is added.
- [x] 2.4 In `src/shell/sync/merge.ts`, keep the earliest `skippedAt` in `mergeMission`. Verify with new `merge.test.ts` cases: skipped on one device → owed after sync in both directions, and passed on the other device → not owed.
- [x] 2.5 Add **Day Skip** and **Owed Mission** to `GLOSSARY.md`, kept distinct from the "Hoy no pudimos" check-in answer (`skipped` outcome). Add ADR 0014 (`docs/adr/0014-day-skip-defers-the-mission.md`) recording that a Day Skip defers the check-in without removing it. Verify the glossary entries match `specs/mission-day-skip/spec.md`.

## 3. World gating and completion

- [x] 3.1 In `src/shell/world.ts`, `doneness` returns `owed: true` for an Owed Mission. `stopLock` treats it as done, `isWorldComplete` doesn't. `stopStatus` reports the new `'owed'` state with `opensAt` / `checkInDue`. Verify with new `world.test.ts` cases: the Stretch after an Owed Mission is open, the next World stays locked while one Mission is owed, and passing the last Owed Mission unlocks it.
- [x] 3.2 List a World's Owed Missions in World order, leaving out grandfathered and passed Missions. In review this moved into `MapWorld.owed` in the map model, and the `world.ts` helper was dropped. Verify with `mapModel.test.ts`.
- [x] 3.3 Verify with a `celebrations.test.ts` case that passing the last Owed Mission yields the `unlock-world` celebration, and that a Day Skip yields none.

## 4. World Map

- [x] 4.1 In `src/shell/mapModel.ts`, add the `'owed'` `MapStop` state, the next-up rule (owed Stops are next-up only when nothing else is open and their check-in is due), the `waitingAt` fallback, `MapWorld.owed` and `unlockRequirement.owedCount`, and exclude owed Stops from `done`. Verify with new `mapModel.test.ts` cases for each scenario in `specs/world-map-screen/spec.md`.
- [x] 4.2 Add map text to `src/shell/mapText.ts` and `src/i18n/es.trail.ts`: "Pendiente", "Cerrar el mundo", the panel item labels, the owed unlock banner, "Saltar el día" and its Plus accessibility label. Verify `mapText.test.ts`, `i18n.test.ts` and `catalog-usage.test.ts` pass.
- [x] 4.3 In `src/shell/screens/WorldMapScreen.tsx`, draw the owed Stop (distinct mark, label, accessibility label naming the owed state), plus the "Cerrar el mundo" panel at the end of a World region, whose items open the Mission. Verify the `noRawColors` test passes and `npx tsc --noEmit` reports no new errors.

## 5. Skip action and paywall flow

- [x] 5.1 In `src/shell/screens/MissionScreens.tsx`, add a secondary "Saltar el día" action with the Plus badge to the waiting screen, shown only when `canSkipDay`, calling `onSkip`. Verify `npx tsc --noEmit` and the catalog-usage test pass.
- [x] 5.2 In `App.tsx`, wire `onSkip`. A Plus member gets `applyDaySkip`, then the map, scrolled to the new next-up. A free user gets the paywall flow with a pending `skipMission`. "Empezar prueba" there applies `passPaywall` and then `applyDaySkip` in one `update`, and declining just returns. Verify with a pure helper test (e.g. `src/shell/plus.test.ts` or `navigation.test.ts`) that a pending skip is applied only when the trial is active after the paywall.

## 6. Diary

- [x] 6.1 In `src/shell/activity.ts` and `src/shell/diary.ts`, add the `skip` `ActivityKind` / `DayMark`, keep `isActiveDay` ignoring skip-only days, add `DiaryTotals.skips` and `owed`, and add a helper that tells whether a Walk Diary entry closed an Owed Mission (the `completed` answer of a skipped Mission). Verify with new `diary.test.ts` cases: a skip-only day is not active, the totals match the scenario in `specs/activity-diary/spec.md`, and a closing check-in is flagged.
- [x] 6.2 In `src/shell/screens/DiaryScreen.tsx`, render skip entries ("Saltaste la espera · «Mission»"), the skip calendar mark and legend, the "Cierra la misión saltada el …" note on closing check-ins, and the skips and owed totals (owed only when above 0). Add the strings to `src/i18n/es.ts`. Verify the catalog-usage and `noRawColors` tests pass.

## 7. Integration checks

- [x] 7.1 Run `npx jest` and `npx tsc --noEmit` and verify both pass.
- [x] 7.2 In the web build at phone width, as a free user: finish Stretch 1, start its Mission, tap "Saltar el día", check the paywall opens, then decline and confirm the Mission is still waiting. Tap it again, choose "Empezar prueba", and confirm the Mission shows "Pendiente", Stretch 2 is next-up and the Diary shows the skip today.
- [x] 7.3 Continuing as Plus: skip every Mission up to the World's last one and confirm that one has no skip action. Move the device clock to the next day, close each Owed Mission from the "Cerrar el mundo" panel (one "Costó un poco" to check it stays owed), and confirm World 2 unlocks with its celebration only after the last debt is passed.

## 8. Review follow-ups

- [x] 8.1 With an expired trial, "Empezar prueba" on a held skip returns to the Mission instead of the map (`canStartTrial`). "Quizá más tarde" and that return reopen the Mission on `missionEntryOf` at that moment. Verify with `plus.test.ts` cases for `canStartTrial`.
- [x] 8.2 Add `progressAt(record, now)` and route every gating read in `App.tsx` through it (celebrations, Mission entry, `canSkipDay`, `missionAfterDebrief`). The World Map takes `membership`, checks `isPlus` on its own clock and wakes at `plusEndsAt`. Verify with a `celebrations.test.ts` case where a Plus World unlock is celebrated during the trial and not after it, and `plus.test.ts` cases for `progressAt` and `plusEndsAt`.
- [x] 8.3 `stopStatus` reports an Owed Mission as locked when its World is locked. Verify with a `world.test.ts` case.
- [x] 8.4 `closedSkipDate` flags only the `completed` answer of a skipped Mission. Verify with `diary.test.ts`: a struggle while owed is not flagged, and neither is a pass of a Mission that was never skipped.
- [x] 8.5 Run `npx jest` and `npm run typecheck` and verify both pass.

## Workflow follow-up

- Archive `trail-stops-and-real-world-missions` and `diary-screen` before archiving this change, so the `world-map-screen` "Node states" modification and the `activity-diary` additions apply on top of them.
