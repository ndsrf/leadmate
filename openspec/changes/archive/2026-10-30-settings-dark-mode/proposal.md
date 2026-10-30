# Proposal

## Why

The app is light-only. Owners often train or review progress in the evening, and the warm paper background is harsh in a dark room. The theme already defines a night colour set, but it is "not yet selectable", and only 7 of its ~30 colour tokens exist. This change finishes that set and lets the user pick it in Settings.

## What Changes

- Add an **Appearance** section to the Settings screen with three choices: **System** (default, follows the phone's light/dark setting), **Light** and **Dark**.
- The choice is device-local and remembered across restarts, stored with UI sounds and haptics (`leadmate.ui`). It is never part of the synced Dog record.
- With System, the app follows the phone's (or browser's) light/dark setting. If the device reports none, it uses Light.
- Changing the choice restyles every full-screen shell screen and its modals at once (World Map, Settings, Debrief, Lessons, Diary, Missions, Minigames, Paywall, Funnel and account screens). No restart is needed. UI chrome follows the choice: buttons, chips, panels, fields, glyphs, and the Barkdoku grid and silhouettes.
- Complete the night colour set so every light colour token has a night value, and every text/background pair the kit draws meets the same contrast minimums in both sets.
- Shell code reads colours from the active palette instead of the fixed light constants. This covers NativeWind classes (`bg-surface`, `text-ink`, …) and the ~240 direct `color.*` uses in inline styles and SVG art.
- **Always Light:**
  - While a Stage is played: the simulation, its HUD and every overlay drawn over it (hints, coach marks, Dog warning, pause, loading, Payoff Screen).
  - The native splash and the Splash, even on a phone set to dark.
  - Each world's header and trail on the World Map, with the Stops, labels and badges drawn on its scenery.
  - Illustrations of the Dog, Handler, scenery and Lesson figures, drawn as they are with no backing card.
- **Unchanged in both Appearances:** colours that carry meaning (Barkdoku zones, lead tension, arousal, world scenery, Dog coats), the app icon and store assets.
- **Follow-ups, not in this change:** a dark Splash, and dimming the World Map scenery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `game-ui-theme`:
  - The identity is no longer light-only. The night variant becomes selectable and complete, and the "Night tokens defined" scenario now covers every light token (today's set has only 7).
  - New requirements cover the Appearance choice (System/Light/Dark, device-local), applying it live to app screens, and the regions that always stay Light.

## Impact

- `src/shell/ui/tokens.json`: complete `colorNight`.
- `src/shell/ui/theme.ts`: add the active-palette mechanism and extend `NIGHT_TEXT_PAIRS` to mirror `TEXT_PAIRS`.
- `tailwind.config.js`, `global.css`: colours become CSS variables so NativeWind classes follow the palette.
- `src/shell/ui/uiSettings.ts`, `useUiSettings.ts`: new `appearance` field with tolerant reading.
- `src/shell/screens/SettingsScreen.tsx`: new Appearance section.
- `App.tsx`: resolves the active scheme and provides the palette at the root.
- 23 shell `.tsx` files that use `color.*` directly move to the active palette. The Light-only regions (`SimView*`, `SplashScreen`, the Stage overlays and the illustration components) use the Light palette explicitly.
- `GLOSSARY.md` (**Appearance**, already added) and `docs/adr/0015-appearance-palette-via-css-variables-and-context.md` (already written).
- `src/i18n/es.ts`: new `settings.appearance*` keys.
- Tests: `theme.test.ts` (night pairs), `uiSettings.test.ts` (reading/defaults), a render test for the Settings section, and a guard that shell files do not import the static light `color` directly.
- No new dependencies. NativeWind 4 already supports CSS variables and colour-scheme detection.
