# Tasks

## 1. UI Components

- [x] 1.1 Implement and export `BookGlyph` in `src/shell/ui/components.tsx`, rendering an open book SVG with theme palette ink styling; verify with unit test in `src/shell/ui/components.test.tsx`.
- [x] 1.2 Enhance `IconChip` in `src/shell/ui/components.tsx` with optional indicator/badge support (or verify indicator dot composition) for unread/today markers; verify with unit test in `src/shell/ui/components.test.tsx`.
- [x] 1.3 Update `Chip` in `src/shell/ui/components.tsx` so that when `compact={true}`, the `value` typography scales from `text-button` (19px) to `text-body` (15px); verify with unit test in `src/shell/ui/components.test.tsx`.

## 2. WorldMapScreen Header Layout

- [x] 2.1 Convert the text-based Library chip in `src/shell/screens/WorldMapScreen.tsx` Row 1 into an `IconChip` using `BookGlyph`, displaying an accent dot indicator when `libraryToday` is true, with `testID="map.library"` and localized accessibility label.
- [x] 2.2 Restructure the Row 1 layout in `src/shell/screens/WorldMapScreen.tsx` so `StreakChip` is on the left, and the right-hand icon cluster renders strictly in order: `Library` -> `Games` (if games present) -> `Shop` (if shop present) -> `Settings` (anchored at far top right).
- [x] 2.3 Refactor Row 2 chips in `src/shell/screens/WorldMapScreen.tsx`:
  - Pass `compact={true}` to `PlusChip`, `Paseo`, and `BarkdokuChip`.
  - Update `PlusChip` to use `highlight={false}` (quiet surface) when `isSubscribed` is true.
  - Format the Daily Walk score on the Paseo chip as `${dailyBest}/1000` (slash format) while preserving the full spoken description in `accessibilityLabel`.

## 3. Verification & Regression Testing

- [x] 3.1 Update header test cases in `src/shell/screens/WorldMapScreen.test.tsx` to assert the new Row 1 order (`Streak`, `Library`, `Games`, `Shop`, `Settings`) and confirm Settings is always the rightmost icon button.
- [x] 3.2 Add test cases in `src/shell/screens/WorldMapScreen.test.tsx` verifying the Library icon button renders without visible text, triggers `onLibrary`, properly reflects `libraryToday` in accessibility announcements and indicator dot, and remains stable at 320pt width.
- [x] 3.3 Add test cases in `src/shell/screens/WorldMapScreen.test.tsx` verifying Row 2 chips:
  - Daily Walk score displays in slash format (`789/1000`) on the chip face while retaining full accessibility speech.
  - `PlusChip` displays quietly (`highlight=false`) when subscribed.
  - All three Row 2 chips fit in a single line on a 320pt viewport without wrapping.
- [x] 3.4 Run full test suites (`npm test -- src/shell/screens/WorldMapScreen.test.tsx src/shell/ui/components.test.tsx src/i18n/catalog-usage.test.ts`) and verify all tests pass with zero regressions.
