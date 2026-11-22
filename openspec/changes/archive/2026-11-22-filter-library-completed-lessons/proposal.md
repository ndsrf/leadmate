# Proposal

## Why

Currently, the Theory Library displays all lessons available in the active content pack unconditionally—regardless of whether the user has a Plus membership or has encountered the content. Users who have only just begun World 1 can browse and read advanced trail lessons and Plus-exclusive lessons (such as Worlds 6 and 7), spoiling future curriculum before they ever reach it on the trail.

## What Changes

- Filter the Theory Library entries so that trail lessons are only shown for Worlds and Nodes that the user has already completed (or lessons the user has already read).
- Restrict first-week (day-based) lessons in the Library to those whose suggested day has arrived (`day <= currentDay`) or that have already been read, preventing users from reading ahead before their day arrives.
- Ensure lessons belonging to Plus-tier worlds or nodes never appear for free users who have not unlocked/completed those stages.
- Retain previously read lessons in the Library so that completed or read content can always be revisited.
- Display a helpful empty/sparse state message when no lessons (or only today's lesson) are unlocked yet.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `theory-lessons`: Update the Theory Library listing and visibility rules so that trail lessons are only listed for completed worlds, completed nodes, or previously read lessons, and first-week lessons are gated by day or read status, removing the rule that every lesson is openable in the Library at any time.

## Impact

- **Affected Code**:
  - `src/shell/lessons/lesson.ts`: Update `libraryEntries` or add filtering helpers (e.g. `availableLibraryLessons`) taking `DogRecord` or `Progress` (completed nodes, completed worlds, read lessons, lesson day).
  - `src/shell/screens/LessonScreens.tsx`: Update `LibraryScreen` to display filtered lessons and handle empty state if applicable.
  - `App.tsx`: Pass progress/record state to filter lessons before rendering `LibraryScreen`.
  - `src/shell/world.ts`: Provide helper functions to determine which lessons belong to completed worlds or completed nodes.
  - Unit tests in `src/shell/lessons/`, `src/shell/screens/`, and `App.test.tsx`.
