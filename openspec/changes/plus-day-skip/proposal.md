# Proposal

## Why

Each Stretch ends in a Mission whose check-in opens only on a later day, and "Costó un poco" or "Hoy no pudimos" restarts that wait. A motivated user who finishes a Stretch is stuck until tomorrow, which stops them while they are most engaged. Letting LeadMate Plus members skip the wait keeps them playing and gives free users a concrete reason to start the trial. The real-world practice is not dropped: a skipped Mission still has to be checked in before its World can be completed.

## What Changes

- New **Day Skip** action, "Saltar el día", on a waiting Mission (after "Start mission", after a struggle's Fix and after "Hoy no pudimos"). It defers the Mission: the Stops after it open at once, and the Mission becomes an **Owed Mission** that keeps its target and its check-in.
- Day Skips are a LeadMate Plus benefit: free users have none, Plus members have unlimited ones. Free users see the action with a Plus badge, and tapping it opens the paywall. Starting the trial there applies the skip straight away.
- New **Plus membership** check. For now a user is Plus while their 7-day free trial is active (from `trialStartedAt`). There is no billing yet. The check is a single function that real billing, and the requirement to give details to start the trial, will replace later.
- **Closing a World**: a World completes, and the next one unlocks, only when every Mission in it is passed. Owed Missions do not count as passed. The World's last Mission cannot be skipped, since skipping it would open nothing. When owed Missions are what keeps a World open, the World Map shows a "Close the World" panel listing them, each with its check-in state.
- An Owed Mission is checked in like any other Mission: same later-day rule, answers, Fix, easier target and "Move on anyway". Passing it clears the debt. It can no longer be skipped, because it gates nothing.
- The World Map draws Owed Missions in their own state ("Pendiente"), separate from waiting and done.
- The Diary logs each Day Skip on its day, names the Mission and counts skips in the totals. A skip alone does not credit the Streak. A later check-in of an Owed Mission appears like any check-in and is marked as closing a skipped Mission.
- Sync keeps a Mission owed if either device skipped it. A pass still wins.

## Capabilities

### New Capabilities
- `plus-membership`: whether the user has LeadMate Plus right now (for now, an active free trial) and how features ask for it.
- `mission-day-skip`: the Day Skip on a waiting Mission, Owed Missions, how they gate and how they are closed, and the rule that a World completes only when no Owed Missions are left.

### Modified Capabilities
- `world-map-screen`: Owed Mission stop state, the Day Skip action on the waiting Mission sheet and the "Close the World" panel.
- `activity-diary`: Day Skip entries in the Activity Log and the Diary, plus the skip count in the totals. *(This capability is introduced by the in-flight `diary-screen` change, so archive that change first.)*
- `account-sync`: the merge rule for a Mission's owed state.

## Impact

- `src/shell/missions/mission.ts`: `MissionState.skippedAt`, `skipDay`, `isOwed`, reading and merging.
- `src/shell/world.ts`: in `doneness`, an Owed Mission is done for gating but not for `isWorldComplete`. Also adds the last-Mission exclusion, and an owed Mission is locked with its World when that World locks again.
- `src/shell/mapModel.ts`, `src/shell/mapText.ts`, `src/shell/screens/WorldMapScreen.tsx`, `src/shell/screens/MissionScreens.tsx`: the owed state, the skip button and the Close the World panel.
- New `src/shell/plus.ts` (`isPlus`, `progressAt`, `plusEndsAt`, `canStartTrial`). `App.tsx` routes a free user's skip through the paywall and back, and passes every record through `progressAt` before gating reads it.
- `src/shell/activity.ts`, `src/shell/diary.ts`, `src/shell/screens/DiaryScreen.tsx`: the `skip` activity kind.
- `src/shell/dogRecord.ts`: merge and record version bump. Catalog strings go in `src/i18n/es.trail.ts`.
- `GLOSSARY.md`: Day Skip, Owed Mission, Plus membership.
- Depends on the in-flight `trail-stops-and-real-world-missions` and `diary-screen` changes. Their code is merged, but their specs are not archived yet.
