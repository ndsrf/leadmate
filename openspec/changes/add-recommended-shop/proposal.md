# Proposal

## Why

Owners who struggle with a technique (the Poste, loose-leash walking, pulling) often need a physical tool, such as a front-clip harness, a different collar or a bed, and today the app gives them no way to find a trustworthy one. A small, curated shop lets us recommend specific products at the exact moment they would help, in one tap, and it is a new source of revenue for the app (e.g. affiliate links).

## What Changes

- **Shop as a new Content Pack item type**: a three-level catalogue held in plain files in the pack: **Category** (e.g. "Collares y arneses", "Camas", "Comida") with a brief description, **Subcategory** with its own description, and **Product**. Ordering, Spanish-first text with fallback, validation, beta/stable channels and over-the-air updates all work as for Lessons, Nodes and Missions.
- **Product details**: name, description, picture, price and a buy link. A product may declare `source: amazon`, in which case an authoring command imports those details from the Amazon link; otherwise the author writes them by hand.
- **Amazon import (authoring time)**: a new `content:shop-import <url>` command that fetches the product page, extracts name, description, main image and price where available, writes the product folder (including the image into `media/`), and tells the author which fields it could not fill. The app never scrapes Amazon at runtime.
- **Shop screens**: a Shop screen (categories → subcategory → product list → product detail) with a "Buy" button that opens the product's link for the user's language in the system browser. Products with no link in the user's language are hidden.
- **Basket button**: a basket chip at the top of the World Map next to the gear (Settings) chip opens the Shop.
- **Shop offer popup**: a brief non-blocking popup ("¿Quieres visitar la tienda?") that dismisses itself after 10 seconds, with a "Ver tienda" action.
- **Recommendations (links from other content)**: any Lesson, Node or Mission may carry recommendations, each pointing at a product, subcategory or category and carrying its own description text (e.g. "Con un collar como estos hacer el Poste es mucho más fácil…"). A Recommendation surfaces either as a card on the item's screen (`view`) or as the same 10-second popup when the user is in trouble: Poste failure streak of 2, a handling score under 200, or a chosen Mission problem. At most one shop popup a day; tapping it opens the Shop at the target.

## Capabilities

### New Capabilities
- `recommended-shop`: the catalogue (categories, subcategories, products), the Shop screens, the buy hand-off, the Shop offer popup, the basket entry point and the Amazon import authoring command.
- `shop-recommendations`: contextual links from Lessons, Nodes and Missions to shop products, subcategories or categories, with their own description and their trigger rules.

### Modified Capabilities
- `content-packs`: the pack gains the shop item kind, the shop-link field on existing items, and their validation and format-guide coverage.
- `world-map-screen`: the header gains a basket chip next to the Settings chip.

## Impact

- **Content**: new `content/<channel>/shop/` tree (`shop.yaml`, `categories/`, `subcategories/`, `products/`); `content/FORMAT.md` and `src/shell/content/formatGuide.ts` (guide drift test); sample catalogue in beta.
- **Pack code**: `src/shell/content/schema.ts`, `parser.ts`, `validator.ts`, `resolver.ts`, `build.ts`, `baseline.generated.ts`, `scripts/content-validate.mjs`, new `scripts/content-shop-import.mjs`, media resolver for product pictures.
- **UI**: new Shop screens and popup in `src/shell/screens/`, basket chip in `WorldMapScreen.tsx`, routing in `App.tsx`, shop-link cards in Lesson/Node/Mission screens, `src/i18n/es.ts` strings.
- **Platform**: opening external URLs with `Linking`; no new native module. Outbound links add a store-policy/disclosure concern (see design).
- **Docs**: `GLOSSARY.md` (Shop, Category, Subcategory, Product, Recommendation), ADR 0028 for author-time import, no runtime scraping and per-language buy links.
