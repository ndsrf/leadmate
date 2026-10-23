## Why

Theory today lives only inside Node Primers: 30-60 seconds of cards the user meets just before a Stage. New users in their first days have nothing to read, watch or revisit between walks, and the existing media support is placeholder-only (no playable video, no real images). We want a small Theory Library of rich lessons (text, images, video) to prove the concept and enrich the first-week experience.

## What Changes

- Add a **Theory Library**: a short list of standalone Lessons, each a sequence of blocks (heading, text, image, video, tip), reachable from the World Map.
- Ship **5 placeholder Lessons** for the first days (suggested order, "Day 1" to "Day 5"), all marked as placeholder content with clearly swappable media.
- Add **inline video**: a Lesson video block plays an embedded YouTube video in place (native WebView, web iframe), with a themed fallback when offline or unavailable.
- Add **images** in Lessons from bundled illustrations or remote URLs, falling back to the existing themed placeholder.
- Track which Lessons were read (local-first, synced like other record fields) and highlight "today's" suggested Lesson.
- All Lesson screens follow the Paper Meadow design system (tokens, Fredoka titles, ink-outlined panels with offset shadows, 44pt targets, 4.5:1 contrast, reduced-motion twins).
- Out of scope: real editorial content and licensed videos, quizzes after Lessons, Lesson-driven unlocks, paywall gating, a CMS.

## Capabilities

### New Capabilities
- `theory-lessons`: the Theory Library, Lesson structure and block types, suggested first-week order, read tracking, offline-tolerant presentation, design-system conformance.

### Modified Capabilities
- `remote-media-content`: add inline embedded video playback (not only a "full guide" link) with offline/unsupported fallbacks.
- `world-map-screen`: add a persistent Library entry that opens the Theory Library and shows an unread indicator.

## Impact

- Code: new `src/shell/lessons/` (data, pure helpers), `src/shell/screens/LessonScreens.tsx`, new `LessonVideo` (native + `.web.tsx`) and `LessonImage` in `src/shell/ui/`, catalog strings in `src/i18n/es.ts`, route/flow wiring in `App.tsx` and `navigation.ts`, `read` lesson ids on `DogRecord` (`dogRecord.ts`, sync merge by union; `resolve()` also keeps the earliest `firstStageCompletedAt`).
- Dependencies: none new (`react-native-webview` is already present; web uses an iframe).
- Network: YouTube embeds load only when the user opens a Lesson video; core app stays offline-first (ADR 0008).
- Docs: a short ADR for embedding YouTube rather than bundling video.
