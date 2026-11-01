# Design

## Context

The World Map header renders a series of status chips and actions above the map's scroll area. Currently, all chips—including the Settings gear icon—are siblings in a single `flex-row flex-wrap` container. The unstarted Plus trial chip displays the value string `"7 días gratis"`, which is wide and forces early line-wrapping. Because the gear icon is rendered between the Plus chip and the Daily Stage chip in that wrapping container, its visual location fluctuates depending on screen width and trial state.

See `proposal.md` for background motivation and `specs/world-map-screen/spec.md` for requirement contracts.

## Goals / Non-Goals

**Goals:**
- Pin the Settings gear icon permanently to the top-right corner of Row 1 in the header bar.
- Structure the header chips cleanly into two rows (Row 1: Streak, Library, Gear; Row 2: Plus, Daily Paseo, Guaudoku) so that Guaudoku never falls into a third row.
- Compact the unstarted trial chip to `"Gratis"` (`'map.plus.trialChip'`).
- Compact the Daily Stage chip label from `"El Paseo del Día"` to `"Paseo"` (`'daily.chip'`) to mirror `"Guaudoku"`.
- Maintain minimum 44pt touch targets for both the gear button and the status chips.
- Ensure all visible text is localized via the catalog and passes the i18n literal checks (`catalog-usage.test.ts`).
- Retain full screen reader accessibility (`accessibilityLabel` announced with full clarity).

**Non-Goals:**
- Modifying the Paywall screen or other full-width buttons that use `"7 días gratis"` (e.g. `paywall.badge` in the locked world preview teaser).
- Altering trial duration, subscription logic, or navigation flows.
- Redesigning the underlying `Screen` layout component.

## Decisions

### 1. Two-row layout for the Map Header
- **Decision**: Structure the header into two distinct rows:
  - Row 1: `flex-row items-center justify-between` containing the left group (`StreakChip`, `LibraryChip`) and the right `IconChip` gear button.
  - Row 2: `flex-row flex-wrap items-center` containing `PlusChip`, Daily Paseo `Chip`, and Guaudoku `BarkdokuChip`.
- **Rationale**: Keeps Row 1 clean and stable, giving Row 2 the full screen width. Because the chips in Row 2 are now compact, all three fit side by side without pushing Guaudoku into an unwanted third row.

### 2. Dedicated localization keys for compact chips
- **Decision**:
  - Use `'map.plus.trialChip': 'Gratis'` in `src/i18n/es.ts` for `PlusChip`'s unstarted value prop.
  - Use `'daily.chip': 'Paseo'` in `src/i18n/es.ts` for the Daily Stage chip label.
- **Rationale**: Short, punchy labels that mirror "Guaudoku" and fit within narrow mobile screens while preserving catalog enforcement and leaving `daily.title` intact for full screens.

### 3. Accessible naming for screen readers
- **Decision**: Keep the `accessibilityLabel` for the unstarted `PlusChip` as `${t('map.plus.chip')}. ${t('paywall.badge')}` (announcing "Plus. 7 días gratis"), and the Daily Stage chip as `t('daily.title')` ("El Paseo del Día").
- **Rationale**: Screen reader users receive the full descriptive context while visual users enjoy the space savings of "Gratis" and "Paseo".

## Risks / Trade-offs

- **[Risk] Test breakage in `WorldMapScreen.test.tsx`**: Existing tests check that `IconChip` appears at index 3 in the DOM pressable order and that `markup` contains `'7 días gratis'`.
  - *Mitigation*: Update `WorldMapScreen.test.tsx` tests to verify the new DOM structure (left chips wrap container + right gear chip) and the new `'7 d gratis'` chip markup.
- **[Risk] Left chips overflow on narrow screens (e.g. 320px)**: Even with `"7 d gratis"`, 5 chips will wrap into 2 rows.
  - *Mitigation*: Flexbox wrapping naturally handles 2 rows on narrow devices, and the pinned gear on the right remains stable in the top row without collision.
