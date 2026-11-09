# Tasks

## 1. Schema, parsing and validation of shop items

- [x] 1.1 Add shop kinds and field docs (`shop.yaml`, category, subcategory, product, `recommendations`) to `src/shell/content/schema.ts`; verify with a new case in `schema.test.ts` that the field tables include them.
- [x] 1.2 Extend `parser.ts` to read `shop/` files and the `## recommendations` section of item `es.md`; verify with `parser.test.ts` cases (valid tree, missing Spanish text, bad section).
- [x] 1.3 Extend `validator.ts`: id uniqueness across kinds, missing folders, orphan sub/products, https-only buy links, media path rules, unknown link targets (errors), missing picture / empty category / old `priceCheckedAt` (warnings); verify with `validator.test.ts` covering every scenario in `content-packs`.
- [x] 1.4 Extend `resolver.ts` (including dropping Products with no buy link for the user's language and then empty Subcategories/Categories and orphaned Recommendations) and `build.ts`/`baseline.generated.ts` generation to expose an ordered shop tree, an id→kind index and per-language text with Spanish fallback; verify with `resolver.test.ts` and `parity.test.ts`.
- [x] 1.5 Update `content/FORMAT.md` and `formatGuide.ts` (layout, tables, Recommendation section, import command, worked example); verify `formatConformance.test.ts` passes and fails when a field is removed from the guide.

## 2. Sample catalogue

- [x] 2.1 Add a small beta catalogue (Collares y arneses with 2 subcategories, Camas, Comida; 1–2 manual products with own pictures) and a Recommendation on `poste-practice`; verify `npm run content:validate -- --channel beta` passes with no errors.

## 3. Amazon import command

- [x] 3.1 Write a pure HTML→product extractor (JSON-LD, OpenGraph, `#productTitle`, bullets, price, main image) in `src/shell/content/shopImport.ts` and test it with saved fixture pages including a robot-check page and a page with no price.
- [x] 3.2 Add `scripts/content-shop-import.mjs` and `npm run content:shop-import`: Amazon-domain check (any marketplace), `--lang` filling `urls.<lang>` (default `es`), short-link follow, tracking strip and the per-marketplace affiliate tag read from `.env.local` as `AMAZON_AFFILIATE_TAG_<SUFFIX>` (env vars win; no `EXPO_PUBLIC_` prefix), image download and resize into `media/`, writes `product.yaml`/`es.md`, appends to the Subcategory, `--overwrite` guard, field report; verify with a CLI test using a stubbed fetch for success, partial, blocked, non-Amazon and existing-id cases, plus tag from `.env.local`, tag from the environment overriding it, no tag (with a warning) when that marketplace's tag is unset, and an `.es` tag never applied to a `.com` link.
- [x] 3.3 Document `AMAZON_AFFILIATE_TAG_<SUFFIX>` (author-time only, never bundled) in `.env.example` and the format guide; verify `.env.local` stays git-ignored with `git check-ignore .env.local`.

## 4. Shop state and popup

- [x] 4.1 Add device-local `shopState` (last shop-popup date, general-offer date and ignored count, per-Recommendation last-shown date) in `src/shell/shop.ts` with pure functions `shouldOfferShop` and `shouldShowLink`; verify the one-popup-per-day cap, trouble-beats-general-offer, 3-day cadence, 3-ignore opt-out, per-Recommendation daily limit and training gate in `shop.test.ts`.
- [x] 4.2 Build `ShopPopup` (10 s auto-dismiss, close control, non-blocking, no timeout under a screen reader) and add strings to `src/i18n/es.ts`; verify with fake-timer tests in `ShopPopup.test.tsx` and `npm test -- -t "i18n"`.

## 5. Shop screens and navigation

- [x] 5.1 Build `ShopScreen` (categories → subcategory → product list → product detail, disclosure note, "precio orientativo", picture placeholder) in `src/shell/screens/`; verify with `ShopScreen.test.tsx` for browsing, empty subcategory hiding and missing picture.
- [x] 5.2 Implement the Buy action with `Linking.openURL`, offline and failure messaging; verify with tests that stub `Linking` for success, failure and offline.
- [x] 5.3 Wire the `shop` Flow in `App.tsx` with an initial target (deep link) and back-stack handling returning to the previous screen; verify in `App.test.tsx` that the map scroll position is kept and system back pops levels first.

## 6. World Map entry points

- [x] 6.1 Add the basket `IconChip` next to the gear in `WorldMapScreen.tsx`, hidden when the shop is empty, with an accessible label; verify in `WorldMapScreen.test.tsx` including a narrow-width layout case.
- [x] 6.2 Show the general Shop offer popup on the World Map per the frequency rules and never over simulations/minigames/lessons; verify in `WorldMapScreen.test.tsx` and `App.test.tsx`.

## 7. Recommendations on content

- [x] 7.1 Render `ShopLinkCard` (max two, description + "Ver en la tienda") on Lesson, Mission and Node intro/result screens, ignoring unknown targets; verify in `LessonScreens.test.tsx` and a Node/Mission screen test.
- [x] 7.2 Add `POOR_SCORE_BELOW = 200` beside `starsFor` and evaluate the `poste-trouble` (`DogRecord.posteFailures >= 2`), `poor-score` and `problem` triggers when a Stage or Mission check-in ends; queue the popup until the World Map is shown, after any interstitial; verify in `App.test.tsx` with a Poste failure sequence, a score of 199 vs 200, a Mission problem, and a free-tier exit with an advert.

## 8. Docs and closing checks

- [x] 8.0 Confirm the ADR `docs/adr/0028-shop-products-authored-and-imported-at-author-time.md` and the `GLOSSARY.md` entries (Shop, Shop Category/Subcategory, Product, Recommendation) still match what was built; verify by reading both against the final specs.

- [x] 8.2 Review Amazon Associates / image-use terms and decide the affiliate tag before shipping Amazon products; record the outcome in ADR 0028 (not a code task, blocks publishing Amazon products to stable).
- [x] 8.3 Run `npm test`, `npm run content:validate -- --channel beta` and `npx tsc --noEmit`; verify zero failures, and try the flow on a device or `expo start` (basket → category → product → Buy; Poste struggle popup).
