# Proposal

## Why

Every Lesson video is broken on phones: the YouTube embed answers "Error de configuración del reproductor de vídeo — Error 153". YouTube now refuses embeds that arrive without an identifying origin/referrer, and the native WebView loads the bare embed address with neither. The videos are also third-party stand-ins that do not match the app's art and carry a "Provisional" badge. That badge also appears on Lesson images, Missions and Fixes, and makes the content look unfinished. We want Lessons to combine short animations of our own with real YouTube demonstrations. We generate the animations with an AI video model (Gemini / Veo) from prompts we write, in the paper-cut style of the Lesson illustrations.

## What Changes

- **Fix YouTube playback on phones**: the native player loads the embed inside a small HTML page whose fixed HTTPS origin is a domain we control (our Supabase project origin), so YouTube receives an origin and a referrer. The embed address also carries that origin. The web iframe already sends a referrer and keeps working.
- **New source, hosted Lesson Animations**: short, silent MP4 clips (about 8 s, 16:9) under an explicitly configured media base (`EXPO_PUBLIC_MEDIA_BASE`, empty by default; in practice a public Supabase Storage bucket) at `animations/<key>.mp4`. Phones play them with a native video player (`expo-video`) and the web with an HTML `<video>`. They play inline, silent and looping, and pause when the app leaves the foreground. Each has a bundled poster drawn from its opening pose.
- **BREAKING (data)**: a Lesson Video names its source: `{ kind: 'animation', key }` or `{ kind: 'youtube', id }`. A Lesson can hold several Lesson Videos: a Lesson Animation right after the "how to do it" steps, and a YouTube video in today's slot after the do / don't comparison. Reading time counts a Lesson Animation like an illustration (10 s) and a YouTube video as today (30 s).
- Both sources load only after the user taps play. A failure shows the themed placeholder with retry. Only YouTube blocks show "Se reproduce desde YouTube" and "Abrir vídeo". A build with no media base leaves animation blocks out.
- All five first-week Lessons get a Lesson Animation; no other Lesson does in this change. Their YouTube video stays as the second video, now working and without a badge.
- **YouTube videos in the user's language**: a Lesson's YouTube id is keyed by language (`youtube: { es: '<id>' }`), and a Lesson shows a YouTube video only when it has one in the active language, never one in another language. The English stand-ins are replaced by Spanish videos for `calm-leash`, `body-language` and `smile-leash`; `marking-rewarding` and `sniffing-decompression` have no Spanish video yet and show none until one is found.
- **Remove every "Provisional" / "Texto provisional" badge**: from Lesson cards and tops, Lesson images, Lesson Videos, Mission briefs and Fix pages. The `placeholder` flags on Lessons, Lesson blocks, Missions and Fixes are removed. The themed "Contenido en camino" placeholder for missing or failed media stays, and so does the internal Primer-media flag that drives it. Content that is still a stand-in is tracked in a doc instead (`docs/content/stand-in-content.md`).
- **New prompt book**: `docs/content/lesson-animation-prompts.md`. It holds a shared style preamble, the things to avoid, the Gemini settings, file naming and upload steps, and one ready-to-paste prompt per animation.
- **Animation Timelines and subtitle Lines**: every Lesson Animation has a hosted Animation Timeline at `animations/<key>.json`, next to its clip, holding the clip's beats and its timed **Lines** (the short words the Person says, such as «vamos» or «bien»). While the clip plays, the app draws the current Line as a subtitle over it, with the text taken from the catalog, so clips stay text-free and translatable. A Line can be flagged as the Handler's Cue or the Marker word; that is the hook a later change uses to play the user's own recording at that moment. A missing or invalid timeline only drops the subtitles. Re-timing a clip is an upload, not an app release. The repo keeps a checked copy of each timeline in `docs/content/animations/<key>.json`.
- A new ADR supersedes ADR 0011 and records why the YouTube origin must be a domain we control.
- **Out of scope**: Instagram. It has no supported embedded player: the `/embed` page usually shows a poster and "Watch on Instagram", and oEmbed needs a Meta app token. Also out of scope: playing any audio in a Lesson Animation, including the user's recorded Cues; the Lines carry what that later change needs.

## Capabilities

### New Capabilities
- `lesson-animations`: covers our hosted Lesson animation clips. It defines how a clip is named and addressed, the format clips must have, its Animation Timeline and subtitle Lines, and the prompt book that produces them.

### Modified Capabilities
- `remote-media-content`: inline video now covers two sources, hosted animations and YouTube. YouTube embeds must work in the native player. Only the media base and the privacy-enhanced YouTube host may load.
- `theory-lessons`: drops "Placeholder content is visibly provisional" and "Final Lessons carry no placeholder badge", so no Lesson content shows a placeholder badge. A Lesson may hold more than one video block, and its YouTube video is always in the user's language.
- `real-world-missions`: Missions and Fixes can no longer be flagged placeholder, and the "Placeholder Mission" scenario now requires unfinished Mission content to show no badge.

## Impact

- Code:
  - `src/shell/ui/LessonVideoCard.tsx`, `LessonVideo.tsx`, `LessonVideo.web.tsx`, `media.ts` (and its test), `LessonImage.tsx`
  - `src/shell/lessons/{lesson,content,lessonMedia,libraryText}.ts`
  - new `src/shell/lessons/animationTimeline.ts`: parses and validates an Animation Timeline and picks the active Line (`activeLine`)
  - `src/shell/missions/{mission,content}.ts`
  - `src/shell/screens/{LessonScreens,MissionScreens}.tsx`
  - `src/i18n/es.ts`: adds `lesson.<n>.animation.alt/caption`; adds `lesson.<n>.animation.line.<id>`; rewrites `lesson.<1-3>.video.alt/caption` for the Spanish videos and drops `lesson.<4-5>.video.*`; drops `media.badge.placeholder` and `lesson.placeholder`
  - `src/shell/lessons/conformance.test.ts`: now covers every Lesson, and checks every animation key
- Art: five new bundled posters `assets/lessons/<lesson>-anim.png`, rendered by `scripts/render-lesson-art.mjs`
- Dependency: adds `expo-video`, installed with `npx expo install` so the version matches SDK 58. `react-native-webview` stays.
- Config: new `EXPO_PUBLIC_MEDIA_BASE` env var, plus a public storage location holding `animations/<key>.mp4` and `animations/<key>.json`.
- Docs: new `docs/content/lesson-animation-prompts.md`; new `docs/content/animations/<key>.json` (repo copies of the timelines); `GLOSSARY.md` gains Animation Timeline and Line; new `docs/content/stand-in-content.md`; a new ADR superseding `docs/adr/0011-embed-youtube-video-in-lessons.md`; `docs/content/lesson-guide.md` updated (drop the `placeholder: true` step, add how to add an animation, link the stand-in list).
