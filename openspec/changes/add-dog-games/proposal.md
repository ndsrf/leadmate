# Proposal

## Why

The app trains the virtual Dog and teaches theory, but owners also want things to *do with their real dog* at home: scent games, impulse-control games, enrichment and small tricks. Those games are a natural reason to open the app on a rainy day and a natural place to recommend a product (a snuffle mat, a cone, a Kong). New games must keep arriving without an app release, so they have to be Content, like Lessons.

## What Changes

- **Dog Games as a new Content Pack item kind**: each game is one folder (`games/<id>/`) with `game.yaml` (order, difficulty, duration, materials, shop links, optional video), a Markdown file per language (intro, materials, steps, tips, safety, alt text per image) and `media/` illustrations. Spanish-first text with fallback, validation, beta/stable channels and over-the-air updates work as for Lessons and Shop items.
- **Games chip on the World Map**: a small icon-only chip next to the Settings gear and the Shop basket opens the Games screen. It is hidden while the active pack has no games.
- **Games screen**: a "random game" button at the top and the list of games below. Tapping a game, or a random pick, opens its detail.
- **Game detail with Plus gate**: a Free user sees the title, the main illustration and the intro; the rest (materials, steps, tips, extra illustrations, shop links) is hidden behind a blurred-looking placeholder with a Plus button on top that opens the paywall and returns to the same game after purchase or trial. Plus users see everything. One game, flagged `free: true` in content, is fully open to everyone (the sample game "Elige mano").
- **Shop links**: a game lists the products or subcategories it needs (`needs` entries that point at a Shop target id), shown in its materials with the existing "Ver en la tienda" action. A game can link to a Subcategory (e.g. snuffle mats) or a single Product.
- **Illustrations**: 16:9 wordless PNGs shipped inside the pack (not the app bundle), with per-image alt text. The first batch of 6 scenes plus an object kit is already drawn in the LeadMate Design System canvas (artboard "Juegos con tu perro — primer lote"); this change exports them to `content/` and adds validation for game media size, ratio and weight.
- **Seed content**: the first 6 games in Spanish and English, plus a "Mantas olfativas" shop Subcategory for the snuffle-mat link.
- **Vocabulary**: GLOSSARY gains **Dog Game** (a real-world activity with the real dog), kept distinct from **Minigame** (a virtual-dog exercise).

## Capabilities

### New Capabilities
- `dog-games`: the Dog Game content kind, the Games screen with random pick and list, the game detail with free sample and Plus gating, shop links, illustrations and safety notes.

### Modified Capabilities
- `content-packs`: the pack gains the `games/` item kind, its fields, validation rules (incl. game media limits) and format-guide coverage.
- `world-map-screen`: the Map Header gains the Games icon chip next to Settings and the Shop basket.
- `app-shell`: system back on the Games screen and the game detail, which keep the World Map mounted beneath.

## Impact

- **Content**: new `content/<channel>/games/` tree; new `content/<channel>/shop` Subcategory and `product` placeholders for the snuffle mat; `content/FORMAT.md` and `src/shell/content/formatGuide.ts` (guide drift test); export of the first 6 illustrations.
- **Pack code**: `src/shell/content/schema.ts`, `parser.ts`, `validator.ts`, `resolver.ts`, `build.ts`, `baseline.generated.ts` and its hashes, `scripts/content-validate.mjs`, media resolver for game pictures.
- **UI**: new `GamesScreen` and `GameDetailScreen` in `src/shell/screens/`, a new glyph and chip in `WorldMapScreen.tsx`, routing and the paywall `then` action in `App.tsx`, `src/i18n/es.ts` and `en.ts` strings, `navigation.ts`.
- **Analytics**: `games` screen name and open/random events in `src/shell/analytics/contract.ts` (coordinate with the in-flight `add-product-analytics`).
- **No new native dependency**: the "blurred" look is built from placeholder bars, so the feature ships over the air with the next normal build.
- **Docs**: `GLOSSARY.md`.
