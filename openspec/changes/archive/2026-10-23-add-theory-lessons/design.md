## Context

- Theory exists only as Node Primer cards (`primerCards`, `NodeMedia`, `MediaPlaceholder`); video renders as a placeholder, "full guide" opens `InAppBrowserModal` (native WebView; web shows "unsupported"). See ADR 0008 (web-hosted tutorials, offline-first).
- Shell screens are React Native + NativeWind with tokens in `src/shell/ui/tokens.json` generated from the Paper Meadow design system; `noRawColors.test.ts` forbids raw colours. Text comes from `src/i18n/es.ts` with Spanish fallback.
- Navigation is the pure `routeFor` plus `flow` state in `App.tsx`; the World Map holds the status chips (Streak, Daily Stage, Settings). The Dog record is versioned, migrated in `migrateRecord`, and merged on sync (`completedNodes` by union).
- Design reference: the Node-loop board of the design system (Primer card: pill, Fredoka h1, illustration/video slot with a "Vídeo · 0:20" pill, `panel` sections with icon tiles, quiet text button, primary full-width button).

## Goals / Non-Goals

**Goals:**
- Prove the concept end to end: Library, Lesson with text + image + YouTube video, read tracking, first-week order.
- Reuse the existing media, theme and record infrastructure; add no dependency.
- Lesson content as plain data so real content can replace placeholders without code changes.

**Non-Goals:**
- Real editorial content, licensing, translations beyond Spanish.
- Quizzes, unlocks, paywall gating, remote CMS, downloading videos for offline.
- Changing Node Primers (they keep their own cards; they may link to a Lesson later).

## Decisions

1. **Lessons are data, separate from Nodes.** `LessonDef { id, title, day, minutes, placeholder?, blocks[] }`, blocks a discriminated union (`heading | text | image | video | tip`), all text as catalog keys. Alternative: reuse `PrimerCard`s; rejected because Primers are 30-60 s, tied to a Node loop and have one media slot.
2. **Day-based suggestion, no locking.** "Day N" counts calendar days in the user's local timezone, with the day `onboarding.firstStageCompletedAt` falls on as Day 1 (same notion of "day" as the Streak), computed by a pure function taking `now`. There is no record-creation fallback (the record has no `createdAt`): until `firstStageCompletedAt` is set there is no Day and nothing is "for today", though the Library stays fully browsable. "For today" is the oldest unread Lesson with `day <= today` (a catch-up queue), so it switches off once the user is caught up. Alternative: gate by day; rejected, it blocks curious users and needs server time.
3. **Video: YouTube nocookie embed, loaded on demand.** Poster + play button first (no request to the host, privacy and offline friendly); on tap, native renders `WebView` with `https://www.youtube-nocookie.com/embed/<id>` (fixed hard-coded parameters, none passed through), web renders an `iframe` (`LessonVideo.tsx` / `LessonVideo.web.tsx`, mirroring `InAppBrowserModal`/`SimView.web`). Only a bare 11-character video id (`[A-Za-z0-9_-]{11}`) is stored in data; the URL is built in one pure function that enforces the allow-list. Alternatives: bundled mp4 (rejected, ADR 0008 size), `react-native-youtube-iframe` (rejected, new dependency for a proof of concept).
   The poster is bundled or drawn art (never the YouTube thumbnail, which would contact the host) and carries a "Plays from YouTube" label, the user's notice before the tap (there is no privacy screen to hold it). "Open video" uses the system browser (`Linking.openURL` on native, a new tab on web), not `InAppBrowserModal`, which is unsupported on web and likely to fail where the embed failed.

4. **Images: bundled `require` assets or remote URL, same fallback.** Placeholder images are drawn with `react-native-svg` using the design system illustration style (flat fills, ink outline, Migas the dog) so no binaries are needed; remote URLs fall back through the existing `mediaDisplay`.
5. **Placeholder honesty.** `placeholder: true` on a media block adds a "Provisional" badge (reuses `Badge`), so QA and users can tell stand-ins from final content. A Lesson-level `placeholder` flag does the same for its text: a badge on its Library card and at the top of the Lesson. The feature ships with the badges; removing them is a data change per Lesson or block. The five placeholder videos use freely available, embeddable YouTube dog-training videos chosen at implementation time and listed in one `lessonMedia.ts`; they are swappable by editing ids.
6. **Read state on the Dog record.** `readLessons: string[]`, bump `RECORD_VERSION`, default `[]` in `migrateRecord`, merge by union (same as `completedNodes`), cleared by progress reset together with the Day anchor (a reset Dog restarts at Day 1, nothing read). Read is one-way: no "mark unread". Unknown ids are kept (forward compatibility). Onboarding currently travels whole with the later-`updatedAt` record, so `resolve()` also takes the earliest non-null `firstStageCompletedAt`, so a second device never restarts the first week. "Done" is the last block of the column (not sticky), so reaching it implies reading to the end; the progress bar is visual only.
7. **Navigation.** New flow kinds `library` and `lesson` in the existing `flow` state (no new route names), World Map gets a `Chip` "Biblioteca" (before Settings) with a dot and label when a Lesson is for today; the chip row wraps onto a second line at narrow widths instead of clipping. Back always returns to the map.
8. **Layout and design system.** Reuse `Screen`, `Panel`, `Badge`, `Chip`, `Button`, `ProgressBar`; Lesson reading column `max-w` as other screens; Library card per Lesson = `Raised` panel with day pill, Fredoka title, minutes, read tick plus label. Per-block spacing from `space` tokens only. A "reading progress" bar uses the existing `ProgressBar` and a static twin under reduced motion.

## Risks / Trade-offs

- [YouTube video removed, region-blocked or embed disabled] → on-error fallback to themed placeholder + "Open video" link; ids in one file for quick swap.
- [Third-party embed tracks users] → `youtube-nocookie.com`, load only after tap, mention in privacy copy.
- [Native WebView video inside ScrollView is janky on Android] → fixed 16:9 height, `allowsInlineMediaPlayback`, no nested scroll; verify on device.
- [Record version bump affects sync with older clients] → additive field with default; old clients drop it, union merge on newer ones restores it.
- [Placeholder text is not real dog-training advice] → content stays generic and short, marked provisional; real content is a follow-up.
- [Spanish-only strings] → all keys in catalog; fallback rule unchanged.

## Migration Plan

Additive. `migrateRecord` upgrades old records with `readLessons: []`. Rollback: hide the Library chip; the extra field is ignored.

## Open Questions

- Which exact YouTube videos replace the placeholders (decided at implementation, any embeddable dog-training clip).
- Whether Primers should later deep-link to a Lesson (separate change).
