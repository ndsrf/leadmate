# Proposal

## Why

The app's look is a dark slate-and-green game skin (Lilita One, flat raised buttons). A complete design system has been produced in Claude Design ("LeadMate Design System", direction **B · Paper Meadow**: light-first, cut-paper layers, ink outlines, offset shadows, Fredoka display type), covering colour, type, space, depth, motion, components and every key screen, with exportable tokens. Adopting it gives the app a calmer, more distinctive identity that fits a dog-walking product, while the structural work (splash, routing, reset) lands separately in `app-shell-navigation`.

Design source: https://claude.ai/artifact/4hGN8N3SWTKZ3CLbjjJMrP (boards 00–17, `tokens.json` on board 17).

## What Changes

- Replace the design tokens (`src/shell/ui/tokens.json`, Tailwind preset, `theme.ts`) with the Paper Meadow set: colours (`bg #F6EFE0`, `surface #FFFBF1`, `ink #1E2A3A`, `brand #6FAF73`, `accent #F2B84B`, `coral`, `info`, `danger`, `locked`, tension and arousal colours, per-World palettes, coat colours), a `colorNight` variant, radii (6–28), spacing scale, 2.5 px ink borders, depth offsets (rest 4/4, pressed 1/1 + 3 pt travel, focus ring), type scale, motion durations/easings and sizes.
- Switch the display font from Lilita One to **Fredoka 600** (body stays system font).
- Restyle the shared components to the new look: raised ink-outlined buttons with offset shadow that sink on press, panels, chips, pills, stars, toggles and segmented controls, inputs, node markers (completed / next-up / locked), progress bars, the Lead-line divider.
- Restyle the screens, in this order: splash, onboarding funnel, World Map (with Streak / Daily / Settings chips), Node loop (Primer, Checkpoint, Debrief), Daily result, Settings, account screens and banners, Rusty prompt, celebrations, overlays and Stage HUD.
- Replace the app icon and splash art with the designed ones (Migas' head with collar and leash U; sky wash, paper hills, road, Migas).
- Keep the contrast, 44 pt touch-target, reduced-motion and text-expansion rules the design states, and verify them in tests.

Out of scope here (design contains them, but they change behavior or content and need their own decisions): the 16-breed silhouette system and breed step in setup, the Walk Diary calendar screen opened from the Streak chip, Plus-trial copy changes, the world-by-world scenery rework in the simulation bundle, and any tab bar (the design has none).

## Capabilities

### New Capabilities
<!-- none: the revamp changes how existing capabilities look, not what they do -->

### Modified Capabilities
- `game-ui-theme`: the shared identity becomes light-first Paper Meadow (ink-outlined, offset-shadow, Fredoka display) with a night variant; pressed/disabled/focus states are redefined to match.

## Impact

- `src/shell/ui/tokens.json`, `tailwind.config.js`, `theme.ts`, `styles.ts`, `components.tsx`, `Overlays.tsx`, `press.ts`, `mapLayout.ts`, `MinigameProps.tsx`, `canine.ts`; every file under `src/shell/screens/`; Stage HUD tokens consumed by the bundle (`hudTokens`), so the bundle must be rebuilt.
- Existing tests that pin colours/tokens (`theme.test.ts`, `hudTokens.test.ts`, `noRawColors.test.ts`, `ui.test.ts`) are updated to the new values and contrast pairs.
- New dependency `@expo-google-fonts/fredoka` (replacing `@expo-google-fonts/lilita-one`); new app icon/splash assets in `assets/`; `app.json` splash background colour.
- Depends on `app-shell-navigation` for the splash screen component being restyled; can otherwise land independently.
- No gameplay, storage or sync changes.
