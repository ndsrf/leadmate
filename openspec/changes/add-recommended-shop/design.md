# Design

## Context

Content Packs are plain files under `content/<channel>/` with flat kind folders (`lessons/`, `nodes/`, `missions/`, `worlds/`), parsed by `src/shell/content/parser.ts`, checked by `validator.ts`, resolved per language by `resolver.ts`, compiled into `baseline.generated.ts` and delivered over the air. Items keep structure in YAML and per-language text in `<lang>.md` (Spanish required, section-level fallback). Interface strings stay in the app. Images are relative paths inside the item's `media/`; absolute addresses are rejected. The World Map header has a Settings `IconChip` (`WorldMapScreen.tsx`). Adverts must never show over simulations (`in-app-adverts`). See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Shop content authored and shipped like every other content kind, with no code change to add or reorder products.
- Link any existing item to shop content with its own explanatory text.
- Best-effort Amazon extraction that saves authors typing, without making the app depend on Amazon at runtime.

**Non-Goals:**
- In-app checkout, cart, orders, stock, live prices or user accounts for the shop. (The basket icon is only the entry point.)
- Runtime scraping or the Amazon Product Advertising API inside the app.
- Personalised recommendations by dog profile or Equipment (Recommendations are authored, not computed; Equipment-aware suppression may come later).
- Per-country markets (language stands in for market) and currency handling beyond a display string.
- Shop-specific analytics beyond what the app already has.

## Decisions

### 1. File layout: flat kind folders, parent owns the order
```
content/<channel>/shop/
  shop.yaml                       categories: [id, ...]  (ordered)
  categories/<cat-id>/            category.yaml (subcategories: [id,...]), es.md (# title, ## description), media/
  subcategories/<sub-id>/         subcategory.yaml (products: [id,...]), es.md, media/
  products/<product-id>/          product.yaml, es.md (# name, ## description), media/
```
`product.yaml`: `source: amazon|manual`, `urls` (map language → https buy link; `es` required; no cross-language fallback, a Product without a link for the user's language is hidden), `price` (display string, optional), `priceCheckedAt` (`YYYY-MM`, optional), `image` (relative path in `media/`, optional).
**Why**: mirrors how Worlds list Stops, keeps "everything of an item together", and reordering is a one-file edit. **Alternative**: nest products inside category folders: rejected because a product could never move or be linked without a move and an id-path change, and ids are global anyway.

### 2. Recommendations live on the linking item, with a closed set of triggers
Lesson/Node/Mission YAML gets an optional `recommendations: [{ id, target: <id>, when: view | poste-trouble | poor-score | problem: <problem-id> }]`; the explanation lives in the item's `<lang>.md` under `## recommendations` / `### <id>`, so the item still holds all its own text and translation fallback works unchanged. The target's kind (product/subcategory/category) is resolved from the shop index because ids are unique across kinds. Triggers reuse signals the app already has: `poste-trouble` = `DogRecord.posteFailures >= 2`; `poor-score` = a graded Stage's handling score `< 200` (constant `POOR_SCORE_BELOW`, next to `starsFor`, below the 650 two-star mark); `problem` = the problem the user picked at a Mission check-in (shown with that problem's Fix). **Alternatives**: a central `shop/recommendations.yaml` – rejected, splits an item's content across places against the content-packs rule; a generic "failed N times" counter – rejected, duplicates `posteFailures` and cannot tell a bad run from a poor one.

### 3. Amazon extraction: author-time CLI, never in the app
Answer to "is it doable?": **partly**. The product page gives name, bullet description, main image and sometimes price through `og:` / JSON-LD / `#productTitle` markup, but Amazon actively blocks automated requests (robot check), changes markup, and its terms restrict scraping and show-prices-from-cache. The official Product Advertising API gives clean data, but needs an Associates account with qualifying sales and its price data may only be shown fresh. So:
- `npm run content:shop-import -- <amazon-url> [--lang <code>] [--sub <id>] [--id <id>] [--overwrite]` fetches with a normal browser User-Agent, parses JSON-LD/OpenGraph first and falls back to known selectors, downloads the main image into `media/` (resized to ≤ 600 px), writes `product.yaml` + `es.md` (a draft the author edits), appends the id to the chosen Subcategory, and prints a field-by-field report. Any Amazon marketplace is accepted; the URL fills `urls.<lang>` (default `es`). Short links (`amzn.to`, `a.co`) are followed to the final URL and the tracking query is dropped.
- Affiliate tags are per marketplace, read from `.env.local` (git-ignored; placeholders in `.env.example`) as `AMAZON_AFFILIATE_TAG_<SUFFIX>` where the suffix is the marketplace domain suffix upper-cased (`ES`, `COM`, `CO_UK`…). Real environment variables win over the file. A missing tag means no `tag=` and a warning. The loader is a small function in the script. No `EXPO_PUBLIC_` prefix, so nothing is bundled into the app; the tag still ends up inside the stored URLs, which is inherent to affiliate links.
- On a robot check or non-200 it writes nothing and says to fill the product by hand. Manual products are first-class.
- Parsing is a pure function over HTML so it is tested against saved fixtures, not the live site.
**Alternatives**: (a) runtime fetch in the app – rejected: blocked, fragile, privacy and policy risk; (b) PA-API – kept as a future upgrade behind the same command if an Associates account exists; (c) manual only – rejected, the user wants extraction.

### 4. Prices are display strings with a disclaimer and a date
Prices go stale in a pack. `price` is a free string ("24,99 €"), optional, rendered as "precio orientativo · <month year>" from `priceCheckedAt`, with a validator warning after 90 days. Never a computed or compared number.

### 4b. Multilanguage: text falls back, buy links do not
Names, descriptions and pictures use the pack's section-level Spanish fallback. Buy links are per market, so `urls` has no fallback: the resolver drops Products with no link for the user's language, then Subcategories and Categories left empty, then any Recommendation whose target vanished. Adding a language to the shop is therefore additive: add `en.md` plus `urls.en`. Language is treated as the market proxy; a per-country setting is a possible later refinement.

### 4c. Fixed interface notes
The disclosure ("recomendaciones, posible comisión") and the health note ("Elige según el tamaño y la salud de tu perro; ante dudas consulta a tu veterinario") are interface strings in `src/i18n/es.ts` and `src/i18n/en.ts`, shown on every Shop screen, and not overridable by a pack.

### 5. Product pictures are hosted with the pack, not hot-linked
The import copies the image into `media/` so it travels with the pack (offline-capable once downloaded, no third-party tracking, no broken hot links). Existing media resolution and the themed placeholder cover load failure. Risk: image licensing (see Risks).

### 6. Navigation and presentation
New Flow screens in `App.tsx`: `shop` with an internal stack `{ level: 'home' | 'category' | 'subcategory' | 'product', id }`. Entry points pass an initial target, which makes a recommendation a deep link. System back pops the stack, then returns to the previous screen; this reuses the back handling the map already has (see change `fix-system-back-overwritten-by-map`, which must land first or be respected). The Shop reads from `getActiveContent()` so it follows the channel and OTA updates; the resolver exposes a `shop` index (ordered tree plus id→kind map).

### 7. Popup component, triggers and limits
One `ShopPopup` (non-modal toast at the top, only itself takes touches, 10 s timer cleared on unmount/dismiss, no timer when a screen reader is on). It takes `{ text, onOpen }`; the general offer and trouble Recommendations both use it. A device-local `shopState` in the existing storage layer (not in `DogRecord`, so no sync or migration) holds: the date of the last shop popup, the general-offer date and ignored count, and per-Recommendation last-shown dates. Rules: at most one shop popup per day overall; trouble beats the general offer; a given Recommendation at most once a day; the general offer at most every 3 days, not on day one, off after 3 ignores. A global gate refuses to show while a Flow of kind stage/minigame/close/lesson is active.
Timing: trouble popups are queued when the attempt ends and shown once the World Map is on screen, after any interstitial the exit would show, so they never stack with an advert. Signals come from `applyStage` (Poste streak, handling score) and the Mission check-in; no new failure counter is added.

### 8. Where link cards render
Lesson screen: a card after the body, before takeaways. Mission screen: a card in the problem list and, for a `problem` trigger, beside that problem's Fix. Node: `view` cards on the intro/result screen only. Max two cards.

## Risks / Trade-offs

- **Amazon blocks/changes markup** → import is best-effort with a report and a manual path; fixtures pin the parser; the app never depends on it.
- **Image/description copyright (Amazon content)** → descriptions are drafted by the author and edited; the importer writes the title and the author rewrites the description; image reuse for affiliate display is permitted under Associates terms only for associates using approved means, so the task list flags a legal/policy check before shipping Amazon images; manual products with own pictures are the safe default.
- **Store policy (Apple/Google) on external purchases of physical goods** → physical goods via external links are allowed; no digital goods are sold. Disclosure of affiliate relation is shown (spec).
- **Stale prices** → "precio orientativo" and optional field.
- **Popup annoyance / ads feel** → rate limits, opt-out after 3 ignores, never during training.
- **Pack size growth from images** → compress to ≤ 600 px wide when importing.
- **Dependency on `fix-system-back-overwritten-by-map`** → mild; tasks include a back-behaviour test.

## Migration Plan

Additive. `formatVersion` stays 1 (new optional folders/fields); older apps ignore the unknown `shop/` tree only if the validator treats it as optional, so bump `minAppVersion` of any pack containing a shop to the first app version that ships it. Rollback: remove the `shop/` tree (or empty `shop.yaml`) and the entry points disappear.

## Open Questions

- Which affiliate programme and tags to use per marketplace (affects only the values of `AMAZON_AFFILIATE_TAG_<SUFFIX>` in `.env.local`).
- Whether 200 is the right `poor-score` threshold; it is a single constant and can be tuned after seeing real handling scores.
- Exact wording of the disclosure and popup texts (Spanish copy reviewed by the author).
