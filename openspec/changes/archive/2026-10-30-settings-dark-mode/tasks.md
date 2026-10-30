# Tasks

## 1. Complete the night palette

- [x] 1.1 Add an `outline` colour token to the light set in `src/shell/ui/tokens.json`, equal to `ink` (`#1E2A3A`). Verify with `npm test -- theme` and the existing snapshot tests: light output is unchanged.
- [x] 1.2 Fill every remaining `color` key in `colorNight`, following design decision 4. Verify that `npm test -- theme` passes with the new assertion that the `colorNight` keys cover the `color` keys.
- [x] 1.3 Make `NIGHT_TEXT_PAIRS` in `theme.ts` mirror `TEXT_PAIRS` for the night set, and tune night hex values until each pair meets `MIN_CONTRAST`. Verify that `theme.test.ts` passes.
- [x] 1.4 Regenerate the HUD tokens (`scripts/gen-hud-tokens.mjs`) if they read `tokens.json`. Verify that `hudTokens.test.ts` passes and the HUD output is unchanged, since it stays light.

## 2. Palette plumbing

- [x] 2.1 In `theme.ts`:
  - add `palettes`, `lightColor`, `PaletteProvider` and `usePalette()`;
  - add a helper that builds the NativeWind variable maps (`--c-<token>` as `r g b` channels) for each scheme;
  - remove the static `color` export.

  Verify with a unit test that `usePalette()` returns the night values under a dark provider and that the variable map has one entry per colour token.
- [x] 2.2 Point the colours in `tailwind.config.js` at `rgb(var(--c-<token>) / <alpha-value>)`. Verify that `npm run web` renders unchanged in light mode, including `bg-ink/70` on the reset modal backdrop.
- [x] 2.3 Extend `noRawColors.test.ts`: only the Light-only files may import `lightColor`. Those are `SimView.tsx`, `SimView.web.tsx`, `SplashScreen.tsx`, `Overlays.tsx`, `App.tsx` (Payoff overlay), `art.tsx`, `lessonArt.tsx`, `BreedArt.tsx`, `CanineMinigameAvatar.tsx` and `MinigameProps.tsx`. Verify that the test passes once groups 3–4 land, and fails if another shell file imports `lightColor`.

## 3. Move shell components to the active palette

- [x] 3.1 In `src/shell/ui/components.tsx`:
  - call `usePalette()` in `Raised`, `Panel`, the progress bars, `Chip`, `IconChip`, the gear glyph, `Stars`, `Choice`, `Toggle` and `TextField`;
  - move `PANEL_FILLS` into the component;
  - switch borders and offset shadows from `ink` to `outline`.

  Verify that `npm test -- ui` and the component snapshots pass unchanged in light mode.
- [x] 3.2 Move the UI-chrome files in `src/shell/ui/` to `usePalette()`, with glyph strokes on `outline`: `Pickers.tsx`, `WeightSlider.tsx`, `CelebrationList.tsx`, `LessonImage.tsx`, `LessonVideo.tsx`, `LessonVideoCard.tsx` and `InAppBrowserModal.tsx`. Verify that `npm run typecheck` passes for these files.
- [x] 3.3 Split the illustration files:
  - `lessonArt.tsx`, `BreedArt.tsx` and `CanineMinigameAvatar.tsx` use `lightColor` only.
  - In `art.tsx`, `Migas` and `MeadowBackdrop` use `lightColor` and `LeadLine` uses `usePalette()`.
  - In `MinigameProps.tsx`, the `*Scene` components use `lightColor`, and `CueCaption`, `RoundPips`, `ResultChip`, `TensionGauge`, `MinigameButton`, `ActionButtonRow` and `PawRow` use `usePalette()`.

  Verify that `npm run typecheck` passes, and that a render test under a dark provider shows `BreedArt` fills equal to the Light palette.
- [x] 3.4 Move the screens to `usePalette()`: `WorldMapScreen.tsx`, `DiaryScreen.tsx`, `BarkdokuView.tsx`, `PaywallScreen.tsx`, `IntroScreens.tsx` and `DiagnosticView.tsx`. In Barkdoku, the grid and unsolved silhouettes follow the palette, and zone colours and solved `BreedArt` stay as they are. Keep the world, coat and mascot palettes as they are. Verify that `npm run typecheck` passes for the whole project and `npm test` stays green.
- [x] 3.5 Switch the Light-only regions to explicit `lightColor`: `SimView.tsx`, `SimView.web.tsx`, `SplashScreen.tsx`, every overlay in `Overlays.tsx` and the Payoff Screen overlay in `App.tsx`. Verify that `npm run typecheck` passes, the guard from 2.3 passes, and a render test under a dark provider shows `ResumeOverlay` with Light fills.

## 4. Appearance setting

- [x] 4.1 Add `appearance: 'system' | 'light' | 'dark'` (default `'system'`) to `UiSettings` in `uiSettings.ts`, with tolerant reading. Verify with `uiSettings.test.ts` cases:
  - a missing value reads as `system`;
  - an invalid value reads as `system` and keeps `sounds`/`haptics`;
  - a valid value round-trips through save and load.
- [x] 4.2 In `App.tsx`:
  - resolve the active scheme from `ui.settings.appearance` and `useColorScheme()`;
  - wrap the root in `PaletteProvider` plus a `View` with `vars()`;
  - give each React Native `Modal` (the Settings reset modal and `InAppBrowserModal`) the same `vars()` wrapper if the variables do not reach it.

  Verify on web: toggling the browser or OS dark mode with Appearance set to System restyles the open screen with no reload.
- [x] 4.3 Set `"userInterfaceStyle": "automatic"` in `app.json`. Verify that `npx expo config` shows the new value and the native splash colour is unchanged.
- [x] 4.4 Add an "Apariencia" section to `SettingsScreen.tsx` after "Sonido y vibración": three `Choice` chips wired to `ui.change({ appearance })`, plus a help caption. Add the `settings.appearance*` keys to `src/i18n/es.ts`. Verify with a render test that the three choices are present with catalog labels and that pressing "Oscuro" calls `change` with `{ appearance: 'dark' }`. `catalog-usage.test.ts` must also pass.

## 5. Docs and integration check

- [x] 5.1 Add the **Appearance** entry to GLOSSARY.md and write `docs/adr/0015-appearance-palette-via-css-variables-and-context.md`. Done during the grilling session; both files exist.
- [x] 5.2 Re-read ADR 0015 against the implemented code and fix any drift (file names, token names). Verify that every file the ADR names exists.
- [x] 5.3 Run `scripts/shell.mjs` with a Playwright context set to `colorScheme: 'dark'` and review the screenshots of the map, Settings, a Node with its Debrief, a Lesson, the Diary and Barkdoku. Confirm three things:
  - no panel, chip, field or glyph is drawn in a Light-only colour;
  - the Stage and its overlays stay Light;
  - illustrations and solved Barkdoku dogs are unchanged from the Light screenshots.

  Fix any leftovers, then confirm that `npm test` and `npm run typecheck` pass.

## Workflow follow-up

- Archive the change with `/opsx:archive` after review, so the `game-ui-theme` delta is merged into the main spec.
- Follow-up changes, not tracked here: a dark Splash (native `dark` splash config plus image), and dimmed World Map scenery for the Dark Appearance.
