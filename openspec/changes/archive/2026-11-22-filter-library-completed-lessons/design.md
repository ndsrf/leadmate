# Design

## Context

In the current implementation, `App.tsx` passes the entire resolved `LESSONS` list (43 lessons) to `LibraryScreen`. The Theory Library displays every lesson unconditionally, allowing any user—even a new user on World 1 without LeadMate Plus—to browse and read advanced trail lessons and Plus-exclusive lessons (e.g., World 6 Recall and World 7 Cafe).

This violates curriculum pacing and reveals content before the user encounters it. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Provide a pure selector `unlockedLibraryLessons` that filters the lesson catalog based on the Dog's progress and current lesson day.
- Restrict trail lessons in the Library to those whose World or Node has been completed (or lessons already read).
- Restrict first-week (day-based) lessons in the Library to those whose suggested day has arrived (`day <= currentDay`) or that have already been read.
- Naturally prevent Plus-tier lessons from appearing for free users who have not completed those Plus worlds/nodes.
- Ensure that once a lesson has been read by the user, it remains accessible in the Library for revisiting.
- Provide an empty state in the Library screen when no lessons are unlocked yet.

**Non-Goals:**
- Modifying how stops unlock on the World Map trail (trail navigation and stop unlocking continue to follow existing gating rules).
- Altering the "Tus ajustes" (Fixes) section in the Library.
- Changing content pack schemas or `LessonDef` data structures.

## Decisions

### Decision 1: Pure filtering function `unlockedLibraryLessons`
We will introduce `unlockedLibraryLessons` in `src/shell/lessons/lesson.ts` (utilizing helpers from `src/shell/world.ts`):
```ts
export function unlockedLibraryLessons(
  lessons: readonly LessonDef[],
  progress: Progress,
  day: number | null,
  worlds: readonly WorldDef[] = WORLDS,
): LessonDef[]
```
**Rationale**: Keeps filtering logic decoupled from React rendering, making it easily unit-testable against edge cases (new user, mid-world user, completed-world user, Plus vs free user).
**Alternatives considered**: Filtering inside `LibraryScreen`. This would tie progression logic to component state and make unit testing more cumbersome.

### Decision 2: Trail Lesson unlock criteria
A trail lesson is included in the Library if and only if:
1. `progress.readLessons.includes(lesson.id)` (guarantees that any lesson already read on the trail can be revisited), OR
2. The lesson belongs to a World that is complete (`isWorldComplete(world, progress)` or `progress.completedWorlds?.includes(world.id)`), OR
3. Any Node in the lesson's Stretch has been completed (`progress.completedNodes.includes(nodeId)`), OR
4. The Stretch contains no nodes (e.g. World 7 Stretch 3, or Home Behaviour biting-others) and its Mission has been started or passed (`progress.missions[missionId]?.startedAt || progress.missions[missionId]?.passedOn`).

**Rationale**: Each Stretch represents a coherent curriculum module ending in a Node practice and Mission. Once a user completes a Node in that Stretch, all associated theory lessons for that stretch become available in the Library for reference.
**Alternatives considered**: Unlocking lessons only after the entire World is complete. Rejected because the user specifically requested unlocking for completed nodes as well as completed worlds.

### Decision 3: First-week (day-based) lessons gating
Lessons with `lesson.day !== undefined` are unlocked if:
1. `day !== null && lesson.day <= day`, OR
2. `progress.readLessons.includes(lesson.id)`

**Rationale**: First-week lessons are designed to be pacing guides between walks. Gating by `lesson.day <= day` prevents reading ahead to Day 5 on Day 1 while keeping the "for today" mechanic working properly.

### Decision 4: Plus content gating
Plus worlds (Worlds 6 and 7) have `tier: 'plus'`. Free users cannot unlock or complete these worlds or their nodes because `isWorldUnlocked` enforces `world.tier === 'plus' && !progress.plus`. As a result, Plus lessons are automatically hidden from free users without requiring special-cased license checks inside the lesson filter itself. If a user with a Plus subscription completed Plus nodes and their subscription expires later, their previously completed lessons remain readable in the Library.

### Decision 5: Library empty state
When a user opens the Library before Day 1 (before completing the first stage) and with no completed nodes:
- `unlockedLibraryLessons` returns an empty array.
- `LibraryScreen` renders a friendly empty-state card using `t('library.empty')`, encouraging the user to progress on the trail to unlock lessons.

## Risks / Trade-offs

- **[Risk]** Existing users on active trails might lose access to unread trail lessons from future worlds they previously browsed in the Library.
  → **Mitigation**: Any lesson the user actually opened and finished reading is stored in `readLessons` and remains permanently unlocked in the Library.

- **[Risk]** Satellite lessons (e.g. Puppy Track) or custom Home Concerns might not map to a standard trail stretch.
  → **Mitigation**: The helper checks Home Stretches and includes satellite lessons if read or if their associated satellite stops are cleared.

## Migration Plan

No database migration or `DogRecord` version bump is needed. The change is purely a view-level filter based on existing fields (`completedNodes`, `completedWorlds`, `readLessons`, `missions`, `onboarding`). Existing users who have completed nodes will immediately see all lessons corresponding to their progress.
