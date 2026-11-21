# Design

## Context

Content Packs are plain files under `content/<channel>/` with one folder per item (`lessons/`, `nodes/`, `missions/`, `shop/`), parsed by `src/shell/content/parser.ts`, checked by `validator.ts`, resolved per language by `resolver.ts`, compiled into `baseline.generated.ts` and delivered over the air. Lessons are the closest precedent: `lesson.yaml` for structure, `<lang>.md` for text, `media/` for pictures, and a Theory Library list screen. The Shop already resolves ids of Products, Subcategories and Categories (`ResolvedShop.idToKind`) and offers `RecommendationCard`/`ShopLinkCard` with an "open the Shop at target" action. The paywall flow accepts a `then` action to resume after purchase (`setFlow({ name: 'paywall', then: { kind: 'video', ... } })`), and Plus is read through `isPlus(record, now)`. Lesson illustrations are bundled in the app (`lesson-illustrations`), which this change must not copy, because games must ship without a release. The "Juegos con tu perro" artboard in the LeadMate Design System canvas holds the first 6 scenes and the object kit.

## Goals / Non-Goals

**Goals:**
- Add a game by dropping a folder in the pack and publishing, with no code change.
- Reuse the Lesson text pipeline, the Shop link action and the paywall resume mechanism.
- Ship the whole feature over the air, with no new native module.

**Non-Goals:**
- Real security of the Plus gate: the full game text travels in the pack, so the gate is a product limit, not DRM. Serving locked text only to Plus users would need a server and is out of scope.
- Progress, favourites, reminders or a diary entry for games.
- Filters on the list or a "smart" random pick (by time, materials or difficulty).
- Video playback work beyond the optional reference field (the existing Lesson video player is reused when a later change adds videos).
- Illustrating the remaining 16 games; they are authored content work after this change.

## Decisions

### 1. File layout: one folder per game, like Lessons
```
content/<channel>/games/<game-id>/
  game.yaml        order, free, difficulty, minutes, images[], needs[], youtube{lang:id}
  es.md  en.md     # Title, ## intro, ## materials, ## steps, ## tips, ## safety, ## images (### <file>), ## shop (### <target-id>)
  media/*.png
```
`needs` lists Shop target ids only; the note for each target is text in the `## shop` section of the language file, so a game still holds all its own words. **Why**: identical authoring habits to Lessons and a one-file diff per game. **Alternative**: one `games.yaml` with every game inline, rejected: a future long list becomes a merge-conflict magnet and per-game media would not travel with its item.

### 2. Order, Free flag and gate live in content
`order` (integer) sorts the list; ties break by id. `free: true` marks the sample game and may be set on more than one game later, which marketing can change with a content update. The gate decision is `game.free || isPlus(record, now)`. **Alternative**: first-N-games-free in code, rejected, it hard-codes a commercial rule and needs a release to change.

### 3. The "blur" is placeholder bars, not a blurred render
No blur library is bundled and adding `expo-blur` needs a native build. Locked content is replaced by rounded bars whose count and widths derive from the hidden text length, drawn in a soft tint with a fade-out, with the Plus button centred over them. **Why**: ships over the air, never paints real text (so zoom or accessibility inspectors cannot read it), and looks the same on iOS, Android and web. **Alternative**: low-opacity real text, rejected, it stays legible and announced. The locked subtree gets `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`.

### 4. Navigation: two flows over the map, paywall resumes the game
New flows `games` (list) and `game` (`id`, `from: 'list' | 'random'`), both layered over the mounted World Map like the Library and Shop, with `navigation.ts` giving each its own back: game → list → map. Paywall gets `then: { kind: 'game', gameId }` so purchase or trial returns to the same game, and a dismissed paywall returns to it locked. **Alternative**: reuse the Lesson flow with a `kind: 'dog-game'`, rejected: Lessons are tied to the Library, day-gating and "for today" logic that games do not have.

### 5. Random pick
Pure function `pickRandomGame(ids, lastId, rng)` returns a random id that differs from `lastId` when more than one exists; `lastId` is kept in memory for the session (no persistence). The RNG is injected, so the test is deterministic. Free users can land on a locked game, deliberately: the intro and illustration are the trailer and the Plus button the conversion point; the free sample keeps the first impression positive.

### 6. Illustrations are pack media, not bundled art
Images resolve through the existing media resolver for pack files (as Shop product pictures do), are downloaded with the content update and show the themed placeholder until then. Validation limits (PNG, 16:9, ≤ 960 wide, ≤ 250 KB) keep the update small: 22 games × 2 images × 250 KB is under 11 MB worst case, usually far less. **Alternative**: bundle the art like Lessons, rejected, it forces a release per game, which is the problem this change exists to avoid.

### 7. Producing the PNGs from the Claude Design canvas
The 6 scenes are inline SVG artboards (640×360). The repo already has the Lesson art kit and `scripts/render-lesson-art.mjs` with palette and no-text checks. Decision: port each scene's SVG into the kit under `scripts/art/games/`, render to `content/<channel>/games/<id>/media/<id>-N.png` at 960×540 and run the same checks, adding the new blue (`#5C8DBE`, `#8DB4DC`) and croquette tones to the palette list if they pass review. **Alternative**: export PNGs straight from the canvas, rejected for now, it skips the palette and no-text checks and the exports would drift from the canvas each time a scene changes; the validator limits above still apply to either route.

### 8. Shop link to the snuffle mat
The snuffle-mat game targets a Subcategory `mantas-olfativas` under the Shop's existing Category set. The Subcategory ships with seed products only when real buy links exist; a Subcategory with no visible product is not shown by the Shop, and the game hides its link (spec: missing target not shown), so the game is never broken by a missing product.

### 9. Safety note as content, enforced by validation
`game.yaml` declares `materials` kinds (`fabric`, `plastic`, `bone`, `food`, `none`...). The validator requires a `## safety` section when the kinds include `fabric`, `plastic` or `bone`. The Kong piece game states a piece larger than the dog's mouth and supervision.

## Risks / Trade-offs

- [Plus gate is easy to bypass by reading the pack] → Accepted; the audience is non-technical and the pack is not browsable on device. Revisit with server-delivered text only if abuse shows in analytics.
- [Free users landing on a locked game via random feel cheated] → The intro and picture stay readable and one fully free sample game exists; measure random→paywall→trial in analytics before changing.
- [Game illustrations missing offline on first launch] → Placeholder fallback; open question below about bundling the sample game's images.
- [Dog safety: fabric, plastic or small Kong pieces] → Mandatory safety note, validator rule, wording reviewed by the author before publishing.
- [Palette drift from the new blue and croquette tones] → Added to the kit palette only after a review of the rendered sheet.
- [Content growth slows the pack update] → Image size limits and the existing "download only what changed" behaviour.

## Migration Plan

1. Ship the code with the first normal release; the Games chip stays hidden because stable has no games.
2. Publish the 6 seed games to **beta**, check them on a device with the beta channel switch, then promote to **stable**; the chip appears with that content update (the pack's `minAppVersion` is set to the release that has the code).
3. Rollback: remove the `games/` folders in a content update; the chip disappears again.

## Open Questions

- Should the free sample game and its images go into the bundled baseline so it shows on a first offline launch? Default in this change: baseline includes game text only; images download. Decide when measuring the baseline size.
- Real buy links for the snuffle mat, cones and Kong are needed from the author; until they exist the Shop links stay hidden.
