# Tasks

## 1. Core Filtering Logic & Helpers

- [x] 1.1 Implement `unlockedLibraryLessons` in `src/shell/lessons/lesson.ts` filtering first-week lessons by day/read status, and trail lessons by completed worlds, completed nodes, or read status. Verify with unit tests in `src/shell/lessons/lesson.test.ts`.
- [x] 1.2 Add helpers in `src/shell/world.ts` (e.g. `nodesOfStretchContainingLesson` or `isLessonStretchCompleted`) to check if any node in a lesson's stretch is completed. Verify with unit tests in `src/shell/world.test.ts`.

## 2. Localization & Empty State

- [x] 2.1 Add `library.empty` catalog key in `src/i18n/en.ts` and `src/i18n/es.ts`. Verify by running `npm run typecheck`.
- [x] 2.2 Update `LibraryScreen` in `src/shell/screens/LessonScreens.tsx` to render an empty-state message when both `lessons` and `seenFixes` are empty. Verify with component tests in `src/shell/screens/LessonScreens.test.tsx`.

## 3. App Integration & Wiring

- [x] 3.1 Update `App.tsx` under the `library` flow route to pass `unlockedLibraryLessons(LESSONS, record, lessonDay(record, new Date()), worlds)` to `LibraryScreen`. Verify with an integration test in `src/App.test.tsx` that a new user sees only today's first-week lesson and no future or Plus trail lessons.
- [x] 3.2 Add test cases in `src/App.test.tsx` confirming that completing a node unlocks its stretch lessons in the Library, and completing a World unlocks all of its lessons.

## 4. Verification & Validation

- [x] 4.1 Run unit and integration tests across affected areas (`npx jest src/shell/lessons src/shell/screens/LessonScreens.test.tsx src/shell/world.test.ts src/App.test.tsx`). Verify all tests pass.
- [x] 4.2 Run `npm run typecheck` and verify clean TypeScript compilation without errors.
