# Design

## Context

Content is code today: `src/shell/world.ts` (Worlds, Stretches, Stops), `lessons/content.ts` (`theoryLesson` builders),
`nodes/content.ts` (`textNode`), `missions/content.ts`, Spanish text in `src/i18n/es*.ts` (a typed `TextKey` catalog
that content refers to by key), and images `require`d through a generated `lessonArtRegistry.ts`. `createTranslator`
already falls back to Spanish for a missing key and `SUPPORTED_LANGUAGES` exists. Hosted media exists (public bucket
`lesson-media`, `EXPO_PUBLIC_MEDIA_BASE`, ADR 0016) and `sync/configs.ts` caches remote Stage config overrides. Stage
simulation and Minigames are code and unchanged. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One data format read by both the app and the authoring tools, with everything of one item together, documented well
  enough that an agent can author valid content from the guide alone.
- Two channels so content can be tested on an installed app before it reaches everyone.
- Launch-time updates that can never leave the app broken, unstable mid-session or unusable offline.
- Existing behaviour and Dog progress unchanged.

**Non-Goals:**
- New simulation mechanics or Minigame kinds (still releases). A pack only selects among supported ones.
- Translating anything now (Spanish only); a GUI editor; background/push updates; moving interface strings out of the app.

## Decisions

**1. Hybrid loading, not all-or-nothing.** Manifest, structure and text are fetched eagerly (tens of KB); media per
World (current, next, then the rest when idle or when opened). *Why:* ordering and unlock logic need the whole structure;
images are the bulk of the size and the only thing that can be late without breaking a screen (placeholder exists).
*Alternatives:* download everything (grows without bound); fully lazy per Node (many requests, unlock logic needs
unloaded data, offline-hostile).

**2. Folder per item; everything together.** Each channel is a complete pack:
```
content/<channel>/                 channel = beta | stable
  pack.yaml                        formatVersion, minAppVersion, languages, retired ids
  worlds/<world-id>.yaml           title/topics keys live in worlds/<id>/<lang>.md; stretches: ordered Stops
  lessons/<lesson-id>/
    lesson.yaml                    structure: kind, steps/takeaways counts, day, images, animation key, youtube ids by language
    es.md                          Spanish text (required); en.md etc. optional
    media/*.png                    this Lesson's images
  nodes/<node-id>/{node.yaml, es.md, media/}
  missions/<mission-id>/{mission.yaml, es.md, media/}
```
`es.md` is Markdown with fixed `##` section headings that map to the existing block types (title, hook, why, steps as a
list, example, do, dont, tip, takeaways as a list, plus image `alt`/`caption` lines keyed by the image file name). No raw
HTML; the parser builds the existing `LessonBlock`s. Videos: `youtube: { es: <id> }` and `animation: <key>` in
`lesson.yaml`; an animation clip itself stays in the media bucket under its key. Images are referenced by file name inside
the folder only. *Why:* an agent opens one folder to read, write, move or delete an item; adding a language adds a file.
*Alternatives:* a central `text/es.yaml` of every key (what the app has now; separates words from structure, hard to
edit and review, a translation touches a 1,000-line file); one big JSON (not AI/diff friendly).

**3. Languages.** A language is any `<lang>.md` file next to the item; `pack.yaml` lists languages in use. The resolver
builds one catalog per language and layers it over Spanish (item-level and section-level fallback), so there is never an
empty or raw-key string. The app downloads Spanish plus the user's language only. Interface strings stay in the typed
app catalog (they need code). The app has no language picker today (`SUPPORTED_LANGUAGES = ['es']`); a picker ships with the first translation, not here.

**4. Channels.** `content/beta/` and `content/stable/` are separate folders in git (a plain copy, not a branch), each
validated, built and published independently with its own `contentVersion` counter and retired list. `content:promote`
validates beta (all-or-nothing in v1; unfinished work stays on a git branch until it is ready for beta), then replaces `content/stable/` with a copy of it (ids and files identical; `contentVersion` is assigned
at build/publish). Beta is where AI edits; stable is what ships as the bundled baseline in the app and what users follow
by default. *Alternatives:* a git branch per channel (can't test without a build; hard to promote file-by-file);
one folder with per-item `channel:` flags (easy to leak unfinished content to stable).

**5. Channel setting and immediate switch.** A device-only setting `contentChannel` (AsyncStorage, never synced in the
Dog record). Default `stable`; dev builds (`__DEV__`) default to `beta`. Changing it calls a `switchChannel(channel)`
that fetches that channel's pointer and manifest, downloads the required set, verifies and validates it, then swaps the
in-memory content provider and persists the choice. On any failure nothing changes and the setting reverts with a message.
This is the one place where content changes during a session, by explicit user action; background updates still wait for
the next launch. Each channel has its own cache and active pointer, so switching back to a cached channel is instant and
works offline. A "Beta content" label shows while beta is selected so a tester cannot forget. In production the control is hidden until
the tester taps the version label in Settings seven times (a device-only `betaUnlocked` flag); dev builds always show it.
Beta content is unfinished, not secret, so a discoverable gesture is enough; no account or code is involved.

**6. Pack ⇄ types.** A pure `content` module (no React) with `parsePack`, `validatePack(pack, { previousManifest? })`
and `resolvePack(pack, language) → { worlds, lessons, nodes, missions, catalog }` yielding today's `WorldDef`/`LessonDef`/
`NodeDef`/`MissionDef`, so screens keep their types. The same code runs in the Node scripts and in the app. The format
guide's field tables are generated from the schema and a conformance test fails if the guide drifts.

**7. Baseline.** A one-time `content:export` writes today's content into the folder layout under `content/beta/`, and the
first promote creates `content/stable/`. A parity test asserts `resolvePack(stable)` deep-equals the current TS content
(Worlds, Lessons, Nodes, Missions, every catalog key for the content) until those modules are deleted, then snapshots
take over. Stable's images are bundled through a generated registry (as `lessonArtRegistry.ts` is now); remote versions
of the same names override the bundled ones.

**8. Storage and addressing.** Public `content` bucket, per channel: `<channel>/latest.json` (points to the current
manifest), `<channel>/packs/<version>/manifest.json`, `<channel>/files/<sha256>.<ext>` (immutable, long cache).
`latest.json` is uploaded last (atomic switch; rollback = repoint). Address built in one place from
`EXPO_PUBLIC_CONTENT_BASE` (https only, like `mediaBase`). `contentVersion` increases monotonically per channel.

**9. Scripts (all take `--channel beta|stable`).** `content:validate` (non-zero exit with file/field/hint),
`content:build` (deterministic manifest + hashed files into `dist/content/<channel>/`), `content:watch` (dev: validate
and rebuild beta on change; `npm start` runs a build of beta), `content:promote`, `content:publish` using
`@supabase/supabase-js` (already a dependency) with the service-role key read from the shell environment, never bundled.
`publish` defaults to `beta`; `--channel stable` prompts to confirm channel and version (`--yes` for CI); `--rollback
<version>` repoints. Unreferenced files older than the last N manifests are pruned.

**10. Dev mode.** In `__DEV__` the app reads the locally built beta pack (served by the dev server from
`dist/content/beta`, `EXPO_PUBLIC_CONTENT_DEV_URL`) and activates it at load, so edit → save → reload works without
publishing. Production builds ignore this variable.

**11. Cache and activation.** Downloads go to staging (`expo-file-system`), each file hash-verified; when the required
set (structure + text + current World media) is complete, a small active pointer per channel flips. A background check
flips only at the next launch; `switchChannel` flips immediately. The previous version is kept as rollback until the next
good activation, then unreferenced files are garbage-collected.

**12. Compatibility and progress safety.** Manifest has `formatVersion` and `minAppVersion`; an older app ignores such a
pack. Dog records reference ids only. Validation compares with that channel's last manifest: dropped ids must be in
`retired`. Progress on content absent from the current channel is kept and ignored. A newly inserted Node in a completed
World never re-locks the next World.

**13. Security.** Pack files are data only; Markdown is parsed to block types (no raw HTML). Addresses must be relative
paths inside the item folder, a hosted animation key, or a YouTube id. Hashes protect against corruption; the bucket is
write-restricted to the service role. Manifest signing is a possible later hardening.

**14. A Node may embed its own Stage scenario.** `node.yaml` may hold a full scenario (the `ScenarioConfig` data the
simulation already takes) or name an existing one with optional overrides; either is checked by `validateScenario`.
New Stages therefore need no release; Minigame engines and new mechanics stay code.

**15. World tier and unlocks are content.** `worlds/<id>.yaml` holds `tier` (free or plus), `preview`, `nodeCount` and
`unlockedBy`, so a preview World can become playable without a release. Who may enter a Plus World is still decided in
app code (Plus entitlement); a pack cannot grant access, only describe the World.

**16. Who publishes.** `content:publish` needs the Supabase service-role key in the author's environment; holding it is the
permission. Beta is routine; stable needs `--channel stable` and the confirmation, which is the guard against accidents.

**17. Existing remote configs.** `sync/configs.ts` Stage config overrides stay separate; a Node may reference a named
scenario with numeric overrides checked by the same `validateScenario`. Merging them is deferred.

## Risks / Trade-offs

- [Large refactor touches every content screen] → parity test first; migrate module by module; keep old modules until parity passes.
- [Bad content published breaks users] → validate in CI and in the app, activate only complete verified packs, keep the previous pack, pointer rollback; beta first.
- [Beta published by mistake to stable] → publish defaults to beta; stable needs an explicit flag and confirmation.
- [Tester left on Beta] → visible "Beta content" label; production default is Stable.
- [Progress made on beta-only content] → kept and ignored on stable (documented, tested).
- [Switch mid-session changes content under the user] → only on explicit user action, from Settings, then screens re-render from the new provider.
- [Markdown dialect drift between AI authors] → strict section schema, validator messages written for agents, worked example in the guide.
- [Two full copies of content in git] → promote is a mechanical copy; a test checks stable is a valid pack; diffs show exactly what was promoted.
- [Storage growth] → prune files unreferenced by the last N manifests.
- [First install shows baseline until a later update] → accepted; Settings → Beta/Stable switch is immediate for testers.

## Migration Plan

1. Build schema, validator, resolver and folder layout against an export of current content; prove parity.
2. Bundle stable as the baseline; switch the app to read the resolved pack; delete the old TS content modules.
3. Create the bucket, publish stable and beta (identical), set `EXPO_PUBLIC_CONTENT_BASE` in a build, add the setting.
4. Rollback: repoint the channel's `latest.json`, or unset the content base in a release (baseline only).

## Open Questions

- Sign the manifest (e.g. Ed25519, public key bundled) later? Does not alter the format.
- A per-item `content:promote --only <id>` if all-or-nothing promotion proves limiting.
