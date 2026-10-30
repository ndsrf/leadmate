# Design

## Context

Shell colours reach the screen two ways today, and both are fixed to the light set at build time:

1. **NativeWind classes.** `tailwind.config.js` spreads `tokens.color` into `theme.extend.colors`, so `bg-surface`, `text-ink`, `bg-ink/70`, … compile to literal hex values.
2. **Direct JS constants.** `color` from `src/shell/ui/theme.ts` (`tokens.color`) appears about 240 times across 23 `.tsx` files. These are inline styles (`Raised` fills and shadows, `Toggle`, `TextField`, progress bars) and `react-native-svg` fills in art (`art.tsx`, `lessonArt.tsx`, `BreedArt.tsx`, map chips, Barkdoku).

`tokens.colorNight` has only 7 keys (`bg`, `surface`, `surfaceSunken`, `edge`, `ink`, `inkMuted`, `outline`). `NIGHT_TEXT_PAIRS` checks only those. `noRawColors.test.ts` already forbids hex and Tailwind palette literals in shell files, so every colour already goes through a token. That makes a palette swap mechanical.

Device-local UI preferences live in `leadmate.ui` (`uiSettings.ts`) and are loaded once in `App.tsx` via `useUiSettings`. `app.json` sets `"userInterfaceStyle": "light"`, so the OS reports `light` to the app no matter what the phone is set to.

The Stage HUD takes its colours from generated tokens (`scripts/gen-hud-tokens.mjs`) and draws inside the Phaser WebView. Neither touches the shell classes.

## Goals / Non-Goals

**Goals:**
- One switch point: a resolved scheme (`light` | `dark`) at the app root drives both NativeWind classes and JS colours.
- Screens stay token-driven. Switching needs no per-screen `dark:` variants.
- The night set is complete and contrast-checked by the same test as the light set.

**Non-Goals:**
- A dark Stage, Stage overlays, HUD, world scenery, illustrations or Splash (see spec, "Light-only regions"). A dark Splash and dimmed World Map scenery are recorded follow-ups.
- A light backing card behind illustrations on dark surfaces. They are drawn as they are.
- Per-screen overrides or a third theme.
- Theming the native status/navigation bars beyond what Expo does by default. The status bar is hidden in-app.

## Decisions

### 1. Colours become CSS variables for NativeWind
- Change `tailwind.config.js` so each colour token maps to `rgb(var(--c-<token>) / <alpha-value>)`. Keeping channel form makes alpha modifiers like `bg-ink/70` work.
- A helper in `theme.ts` builds both variable maps (light and night) from `tokens.json`.
- The root `View` in `App.tsx` applies the active map with NativeWind's `vars()`.

*Alternatives:*
- `dark:` variants on every class. Rejected: it touches every `className`, it is easy to miss one, and it duplicates what the tokens already encode.
- NativeWind `colorScheme.set` alone. Rejected: it only drives `dark:` variants, which is the option above.

### 2. JS colours come from a palette context
- `theme.ts` exposes `palettes = { light: tokens.color, dark: tokens.colorNight }`, a `PaletteProvider`, and a `usePalette()` hook that returns the active palette with the same keys as `color`.
- Components that use `color.*` switch to `const color = usePalette()` at the top of the component. Inside the component body the call sites stay as they are.
- Module-level uses must move into the component or take the palette as an argument. Known ones: `PANEL_FILLS` in `components.tsx` and the `StyleSheet.create` in `SimView.tsx`.
- **Light-only regions** do not take the active palette. Their roots render inside `LightRegion` (a Light `PaletteProvider` plus the Light `vars()`), so classes and `usePalette()` below them read Light; direct colours import the light set explicitly as `lightColor`, so it is clear in review that they stay light (see ADR 0015 and the spec's "Light-only regions"):
  - the simulation host (`SimView*`);
  - the Splash (`SplashScreen.tsx`);
  - each world's header and trail on the World Map: they sit on the Light world scenery, so the Stops, labels and badges drawn on it stay Light too;
  - every overlay rendered while a Stage plays: the components in `Overlays.tsx`, and the Payoff Screen overlay in `App.tsx`;
  - illustration components: `Migas` and `MeadowBackdrop` in `art.tsx`, `LessonArt`, `BreedArt`, `CanineMinigameAvatar`, and the `*Scene` components in `MinigameProps.tsx`.
- **Mixed files.** `art.tsx` and `MinigameProps.tsx` contain both illustrations and UI chrome (`LeadLine`, `MinigameButton`, `ResultChip`, `TensionGauge`, …). They import both: illustrations use `lightColor`, UI chrome uses `usePalette()`.
- **Barkdoku.** The board, grid lines and unsolved silhouettes are UI chrome. A solved zone's `BreedArt` stays Light. Zone colours are meaning-carrying and identical in both palettes.
- **The Stage HUD** lives in the WebView with its own generated tokens and is untouched.
- The static `color` export is removed from `theme.ts`. A shell file that still imports it then fails to compile, rather than silently staying light.

*Alternatives:*
- A mutable module-level `color` object swapped on change. Rejected: memoised components and `StyleSheet` caches would not re-render, leaving light leftovers.
- `useColorScheme()` plus a lookup in every component. Rejected: it spreads the scheme-resolution logic around the codebase.

### 3. Outline and shadow get their own token
- Ink outlines and solid offset shadows use `color.ink` today. In the night set `ink` is light text (`#F6EFE0`), so outlines and shadows would turn cream.
- Add `outline` to the light set, equal to today's ink `#1E2A3A`. Night already defines `outline: #0B0F1A`.
- Switch borders and shadows to `outline` in `Raised`, `ProgressBar`, `Toggle`, `TextField`, the map chips and UI glyph strokes. Text keeps `ink`. Illustrations keep `lightColor.ink` strokes.
- Light output is pixel-identical because `outline === ink` there.

### 4. Night values for the rest of the set
- Fill every remaining `color` key in `colorNight`.
- Surfaces and text are already defined.
- `brand`, `accent`, `coral`, `info`, `danger`, `star`, `flame` and `sintonia` keep their hue but are tuned for a dark ground:
  - `*Text` tokens get lighter so they read on a dark surface.
  - `*Soft` tokens become dark tints (for example, `accentSoft` becomes a deep amber).
  - `on*` tokens are re-picked against their fill.
  - `locked` and `disabled` use the sunken surface.
- `NIGHT_TEXT_PAIRS` becomes the same list as `TEXT_PAIRS`, keyed to the night set. `theme.test.ts` asserts that `Object.keys(colorNight)` covers `Object.keys(color)`, so a future light token without a night value fails the test.

### 5. Resolving the scheme
- `UiSettings` gains `appearance: 'system' | 'light' | 'dark'`, defaulting to `'system'`.
- `readUiSettings` drops unknown values to the default and keeps the other fields. This follows the existing tolerant-read pattern.
- `App.tsx` resolves the scheme as `appearance === 'system' ? (useColorScheme() ?? 'light') : appearance`. A device or browser that reports no preference therefore gets Light. It passes the result to `PaletteProvider` and `vars()`.
- `app.json` sets `"userInterfaceStyle": "automatic"`, so the OS reports the phone's real scheme and live changes reach the app.
- Before `leadmate.ui` loads, the hook default (`system`) applies. That matches the eventual value for most users and avoids a light-to-dark flash.

### 6. Settings UI
- An "Apariencia" `Section`, placed after "Sonido y vibración", holds three `Choice` chips (Sistema / Claro / Oscuro) plus a caption saying the setting is only for this device.
- It uses the existing `ui.change` path, so no new prop is needed.
- New i18n keys:
  - `settings.appearance`
  - `settings.appearance.system`
  - `settings.appearance.light`
  - `settings.appearance.dark`
  - `settings.appearance.help`

## Risks / Trade-offs

- **[Large mechanical diff across 23 files]** → The edit is a hook call at the top of each component, done per file. A test guards that no shell file outside the allowed list (`SimView*`, `SplashScreen`) imports `lightColor`. Existing snapshot tests show the light output is unchanged.
- **[Module-level colour constants missed]** → Grep for `color.` outside function bodies during the change. Removing the static `color` export makes leftovers fail to compile.
- **[Light illustrations lose their dark outline against navy surfaces]** → This was accepted in the grilling session: the cream fills still read. A screenshot pass with `scripts/shell.mjs` running under Playwright's `colorScheme: 'dark'` (System appearance follows it) catches the worst cases. Tuning beyond that is follow-up work, not a blocker.
- **[NativeWind `vars()` on web vs native differences]** → Verify on web (the main dev target) and on one native build. If variables do not reach portals or modals, render `Modal` content inside its own `vars()` wrapper. React Native `Modal` mounts a new root.
- **[`userInterfaceStyle: automatic` changes native chrome]** → The status bar is hidden, and the native splash colour is fixed in the plugin config, so there is no visible effect at launch.
- **[Light Splash fades into dark screens on a dark phone]** → Accepted. The Splash's exit fade softens it, and a dark Splash is a follow-up.

## Migration Plan

- No data migration. Existing `leadmate.ui` blobs lack `appearance`, so they read as `system`.
- Rollback: revert the change. A stored `appearance` is ignored by the old reader.

## Open Questions

- Exact night hex values for the accent family. These are picked during implementation against the contrast test and a screenshot review. They do not affect the approach.
