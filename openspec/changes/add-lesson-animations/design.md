# Design

## Context

Today a Lesson has at most one video block: `{ type: 'video', videoId, poster, alt, caption, placeholder? }`. `theoryLesson()` adds it after the do / don't comparison when `spec.video` is set. The five ids live in `lessonMedia.ts`. `LessonVideoCard` is shared by native and web and handles the poster, the play tap, the loading state, the failure placeholder with retry, and "Abrir vídeo". Each platform passes a `renderPlayer`: a WebView on native (`LessonVideo.tsx`) and an iframe on the web (`LessonVideo.web.tsx`).

Why the native embed fails: the WebView loads `source={{ uri: embedUrl }}` directly, so YouTube receives no `Referer` and no origin. YouTube now rejects such embeds with Error 153. The web iframe sends the page's origin, which is why the web build plays.

Placeholder badges come from `placeholder` flags in five places:
- `LessonDef.placeholder`
- image and video blocks (`placeholder?`)
- `Mission.placeholder` and `Fix.placeholder` (`src/shell/missions`)
- the screens and cards that render `media.badge.placeholder` / `lesson.placeholder`

`NodeMedia.placeholder` (Primer cards) shows no badge. It only drives the "Contenido en camino" fallback, so it is left alone. `conformance.test.ts` skips Lessons that are flagged placeholder. Once the flags are gone it covers every theory Lesson.

Lesson art is rendered to `assets/lessons/<name>.png` (640×360) from SVGs built with a shared kit of the mascot Dog and the Person, in the `tokens.json` palette (`scripts/render-lesson-art.mjs`). The same kit draws a dedicated poster for each Lesson Animation (Decision 7).

The app already stores the user's own spoken Cues and Voice Packs (`src/shell/voice.ts`: `customCues`, `resolveCue`). This change does not play audio, but the subtitle Lines (Decision 8) are shaped so a later change can play those recordings at the right moment.

Terms: a **Lesson Video** is a video block, playing either a **Lesson Animation** (our hosted clip) or a YouTube video (see `GLOSSARY.md`). An **Animation Timeline** records when the beats of a Lesson Animation happen and its **Lines**: the timed words the Person says, shown as subtitles. "Line" is used rather than "cue", because Cue already means the Handler's signal.

## Goals / Non-Goals

**Goals:**
- One video block type with two sources, sharing the poster → play → load → fail/retry flow already in `LessonVideoCard`.
- YouTube works in the native app with the smallest change to the existing embed.
- Clip addresses can only be built from configuration plus a validated key (same posture as the 11-character id rule).
- The prompt book is good enough that the user can paste each prompt into Gemini and get a usable clip on the first or second try.

**Non-Goals:**
- Instagram, or any other host.
- Caching clips for offline use. Animations need a network, like YouTube today.
- Playing sound in a Lesson Animation, including the user's recorded Cues (Decision 8 leaves the hook), and per-language variants of a clip. Subtitle Lines are drawn by the app and translated through the catalog.
- An upload pipeline or CMS. Clips are uploaded by hand to the bucket.
- Lesson Animations for any Lesson other than the five first-week ones (trail theory Lessons, How-to-play Lessons). Adding one later is a `lessonMedia.ts` entry, a poster scene and a prompt book entry, with no code change.

## Decisions

### 1. Video block holds a tagged source
`{ type: 'video', source: { kind: 'animation'; key: string } | { kind: 'youtube'; id: string }, poster, alt, caption }`. The alternative was two block types (`animation`, `video`). We rejected it because both sources share all of the card UI and the reading-time rule, so one type with a discriminant keeps `LessonBlocks` and `libraryText` unchanged in shape.

Reading time is the one place the kinds differ: `libraryText.ts` counts a Lesson Animation at 10 s (like an illustration, since the clip is about 8 s) and a YouTube video at the existing 30 s.

`TheorySpec` gets `animation?: string` (a key, placed right after the steps) and `video?: string` (a YouTube id, in the existing slot). The animation block's poster is `<lesson>-anim` (Decision 7); YouTube blocks keep the generic `poster`. Catalog keys are `<prefix>.animation.alt/.caption` and the existing `<prefix>.video.alt/.caption`. `lessonMedia.ts` becomes the one file that maps each Lesson id to `{ animation?: key, youtube?: { [language]: id } }` (Decision 9).

### 2. Clip address = base + `/animations/` + key + `.mp4`
The address is built in `media.ts` (`animationUrl(key)`). It requires:
- an `https:` `EXPO_PUBLIC_MEDIA_BASE`, with trailing slashes trimmed
- a key matching `^[a-z0-9]+(-[a-z0-9]+)*$`

If either check fails, it returns `null`. `animationTimelineUrl(key)` builds the clip's timeline address the same way, ending in `.json` (Decision 8). `theoryLesson()` drops animation blocks when no base is configured, the same pattern as `TUTORIAL_BASE` in `nodes/content.ts`, so reading time stays honest. Keys are code constants, so a bad key is caught at test time: `conformance.test.ts` asserts `isAnimationKey()` for every key in `LESSON_MEDIA`. The runtime guard stays as defence in depth.

The intended host is a **public Supabase Storage bucket** `lesson-media`, because the project already has a Supabase project and migrations. That makes the base `https://<project>.supabase.co/storage/v1/object/public/lesson-media`. Any static HTTPS host (Cloudflare R2, GitHub Pages) works the same, and nothing is Supabase-specific in code. `EXPO_PUBLIC_MEDIA_BASE` stays explicit and empty by default; it is not derived from `EXPO_PUBLIC_SUPABASE_URL`, because a build with sync configured but no clips uploaded would then show animation blocks that all fail.

Clips are replaced by overwriting the object under the same key, uploaded with a short `cache-control` (about 1 h, e.g. `max-age=3600`), so a fix reaches users within the hour without an app release. A clip's timeline (`<key>.json`) is overwritten together with it, under the same caching. A new key would need a release. We rejected bundling the clips: five clips of 2–5 MB each would add 10–25 MB to the app, which is the problem ADR 0008 avoided.

### 3. Native animation player: `expo-video`
`expo-video` is the maintained Expo player: `useVideoPlayer` plus `VideoView`, with `loop`, `muted` and pause/play. It is installed with `npx expo install expo-video` so the version matches SDK 58. The web build uses a plain `<video muted loop playsInline autoPlay>` created only after the tap, mirroring the iframe file. We rejected playing MP4 in the WebView: it is heavier, has worse error reporting and needs JS injection to pause. `expo-av` is deprecated.

`expo-video` is a native module, so a new dev-client / EAS build is required. Expo Go has it built in.

Background pause: an `AppState` listener calls `player.pause()`. This is a sibling of `usePauseMediaInBackground`, which stays for WebViews. Tap toggles play/pause. Errors (`statusChange` → `error`, including 404) map to the card's existing `onError`, and `readyToPlay` maps to `onLoaded`. For subtitles, the player sets `timeUpdateEventInterval = 0.1`, and its `timeUpdate` event reports `currentTime` to the card (Decision 8). The web uses the `<video>` `timeupdate` event, which fires about 4 times a second; that is enough for subtitles.

### 4. YouTube fix: load the iframe from an HTML page with a fixed HTTPS origin
The native WebView loads `source={{ html, baseUrl: APP_ORIGIN }}`. `html` is a tiny page holding a full-size `<iframe>` with:
- `src = videoEmbedUrl(id)`, which now appends `&origin=<APP_ORIGIN>`
- `referrerpolicy="strict-origin-when-cross-origin"`
- `allow="autoplay; encrypted-media; picture-in-picture; fullscreen"`

The browser then sends `Referer: APP_ORIGIN/`, which is what YouTube's embed now requires. `APP_ORIGIN` is a hard-coded constant in `media.ts` equal to our Supabase project origin (`https://<project>.supabase.co`), with a comment linking ADR 0016. It must be a domain we control: YouTube identifies the embedding site by it, so a domain owned by someone else would present their site as ours and could break or be misattributed if it changes hands. It is a constant rather than read from `EXPO_PUBLIC_SUPABASE_URL` so the fix also works in local-only and CI builds with no sync configured; the project URL is public anyway.

Two more changes on native:
- `onShouldStartLoadWithRequest` allows the base page (`about:blank` / `APP_ORIGIN`) and the YouTube host. Subframe navigations to `youtube-nocookie.com` and `googlevideo` are subresources and are not routed through it on iOS. On Android, only top-frame navigations are checked.
- `originWhitelist` becomes `['*']` for the HTML source. Navigation is still limited by `onShouldStartLoadWithRequest`.

We rejected `source={{ uri, headers: { Referer } }}`. Android applies custom headers only to the first request and iOS ignores `Referer` there, so it is unreliable.

### 5. Removing placeholders
The `placeholder` fields are deleted from `LessonDef`, the image/video block types, `TheorySpec`, `Mission` and `Fix`, along with every `Badge` that reads them. The catalog keys `media.badge.placeholder` and `lesson.placeholder` are dropped (`catalog-usage.test.ts` will flag leftovers). Deleting the fields, rather than only hiding the badge, makes TypeScript find every use, and nothing else reads them.

The flags were also the only record of what is still a stand-in (today every Mission and Fix, including the `fix/<slug>/<problem>` images). That record moves to `docs/content/stand-in-content.md`, linked from `lesson-guide.md`, in three groups: Missions and Fixes; the Lessons still wanting a YouTube video in Spanish (Decision 9); the five Lesson Animations until each passes its acceptance checks. An item leaves the list when it is final.

### 6. Prompt book shape (`docs/content/lesson-animation-prompts.md`)
1. **How to use**: Gemini app → Video (Veo) or Google AI Studio / Flow. Settings: 16:9, 720p or 1080p, 8 s. Turn audio off, or strip it with `ffmpeg -an`. Attach the listed `<lesson>-anim.png` poster as the starting image.
2. **Shared style block**, pasted first into every prompt: flat paper-cut 2D animation, thick dark-navy ink outlines (#1E2A3A), flat fills, no gradients, warm cream background (#F6EFE0), the honey-coloured mascot dog (#E8B26A / #B9783A / #F6E3C0) and the same person as in the reference image. Gentle, slow, calm motion; locked side-view camera; one idea per clip.
3. **Shared negative block**: no text, letters, numbers or subtitles; no logos; no speech or sound needed to understand it; no photorealism; no 3D; no camera shake; no extra animals or people unless listed; no leash pops or harsh corrections.
4. **One entry per key**: Lesson, caption, the one idea, reference image, a 3-beat timeline (0–3 s / 3–6 s / 6–8 s) naming each beat's id, the **Lines** (word, beat, `voice`), the full ready-to-paste prompt, and acceptance checks. When an entry has Lines, its prompt asks the Person to visibly say a short word at that beat (mouth moves, calm face) with no sound needed and no speech bubble. The beat times in a prompt are targets: Veo does not hit them exactly, so the stored times are measured from the accepted clip. An extra acceptance check makes sure each Line's mouth movement falls within its stored time range. Each entry also holds a ready-to-save **target timeline** block: the exact `docs/content/animations/<key>.json` built from the prompt's beat ids, Lines and target times. That makes the prompt and its timeline one entry, and the conformance test keeps them matching.
5. **Measure timings**: a shared **timing prompt** for Gemini (the app or AI Studio, which can read a video and give timestamps). You attach the exported `<key>.mp4` and paste the entry's target timeline. It asks for the same JSON back: identical ids, `voice` and structure, only `start`/`end`/`duration` changed to what the clip shows, rounded to 0.1 s, as JSON only. A person checks the result by scrubbing the clip to each Line. `parseAnimationTimeline()` and the conformance test reject malformed output. We measure instead of trusting Veo because Veo does not keep to the prompt's times, and a model cannot write the file during video generation.
6. **Export & upload**: `ffmpeg -i in.mp4 -an -c:v libx264 -crf 26 -preset slow -movflags +faststart -vf scale=1280:-2 <key>.mp4`. Save the measured timeline to `docs/content/animations/<key>.json`. Upload both files to `lesson-media/animations/` with `cache-control: max-age=3600`. To replace a clip, overwrite both objects.

A small test (in `conformance.test.ts`) reads the book. It checks that there is a `## <key>` heading for every animation key in `lessonMedia.ts`, and that each entry's beat ids and Lines match `docs/content/animations/<key>.json` (Decision 8).

### 7. A dedicated poster per Lesson Animation
Each clip gets a bundled `assets/lessons/<lesson>-anim.png`, a new scene in `scripts/render-lesson-art.mjs` drawn from the shared kit in the clip's beat-1 pose. It is both the Veo starting image and the animation block's poster, so tapping play continues from the picture already on screen. We rejected reusing `<lesson>-1.png`: it sits a few blocks above the steps, so the reader would see the same picture twice in a screen or two. We rejected `<lesson>-2.png` because its pose does not match any clip's opening.

Shot list (each clip shows one idea, matching the Lesson steps):

| key | Lesson | Caption (es) | Idea / beats | Poster / starting image |
|---|---|---|---|---|
| `calm-leash` | Lo básico de un paseo tranquilo | Correa tensa, te paras; correa floja, seguís | Dog pulls toward a tree, the leash snaps straight → the person stops still like a post → the dog looks back, the leash drops into a J, and they walk on together | `calm-leash-anim.png` |
| `body-language` | Leer el lenguaje corporal | Las primeras señales piden distancia | Relaxed dog sniffing (loose mouth, soft tail) → a skateboarder appears in the distance, and the dog freezes: mouth closed, weight forward, tail high and stiff, lip lick → the person turns calmly and walks away; the dog's body softens and it sniffs again | `body-language-anim.png` |
| `smile-leash` | La correa en sonrisa | Premia la correa en sonrisa junto a tu pierna | Walking with the leash hanging in a smile curve → the person brings a small treat down to the trouser seam at the dog's mouth height → the dog takes it beside the leg and keeps walking close, the leash still curved | `smile-leash-anim.png` |
| `marking-rewarding` | Marcar y recompensar | Primero la marca, después el premio | The dog looks up at the person while the person's hands stay still → a soft ring pulse appears near the person's mouth (the marker, no text) → only then does the hand go to the pocket and deliver the treat | `marking-rewarding-anim.png` |
| `sniffing-decompression` | Olfatear y descomprimir | Deja que elija el rumbo para olfatear | Loose leash in a quiet park with hedges → the dog zig-zags nose-down and lingers at a bush while the person waits still → the dog lifts its head, looks at the person relaxed, and they walk on | `sniffing-decompression-anim.png` |

The animation captions and alt texts go into `es.ts` with these meanings.

### 8. Animation Timeline sidecar and subtitle Lines
Each clip has an **Animation Timeline**, hosted next to it at `animations/<key>.json`:

```json
{ "version": 1, "duration": 8.0,
  "beats": [{ "id": "turn", "start": 0, "end": 3.1 }, ...],
  "lines": [{ "id": "vamos", "start": 4.2, "end": 5.4, "voice": "cue" }] }
```

- **Beats** record when each step of the shot list happens. They are not shown, but they tie the clip to its prompt and give later features (voice, highlights) a time to hook into.
- **Lines** are the short words the Person says. The app draws the active Line as a subtitle over the bottom of the clip. Its text is the bundled catalog key `<prefix>.animation.line.<id>`, so subtitles are translated with the rest of the app and no text from the server is ever shown.
- `voice` (optional) is `'cue'` (the Handler's Cue, see `GLOSSARY.md`) or `'marker'` (the spoken Marker word). This change does not play audio. A later change can play the user's own recording at `start`: `src/shell/voice.ts` already resolves a Cue to the user's recording or the Voice Pack file (`resolveCue`). Recorded Marker words do not exist yet. Audio is always in addition to the subtitle and never replaces it: the Line stays on screen, so the clip works muted and the user sees the word they hear.

The address is built only by `animationTimelineUrl(key)` (base + `/animations/` + key + `.json`, same checks as Decision 2). It is fetched only after the play tap, in parallel with the clip. `parseAnimationTimeline()` rejects files that:
- are over 16 KB, or have a `version` other than 1
- have times that are not finite, or break 0 ≤ start < end ≤ duration ≤ 15
- have beats that are out of order or overlap
- have an id that does not match the key pattern

A Line whose catalog key does not exist is dropped. If the fetch or the parse fails, the clip still plays, just without subtitles, and no error is shown. `activeLine(timeline, t)` is a pure function: it returns the Line with start ≤ t < end, or none. Because `t` restarts on every loop, the subtitles start over too.

Why hosted rather than bundled: a regenerated clip rarely keeps the same beat times, and clips are already replaced by overwrite without a release (Decision 2). The timeline has to travel with its clip. A new Line still needs a release because its text lives in the catalog. We accept that, because it keeps every shown word translatable and out of server data. We rejected putting subtitle text in the sidecar: it would be server text with no translation. We rejected WebVTT for the same reason, and because it has no place for beats or `voice`.

The repo keeps the source of truth at `docs/content/animations/<key>.json`, which is what gets uploaded. It starts as the prompt book's target timeline and is replaced by the measured one from the timing prompt (Decision 6). `conformance.test.ts` runs `parseAnimationTimeline()` on every repo copy. It checks that every key in `LESSON_MEDIA` has one, that every Line has its catalog key, and that each prompt-book entry lists the same beats and Lines.

Lines for the first five clips. The wording follows the Lessons, which use «vamos» as the Cue and «bien» as the Marker word:

| key | Lines |
|---|---|
| `calm-leash` | none (the Person stays silent; timings only) |
| `body-language` | «vamos» (`voice: cue`), as the Person turns and walks away |
| `smile-leash` | «bien» (`voice: marker`), while the leash hangs in a smile, before the treat |
| `marking-rewarding` | «bien» (`voice: marker`), at the ring pulse, with the hands still |
| `sniffing-decompression` | none (timings only) |

### 9. YouTube videos are keyed by language
The first stand-ins were English videos in a Spanish app. A YouTube video has spoken words and is not translated by the catalog, so it only helps in its own language. `LESSON_MEDIA[id].youtube` is therefore `Partial<Record<Language, string>>` (`Language` from `src/shell/voice.ts`, the languages the app ships), and `firstWeekLessons(mediaBase, language)` passes `theoryLesson()` only the id for `language` (default: the shipped language). A Lesson with no id in that language gets no YouTube block, rather than one in another language; Lesson Animations are unaffected because they carry no words. Lessons are built once at module load in the one shipped language; when a second language ships, they are built per active language.

The Spanish picks, approved by the user on 2026-10-31:

| Lesson | YouTube id | Channel | Caption (es) |
|---|---|---|---|
| `calm-leash` | `8Ba10_ycocY` | Centro canino Valentia | Qué hacer si tu perro tira de la correa |
| `body-language` | `76DSS5xNwtk` | SIEMPRECAN | Lenguaje corporal: entender a tu perro más allá de la cola |
| `smile-leash` | `VgnWd0Yu_Rk` | DOS adiestramiento | Consejos para mejorar el paseo con correa |
| `marking-rewarding` | none yet | | |
| `sniffing-decompression` | none yet | | |

We rejected falling back to an English video when no Spanish one exists: a video the user cannot follow is worse than none, and the Lesson Animation already shows the idea.

## Risks / Trade-offs

- [Veo output drifts from the house style or adds text] → Attach the `-anim` poster as the starting image, use the shared negative block, check each clip against its acceptance list, and regenerate. Clips are swappable without an app release by overwriting the same key (short `cache-control`, Decision 2).
- [Veo clips include generated audio] → Strip it in the export step (`-an`). The player is muted anyway.
- [Error 153 also depends on YouTube-side checks of the referrer domain] → Task 4.5 verifies on a real Android and iOS device. If YouTube refuses the Supabase project origin, `APP_ORIGIN` must move to a domain we own (registered for this); it stays a one-constant change, and never a domain we do not control.
- [Third-party YouTube videos are not ours] → The user approved the three Spanish picks (2026-10-31); replacing one is an edit to `lessonMedia.ts`. Lessons without a Spanish video are listed in `docs/content/stand-in-content.md`.
- [Public bucket costs / hotlinking] → Clips are a few MB, fetched only on tap. Supabase egress limits apply. Move to a CDN if usage grows.
- [Removing `placeholder` turns on conformance checks for every Lesson] → The five first-week Lessons are already rewritten. Any failures are fixed in the same change (task 2.3).
- [New native module] → Requires rebuilding the dev client. This is noted in the README and the tasks.
- [A clip is overwritten without its timeline, so the subtitles drift] → The upload steps always send both files. The acceptance checks compare the Lines against the clip. A drifted timeline only mis-times a subtitle and never breaks playback.
- [The sidecar is a second fetch that could fail] → It is small and optional: if it fails, the clip plays without subtitles (Decision 8).

## Migration Plan

1. Ship the code with `EXPO_PUBLIC_MEDIA_BASE` unset. Lessons show only their Spanish YouTube videos (Days 1 to 3), fixed and with no badges.
2. Generate the clips, upload them, and set the base in `.env` / EAS env. The animation blocks appear. Before any clip is uploaded, a tapped animation shows the retry placeholder (404) and the Lesson stays usable.
3. Rollback: unset the base to hide the animations, or revert the commit. No stored user data changes: video blocks are not persisted, and read tracking is keyed by Lesson id.

## Open Questions

- For the later voice change: a Cue Line's subtitle shows the Lesson's word («vamos»), even when the user picked another Voice Pack or recorded their own Cue. Should the subtitle follow the user's Voice Pack then? There is no recorded Marker word yet.
- ~~The exact Supabase project URL.~~ Resolved: `https://fmtcbwhmawhwvjxptjod.supabase.co`, hard-coded as `APP_ORIGIN`; the media base built from it goes in `.env`, not in code.
