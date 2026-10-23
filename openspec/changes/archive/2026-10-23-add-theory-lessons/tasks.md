## 1. Lesson data and pure logic

- [x] 1.1 Add `src/shell/lessons/lesson.ts` with `LessonDef`, the block union (`heading|text|image|video|tip`) and `lessonDay(record, now)` (calendar days, local timezone, onboarding day = Day 1, null before `firstStageCompletedAt`), `todaysLesson(lessons, readIds, day)` (oldest unread due). Verify: `lesson.test.ts` covers day 1/3/10, no Day before the first Stage, catch-up (day 5 with 1-3 unread -> day 1), same-day 23:50/00:10 boundary, nothing-for-today, reading ahead, unknown read ids.
- [x] 1.2 Add `videoEmbedUrl(id)` / `isAllowedVideoHost` in `src/shell/ui/media.ts` (YouTube nocookie only). Verify: `media.test.ts` accepts valid ids, rejects other hosts, bad ids and injection characters.
- [x] 1.3 Add `readLessons: string[]` to `DogRecord`, bump `RECORD_VERSION`, default in `migrateRecord`, union in `sync/merge.ts` (and take the earliest non-null `onboarding.firstStageCompletedAt`), clear in `reset.ts`. Verify: `dogRecord.test.ts`, `merge.test.ts` (devices A {1,2} + B {2,3} -> {1,2,3}; earliest first-Stage time wins) and `reset.test.ts` (read set and anchor cleared) pass.

## 2. Placeholder content

- [x] 2.1 Add `src/shell/lessons/content.ts` with 5 Lessons for days 1-5 (e.g. calm leash basics, reading body language, the "smile" slack leash, marking and rewarding, sniffing and decompression), each mixing text, an image and a video with `placeholder: true`; and `lessonMedia.ts` listing the YouTube ids. Verify: a test asserts ids unique, days 1..5 covered, every block key exists in `es.ts`, every video id passes `videoEmbedUrl`, every Lesson's final block is the "Done" action, every image and video block has alt and caption keys.
- [x] 2.2 Add the Spanish strings (`lesson.*`, `library.*`, `media.badge.placeholder`, aria labels) to `src/i18n/es.ts`. Verify: `i18n.test.ts` and `catalog-usage.test.ts` pass.
- [x] 2.3 Draw placeholder lesson illustrations with `react-native-svg` in `src/shell/ui/lessonArt.tsx` in the design-system style (flat fills, ink outline, Migas), tokens only. Verify: `noRawColors.test.ts` passes; visual check on web and a phone.

## 3. Media components

- [x] 3.1 Add `LessonImage` (bundled art or remote URL, falls back to `MediaPlaceholder`, caption + badge). Verify: unit test of display choice and manual offline check.
- [x] 3.2 Add `LessonVideo.tsx` (WebView) and `LessonVideo.web.tsx` (iframe): bundled-art poster + play with a "Plays from YouTube" label, load on tap, loading/error state with retry, "Open video" fallback via the system browser, 16:9, caption and Provisional badge. Verify: no network call before tap (dev tools / log); airplane-mode shows fallback with retry; plays on web and on a device.

## 4. Screens and navigation

- [x] 4.1 Build `LibraryScreen` (cards with day pill, title, minutes, read tick + label, "for today" first) in `src/shell/screens/LessonScreens.tsx` using `Screen`, `Panel`, `Badge`, `Button`; a Lesson-level placeholder badge on provisional cards. Verify: renders at 320 pt without clipping, targets >= 44 pt, 4.5:1 contrast, screen-reader labels.
- [x] 4.2 Build `LessonScreen` (block renderer, reading progress bar, "Done" is the last non-sticky block and marks read and returns to the Library, early exit leaves unread). Verify: `lessonRun` pure-logic test plus manual walkthrough of all 5 Lessons.
- [x] 4.3 Wire `library`/`lesson` flows in `App.tsx` and a "Biblioteca" `Chip` (before Settings; the chip row wraps at narrow widths) with an unread dot + label on `WorldMapScreen`; map scroll position preserved on return. Verify: `navigation.test.ts` updated; manual: open, read, back, map unchanged.
- [x] 4.4 Reduced motion and wide-screen pass (static twins, readable column). Verify: toggle reduced motion, check at 1280 px.

## 5. Docs and validation

- [x] 5.1 Add `docs/adr/0011-embed-youtube-video-in-lessons.md` (nocookie, on-demand, no bundled video) (Lesson and Theory Library are already in `GLOSSARY.md`). Verify: file present and cross-linked to ADR 0008.
- [x] 5.2 Run `npm test`, type-check and lint, then `openspec validate add-theory-lessons`. Verify: all green.
