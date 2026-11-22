# Proposal

## Why

The World Map header currently faces two layout and ergonomic challenges across its two header rows:

1. **Row 1 (Actions & Icons)**:
   - Row 1 mixes a text-bearing pill chip for the Theory Library ("Biblioteca") on the left alongside the Streak pill, while placing icon-only buttons (Settings, Shop, Games) on the right.
   - The text-bearing Library chip takes significant horizontal space, causing line pressure on compact viewports.
   - The Settings gear was historically placed at the start of the right-hand icon cluster, causing it to render to the left of the Shop and Games icons instead of anchoring to the far top-right corner where users expect app settings.

2. **Row 2 (Daily Activity & Status Chips)**:
   - Row 2 displays the `PlusChip`, `Paseo` (Daily Stage score chip), and `BarkdokuChip`.
   - When all three chips are populated (e.g. Plus active + Daily Walk showing "789 de 1000" + Barkdoku showing "0:30 / 3:30 ✓"), the chips consume 370–400 points of width.
   - This occurs because `Chip` values always render in a large 19px display font (`text-button`) with generous padding, the score text uses a verbose `"de 1000"` phrase, and the Plus chip uses a shouting accent highlight and 2-line layout even for users who have already paid.
   - On screens under 400 points (such as standard 360pt devices and 320pt compact viewports), Row 2 wraps onto multiple lines, disrupting the clean map layout.

Refactoring Row 1 into an icon-based cluster and refining Row 2 with compact typography, slash score notation, and quiet active Plus styling guarantees both rows render cleanly on a single line down to 320 points.

## What Changes

### Row 1: Icon Buttons & Header Order
- **Library Icon Button**: Convert the text-based Library chip into a circular icon button (`IconChip`) displaying an ink-drawn book glyph (`BookGlyph`), maintaining the minimum 44pt touch target and localized screen reader announcement (`library.chip`).
- **Library "For Today" Indicator**: Display a visible accent dot indicator on or within the Library icon button when a lesson is marked "for today" (`libraryToday`), and retain the combined accessibility label (`library.chip` + `library.chipToday`).
- **Top-Right Settings Anchor**: Ensure the Settings gear (`GearGlyph`) is anchored at the far top right of Row 1 as the final element in the right-hand icon cluster.
- **Consistent Icon Ordering**: Place the header icon buttons in a logical content-to-system order on the right side of Row 1:
  1. `Library` (Theory / reading lessons)
  2. `Games` (Dog Games minigames, if active content pack contains games)
  3. `Shop` (In-app catalogue / equipment, if shop categories exist)
  4. `Settings` (Application preferences, always anchored at the top right)

### Row 2: Status Chips Compactness & Single-Line Fit
- **Compact Chip Typography**: Update `Chip` in `src/shell/ui/components.tsx` so that when `compact={true}`, the `value` typography scales from `text-button` (19px) down to `text-body` (15px), reducing text width by ~21% across all compact chips.
- **Compact Score Format**: Display the Daily Walk score on the header chip as `${dailyBest}/1000` (slash format) instead of `${dailyBest} de 1000`, while preserving the full spoken description in the screen reader accessibility label.
- **Quiet & Compact Active Plus Chip**: When the user has an active subscription (`isSubscribed`), render `PlusChip` with `compact={true}` and a calm, quiet surface (`highlight={false}`) instead of a prominent accent fill. Apply `compact={true}` during active trial countdowns as well.
- **Single-Line Row 2 on 320pt Screens**: Apply `compact={true}` across `PlusChip`, `Paseo`, and `BarkdokuChip`, ensuring the entire second line fits comfortably on a single line on 320pt screens without wrapping.

## Capabilities

### Modified Capabilities
- `world-map-screen`: Update Map Header requirements and scenarios to specify:
  1. The icon-only Library button with "today" indicator.
  2. The ordered Row 1 icon cluster (`Library` -> `Games` -> `Shop` -> `Settings` anchored at top right).
  3. The compact single-line layout for Row 2 (`PlusChip`, `Paseo` score chip, and `BarkdokuChip`) down to 320 points.
  4. Compact score notation (`{score}/1000`) on the header Daily Stage chip.
  5. Quiet, compact presentation for active/subscribed Plus chips.

## Impact

- **UI Components**: `src/shell/ui/components.tsx` adds `BookGlyph`, indicator badge support on `IconChip`, and compact typography scaling (`text-body` for `value` when `compact={true}`) in `Chip`.
- **WorldMapScreen**: `src/shell/screens/WorldMapScreen.tsx` updates Row 1 layout & order, and updates Row 2 with `compact={true}`, slash score formatting (`${dailyBest}/1000`), and quiet subscribed `PlusChip` styling.
- **Tests**: `src/shell/screens/WorldMapScreen.test.tsx` and `components.test.tsx` update assertions for icon order, score format, and verify non-wrapping layout at 320 points for both Row 1 and Row 2.
- **Dependencies & Backends**: No changes to external dependencies, database schemas, or network APIs.
