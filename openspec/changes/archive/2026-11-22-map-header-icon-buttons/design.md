# Design

## Context

In `WorldMapScreen.tsx`, the Map Header consists of two status rows:

1. **Row 1**:
   - Left: `StreakChip` (streak counter / diary launcher) and a text `Chip` for the Theory Library (`value={t('library.chip')}`).
   - Right: `IconChip` components for Settings (`GearGlyph`), Shop (`BasketGlyph`), and Games (`GamesGlyph`).
   - Issues: The text-bearing Library chip consumes excessive horizontal space, and the Settings gear renders first on the right instead of anchored at the top-right corner.

2. **Row 2**:
   - Contains `PlusChip`, the `Paseo` Daily Stage score chip, and `BarkdokuChip`.
   - Issues: When all three chips are active (e.g. Plus active + Daily Walk showing "789 de 1000" + Barkdoku showing "0:30 / 3:30 ✓"), the row requires ~370–400 points of horizontal width.
   - Causes: `Chip` values always render in a large 19px display font (`text-button`) with 12px padding; the walk score uses verbose `"de 1000"` text; and `PlusChip` renders with a prominent 2-line layout and accent highlight even when the user has already subscribed.
   - On viewports below 400 points (such as standard 360pt and compact 320pt screens), Row 2 wraps onto multiple lines.

See `proposal.md` for broader background and motivation.

## Goals / Non-Goals

**Goals:**
- Convert the Library button from a text `Chip` to an `IconChip` with a bespoke ink `BookGlyph` and "for today" accent dot indicator.
- Anchor the Settings gear (`GearGlyph`) to the far top right of Row 1 as the final element in the right-hand icon cluster.
- Place Row 1 icon buttons in semantic order: `Library` -> `Games` -> `Shop` -> `Settings`.
- Scale typography in `Chip`: when `compact={true}`, render `value` with `text-body` (15px) instead of `text-button` (19px).
- Format the Daily Walk score on the header chip as `${dailyBest}/1000` (slash format) while retaining full accessibility speech.
- Style `PlusChip` as a quiet, compact chip (`compact={true}`, `highlight={false}`) when `isSubscribed` is true.
- Guarantee both Row 1 and Row 2 fit on a single line on compact viewports down to 320 points without wrapping.

**Non-Goals:**
- Altering StreakChip appearance, diary opening behavior, or streak calculations.
- Modifying Theory Library, Dog Games, or Shop modal/screen flows.
- Modifying score formats inside the Daily Results or Diary detail screens.

## Decisions

### 1. Dedicated `BookGlyph` component in `src/shell/ui/components.tsx`
- **Choice**: Implement an ink-drawn `BookGlyph({ size = 20 }: { size?: number })` matching the design language of `GearGlyph`, `BasketGlyph`, and `GamesGlyph`. The glyph draws an open book with curved pages using SVG paths:
  ```tsx
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <Path d="M3 5c3-1.5 6-1.5 9 0v14c-3-1.5-6-1.5-9 0z" stroke={color.ink} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M21 5c-3-1.5-6-1.5-9 0v14c3-1.5 6-1.5 9 0z" stroke={color.ink} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
  ```
- **Rationale**: Reuses the visual language established for the map's theory stop icons while adhering to `usePalette()` for theme consistency.

### 2. Badge indicator on `IconChip`
- **Choice**: Extend `IconChip` to accept an optional `badge?: React.ReactNode` prop, or render the badge dot within the icon face container when `libraryToday` is true:
  ```tsx
  <View style={{ position: 'relative' }}>
    <BookGlyph />
    {libraryToday && (
      <View
        testID="map.library.dot"
        className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-game-pill bg-accent"
        style={{ borderWidth: 1.5, borderColor: color.outline }}
      />
    )}
  </View>
  ```
- **Rationale**: Keeps `IconChip` versatile while providing a crisp, non-obtrusive unread/today indicator on the button.

### 3. Row 1 Icon cluster ordering and Top-Right Anchor
- **Choice**: Structure the Row 1 layout with two groups:
  ```tsx
  <View className="flex-row items-center justify-between" style={{ gap: theme.space[1] }}>
    {/* Left: Streak / Diary */}
    <View className="flex-row items-center flex-shrink" style={{ gap: theme.space[1] }}>
      <StreakChip t={t} status={streakStatus(streak, today)} onPress={onDiary} testID="map.diary" />
    </View>

    {/* Right: Icon Buttons in ordered sequence */}
    <View className="flex-row items-center flex-shrink-0" style={{ gap: theme.space[1] }}>
      <IconChip icon={...} onPress={onLibrary} accessibilityLabel={libraryLabel} testID="map.library" />
      {hasGames && <IconChip icon={<GamesGlyph />} onPress={onGames} testID="map-games-button" />}
      {hasShop && <IconChip icon={<BasketGlyph />} onPress={onShop} testID="map-shop-button" />}
      <IconChip icon={<GearGlyph />} onPress={onSettings} testID="map.settings" />
    </View>
  </View>
  ```
- **Rationale**:
  - Orders icons by thematic domain: Content/Learning (Library) -> Practice/Play (Games) -> Commerce (Shop) -> System configuration (Settings).
  - Placing `IconChip` for Settings last guarantees it is anchored to the far top right.

### 4. Compact typography in `Chip` component
- **Choice**: In `src/shell/ui/components.tsx`, update `Chip`:
  ```tsx
  const valueSizeClass = compact ? 'text-body' : 'text-button';
  ...
  <Text className={`font-display ${valueSizeClass} ${highlight ? 'text-onAccent' : 'text-ink'}`}>{value}</Text>
  ```
- **Rationale**: Default `text-button` is 19px, which is too wide for multi-digit scores and time ratios. `text-body` is 15px with Fredoka font, saving ~21% width while preserving legibility and clean proportions.

### 5. Daily Walk score notation on Map Header
- **Choice**: Display `${dailyBest}/1000` (slash format) on the map header chip rather than `${dailyBest} de 1000`. The accessibility label continues to announce `t('daily.title') + ". " + dailyBest + " de 1000"` so screen readers hear the full spoken words.
- **Rationale**: Shaves 3 characters + 2 spaces from the widest string in Row 2, preventing chip expansion.

### 6. Quiet & compact `PlusChip` when active / subscribed
- **Choice**: In `PlusChip`:
  - When `isSubscribed` is true: pass `compact={true}` and `highlight={false}` to `Chip`.
  - When `state === 'active'` (trial): pass `compact={true}` to `Chip`.
- **Rationale**: A user who already paid or is in an active trial does not need a shouting coral highlight or a tall 2-line chip. A quiet paper pill acknowledges their status without stealing focus from daily activities.

### 7. Width Budget on 320pt Viewports

#### Row 1:
- Streak pill: ~105pt
- 4 icon buttons: 4 × 36pt = 144pt
- 3 gaps (4pt each): 12pt
- Screen padding: 2 × 16pt = 32pt
- Total: 105 + 144 + 12 + 32 = **293pt** (fits within 320pt).

#### Row 2:
- Plus chip (`Plus` / `Activo`, compact, 15px font): ~60pt
- Paseo chip (`Paseo` / `789/1000`, compact, 15px font): ~85pt
- Barkdoku chip (`Guaudoku` / `0:30 / 3:30 ✓`, compact, 15px font): ~105pt
- 2 gaps (8pt each): 16pt
- Screen padding: 2 × 16pt = 32pt
- Total: 60 + 85 + 105 + 16 + 32 = **298pt** (fits within 320pt).

## Risks / Trade-offs

- **[Risk] Readability of 15px text in compact chips**
  - *Mitigation*: Fredoka 15px semi-bold has high x-height and clear numerals, maintaining excellent legibility.
- **[Risk] Loss of text recognition for Library ("Biblioteca")**
  - *Mitigation*: A recognizable book glyph is used, full accessibility labels are preserved, and the accent dot indicator flags new lessons.
- **[Risk] Screen reader losing "out of" context with slash notation**
  - *Mitigation*: The `accessibilityLabel` retains the explicit localized phrase `${dailyBest} de 1000`.
