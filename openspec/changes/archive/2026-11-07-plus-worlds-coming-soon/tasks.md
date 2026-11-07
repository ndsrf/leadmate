# Tasks

## 1. Copy and glossary

- [x] 1.0 Rename "Preview World" to "Coming-soon World" in `GLOSSARY.md` and add "More-coming card"

- [x] 1.1 Add `world.recall.preview`, `world.cafe.preview`, `world.trails.preview`, `world.crowds.preview` to `src/i18n/es.ts` (one or two sentences each, no dates)
- [x] 1.2 Add end-card keys: title, intro, Plus disclaimer, and 5–6 scenario items (`map.more.*`); add the Plus-user "opens for you automatically" line to the coming-soon card
- [x] 1.3 Review the Spanish copy with the user

## 2. Coming-soon World card

- [x] 2.1 Pass `plus` from `WorldMapScreen` into `WorldBlock`
- [x] 2.2 Split the preview branch (`WorldMapScreen.tsx` ~line 896) into the free teaser (unchanged) and a Plus "Próximamente" card with blurb and planned walk count, no paywall button, keeping the unlock-requirement banner and dropping the Plus button from it
- [x] 2.3 Confirm the card flips when the trial starts or ends with the map open

## 3. More-coming card

- [x] 3.1 Add `MoreComingCard` after the Worlds list: heading, scenario list, Plus disclaimer and paywall button for free users only
- [x] 3.2 Make sure it is not part of `mapModel`, scroll offsets or `allComplete`, and is readable by screen readers

## 4. Tests

- [x] 4.1 `WorldMapScreen.test.tsx`: free vs trial vs subscribed preview card; no paywall button for Plus; trial start/end flips the card
- [x] 4.2 `WorldMapScreen.test.tsx`: end card for free and Plus users
- [x] 4.3 Check `catalog-usage.test.ts` passes with the new keys
- [x] 4.4 Run the full test suite and typecheck
