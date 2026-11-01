# Tasks

## 1. Localization and Compact Chips

- [x] 1.1 Add `map.plus.trialChip` (`'Gratis'`) and `daily.chip` (`'Paseo'`) to `src/i18n/es.ts` and verify `npm test -- src/i18n/catalog-usage.test.ts` passes without literal errors.
- [x] 1.2 Update `PlusChip` (to use `'Gratis'`) and Daily Stage chip (to use `t('daily.chip')`) in `src/shell/screens/WorldMapScreen.tsx`, preserving accessibilityLabels, and update assertions in `src/shell/screens/WorldMapScreen.test.tsx`.

## 2. World Map Header Layout Repositioning

- [x] 2.1 Refactor the header container in `src/shell/screens/WorldMapScreen.tsx` to a two-row layout: Row 1 containing Streak, Library, and the pinned Settings gear button; Row 2 containing Plus, Daily Paseo, and Guaudoku Barkdoku chips.
- [x] 2.2 Update header structure and ordering assertions in `src/shell/screens/WorldMapScreen.test.tsx` to verify the two-row layout and ordering.

## 3. Verification

- [x] 3.1 Run the full test suite for WorldMapScreen and catalog usage (`npm test -- src/shell/screens/WorldMapScreen.test.tsx src/i18n/catalog-usage.test.ts`) and verify clean passes with no layout or type regressions.
