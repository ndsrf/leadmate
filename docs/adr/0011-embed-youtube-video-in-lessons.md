# Embed YouTube Video in Lessons, Loaded on Demand

Lessons in the Theory Library play video by embedding YouTube through its privacy-enhanced host (`youtube-nocookie.com`), in a WebView on a phone and an iframe on the web. Nothing is requested from the host until the user taps play: before that a Lesson shows bundled art, a play control, a "Plays from YouTube" label and the caption. Data holds only a bare 11-character video id; the embed address is built in one place from that id and fixed parameters, and any other host is refused. Offline or unavailable embeds fall back to the themed placeholder with a retry and an "Open video" link to the system browser. Terms such as Lesson and Theory Library follow `GLOSSARY.md`; this extends [ADR 0008](0008-web-hosted-tutorials-and-placeholders.md), which keeps the core offline-first.

## Considered Options

- **Bundled video files:** Same size and decoder problems as ADR 0008, multiplied by every Lesson.
- **A YouTube player library (`react-native-youtube-iframe`):** A new dependency for a proof of concept, when `react-native-webview` is already present and the web needs an iframe anyway.
- **Load the embed as soon as a Lesson opens:** Contacts a third party without the user asking and costs data on every open.
- **The in-app browser from ADR 0008 for video:** Unsupported on the web, and likely to fail wherever the embed failed.

## Consequences

Lessons stay fully readable offline; only the video needs a network. The video host sees the user only after a tap, and the label before the tap is the notice. Videos can be removed or region-blocked by their owners, so ids live in one file (`lessonMedia.ts`) for quick swaps and every failure has a visible fallback.
