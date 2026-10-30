# Tasks

Decisions (no design.md; settled in review): the gear is drawn with `react-native-svg` in theme colors (no icon library); it is pinned to the top-right of the Map Header on the first line beside the Streak chip, with the other Status Chips wrapping full-width below (a gear column beside the wrapping chips was tried and measured no shorter: 4 lines at 360px, 3 at 390px); its round face matches the Status Chips' face height (`touchMin - 8`) with a ~20px icon; only the World Map is in scope.

## 1. Gear button component

- [x] 1.1 Add an icon-only `IconChip` to `src/shell/ui/components.tsx` that reuses the `Chip` face (`Raised`, pill radius, surface fill, `touchMin - 8` face height, square so it renders round), `touchTarget` hit slop, `useFocus` ring and `handlePress`, taking `icon`, `onPress` and a required `accessibilityLabel`. Verify `npm run typecheck` passes and `src/shell/ui/noRawColors.test.ts` still passes (colors only from `color`/`theme`).
- [x] 1.2 Add a ~20px gear glyph (SVG, ink stroke on surface, matching the chips' outline weight), hidden from accessibility so only the button's label is announced. Verify by viewing it in the running app (web) next to the Status Chips.

## 2. World Map header

- [x] 2.1 In `src/shell/screens/WorldMapScreen.tsx`, make the header's first line the Streak chip (allowed to shrink) and the gear `IconChip` spaced to the right, keeping `onPress={onSettings}` and `accessibilityLabel={t('map.settings')}`; the other Status Chips wrap full-width below; remove the "Ajustes" `Chip`. Verify with screenshots at 360px and 390px wide that the gear sits top-right and the header is 3 lines at both widths (was 4 and 3).
- [x] 2.2 Extend `src/shell/screens/WorldMapScreen.test.tsx`: a button labelled with the `map.settings` text exists, no visible "Ajustes" text is rendered, and pressing it calls `onSettings`. Verify `npx jest src/shell/screens/WorldMapScreen.test.tsx` passes.

## 3. Integration check

- [x] 3.1 Run `npm run typecheck` and `npm test`, and confirm the Settings round trip in the app: tap gear → Settings opens → back returns to the map at the same scroll position.
