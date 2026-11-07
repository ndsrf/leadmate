# Proposal

## Why

Every World, Lesson, Node and Mission is TypeScript plus Spanish catalog keys compiled into the app, so adding or fixing
a single Lesson means a store release. We want to keep editing and adding content (largely with AI tools such as Claude
Code), test it on an installed app before it reaches everyone, and have apps pick it up when they start, without
shipping a new binary.

## What Changes

- Define the **Content Pack**: a folder of human- and AI-writable files describing the whole trail, its order, its text
  in every language and its media. **Everything of one Lesson (Node, Mission) lives together in one folder**: its
  structure file, one Markdown text file per language, and its images and video references.
- Add a written **format guide** (`content/FORMAT.md`, next to the content) that tells an agent exactly what to create or
  edit, where media and video links go, how to add a language, and how to reorder, with worked examples.
- Add **channels**: `content/beta/` and `content/stable/` are two full packs. Authors work in beta and promote to stable.
  The app has a **Content channel** setting (Stable by default, Beta for testing); changing it reloads content
  immediately, so a build already installed can test beta content.
- Add an authoring toolchain, every command taking `--channel beta|stable`: `content:validate`, `content:build`,
  `content:watch` (dev), `content:promote` (beta → stable) and `content:publish` (upload to public Supabase Storage).
- Add a launch-time updater: the app fetches a small manifest for its channel, downloads only what changed, verifies it
  and uses it from the **next** launch. **Hybrid loading**: manifest, structure and text are fetched eagerly (tiny);
  images and other heavy media per World, current and next World first, with the placeholder until present.
- Per-language text: each language is an extra text file next to the Lesson; a missing language falls back to Spanish.
  Spanish remains the only shipped language. App interface strings (buttons, Settings, HUD) stay in the app.
- Ship the stable pack inside the app as the **baseline** (generated from today's content), so first launch, offline use
  and any rejected update always work. Move the runtime to read Worlds/Lessons/Nodes/Missions/text from the resolved pack.
  Simulation code, Minigame engines and Stage scenario behaviour stay in the app; a pack can only choose among them.
- Keep content ids stable and progress safe: ids are never reused; retired content that a Dog completed keeps counting.

## Capabilities

### New Capabilities
- `content-packs`: the Content Pack format and its per-item folders, languages, channels, the format guide, validation,
  ordering, compatibility versioning and the build/promote/publish workflow used by authors and AI agents.
- `content-updates`: how the app finds, downloads, verifies, caches and activates pack content for the selected channel,
  the Content channel setting, offline behaviour, the bundled baseline and per-World media loading.

### Modified Capabilities
<!-- None: existing specs describe behaviour of the content, which stays the same; only where it comes from changes. -->

## Impact

- Code: `src/shell/world.ts`, `src/shell/lessons/*`, `src/shell/nodes/content.ts`, `src/shell/missions/content.ts`,
  `src/i18n/*` (content keys leave the app catalog), `src/shell/ui/media.ts`, `src/shell/sync/configs.ts`, Settings
  screen, `App.tsx` start-up, new `src/shell/content/*` and `scripts/content-*.mjs`.
- Repo: new `content/{beta,stable}/` and `content/FORMAT.md`; `docs/content/pack-format.md` points to it. New ADR,
  README section, GLOSSARY terms (Content Pack, Channel, Baseline Pack, Manifest). GLOSSARY avoids "Level".
- Infra: a `content` storage bucket migration, `EXPO_PUBLIC_CONTENT_BASE`, a service-role key only in the author's shell.
- No new native module; `expo-file-system` and AsyncStorage are used. No change to the Dog record schema; the channel
  choice is a device setting that is not synced.
- Out of scope: new Minigame kinds or simulation mechanics (still need a release), a language picker (none exists; it comes with the first translation), per-item promotion, a graphical editor, in-session live updates, push-triggered updates.
