# Hosted Lesson Animations Fetched by Key, and YouTube Embedded From an Origin We Control

Supersedes [ADR 0011](0011-embed-youtube-video-in-lessons.md).

A Lesson Video now plays one of two sources: a **Lesson Animation**, our own short silent clip, or a YouTube video. Lesson Animations are MP4 files on a static https host, in practice a public Supabase Storage bucket `lesson-media`. The app builds a clip address in one place (`animationUrl` in `src/shell/ui/media.ts`) from an explicitly configured base (`EXPO_PUBLIC_MEDIA_BASE`), the fixed folder `animations/`, a key of lowercase letters, digits and `-`, and `.mp4`. Nothing else from Lesson data becomes part of an address. With no base the animation blocks are left out. Phones play clips with `expo-video` (muted, looping, inline, paused when the app leaves the foreground); the web uses a `<video>`. Both sources load only after a tap, as before, and only YouTube blocks show "Plays from YouTube" and "Open video". Clips are made with the prompt book in `docs/content/lesson-animation-prompts.md`.

YouTube on phones failed with "Error 153" because the WebView loaded the bare embed address, so YouTube received no origin and no referrer. The native player now loads a tiny HTML page with `baseUrl: APP_ORIGIN` that holds the embed iframe, and the embed address carries `&origin=APP_ORIGIN`, so YouTube sees an origin and a `Referer`. `APP_ORIGIN` is a hard-coded constant equal to our Supabase project origin. It **must be a domain we control**: YouTube identifies the embedding site by it, so someone else's domain would present their site as ours, and could break or be misattributed if it changed hands. It is a constant, not read from `EXPO_PUBLIC_SUPABASE_URL`, so local-only and CI builds get it too (the project URL is public anyway). If YouTube refuses that origin, it moves to a domain registered for this; it is never replaced by a domain we do not own. It is set to `https://fmtcbwhmawhwvjxptjod.supabase.co`.

Each clip has an **Animation Timeline**, a sidecar JSON hosted next to it (`animations/<key>.json`, built only by `animationTimelineUrl`) and fetched only on the play tap. It records the clip's beats and its **Lines**, the short words the Person says. The app shows the active Line as a subtitle over the clip; its text always comes from the catalog (`<prefix>.animation.line.<id>`), never from the file, so every shown word is translated with the app and no server text reaches the screen. A Line may carry `voice: cue` or `voice: marker`: the hook a later change uses to play the user's own recorded Cue (`resolveCue` in `src/shell/voice.ts`) at the Line's start, always in addition to the subtitle. The timeline is hosted rather than bundled because a regenerated clip rarely keeps its beat times, so it has to travel with the clip; times are measured from the accepted clip with the prompt book's timing prompt. The repo keeps the copy that gets uploaded in `docs/content/animations/<key>.json`, checked by `conformance.test.ts`. A missing or invalid timeline only drops the subtitles.

## Considered Options

- **Bundled clips:** five clips of 2-5 MB each would add 10-25 MB to the app, the problem [ADR 0008](0008-web-hosted-tutorials-and-placeholders.md) avoided.
- **Base derived from the Supabase URL:** a build with sync configured but no clips uploaded would show animation blocks that all fail.
- **MP4 in the WebView:** heavier, poorer error reporting, and pausing needs injected JavaScript. `expo-av` is deprecated.
- **`source={{ uri, headers: { Referer } }}` for YouTube:** Android sends custom headers only on the first request and iOS ignores `Referer` there.
- **Subtitle text in the timeline:** server text with no translation.
- **WebVTT for the Lines:** same problem, and it has no place for beats or `voice`.
- **Instagram as a third source:** it has no supported embedded player (the `/embed` page usually shows a poster and "Watch on Instagram"), and oEmbed needs a Meta app token.

## Consequences

Clips can be replaced without a release by overwriting both objects under the same key, `animations/<key>.mp4` and its timeline `animations/<key>.json` (uploaded with `cache-control: max-age=3600`); a new key, or a new Line, needs a release. `expo-video` is a native module, so dev clients must be rebuilt. Lessons stay readable offline and completable when a clip is missing or fails (the themed placeholder with retry). The "Provisional" badges are gone; what is still a stand-in is tracked in `docs/content/stand-in-content.md`.
