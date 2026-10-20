# Proposal

## Why

The app's simulation has game feel, but everything around it is plain slate cards and flat buttons: Home is a text list (to become the World Map), results are a table of rows, nothing animates, and the shell and the in-Stage HUD look like two different products. For a learning app that depends on a daily habit, the first impression and the reward moments decide whether users come back. This change makes the whole experience read as one coherent videogame, without changing what is taught or how the simulation scores.

## What Changes

- Add one shared visual identity (colour, type, radius, depth, spacing tokens) used by the shell screens and the Phaser HUD, plus a small set of game-style components (chunky 3D buttons, panels, progress bars, badges) replacing the ad-hoc `className` strings.
- Replace the Home list with the World Map, which becomes the main screen's canonical name: a path of Nodes per World with locked, open, current and completed states, star ratings, a pulsing "next up" Node, and the Streak and Daily Stage as persistent HUD-style chips.
- Add a feedback layer: spring/press animations, screen transitions, haptics, and short UI sounds, all fire-and-forget, all muted by settings, and all disabled or reduced when the system asks for reduced motion.
- Add reward moments: a Node result earns 1-3 stars derived from the Node's handling score (which already blends Slack, composure, Marker accuracy and Sintonía), shown with a count-up and a celebration; new unlocks, a new Streak day and a Daily Stage new best get their own short celebrations.
- Give the Dog a visible presence in the shell (it stands at the next-up Node on the map, and looks Rusty when it is), reusing existing sprite frames. Per-breed images that resemble the user's Dog are a follow-up.
- Keep the pedagogy honest: stars and celebrations reward handling quality (Slack, composure, Marker accuracy, Sintonía), never time spent or taps, and never gate anything; no loss-aversion mechanics (no hearts, no streak-loss shaming).

## Capabilities

### New Capabilities
- `game-ui-theme`: Shared design tokens and game-style components across shell and Stage HUD, including a minimum accessibility contrast and touch-target size.
- `world-map-screen`: The World Map with Node states, star display, next-up highlight and Daily/Streak chips.
- `ui-feedback`: Animations, transitions, haptics and UI sounds with user settings and reduced-motion handling.
- `reward-celebration`: Star rating from Debrief telemetry and the result, unlock, Streak and new-best celebrations.

### Modified Capabilities

(none)

## Impact

- Code: `src/shell/Overlays.tsx`, `src/shell/screens/*`, `App.tsx`, `tailwind.config.js`, new `src/shell/ui/` (tokens, components, feedback), `src/shell/stars.ts`, `src/shell/settings` storage, `bundle/src/overlay.ts` (HUD tokens), `src/i18n/*` (new keys, Spanish fallback).
- Dependencies: `expo-haptics`; optionally `expo-font` with one bundled display font and `expo-linear-gradient`. `react-native-reanimated` is already present.
- Persistence: one new per-Dog `stars` map on the Dog record (merged by max on sync) and two device-local settings flags (UI sounds, haptics). Stars are derived data and do not touch Learning Attributes or the Trigger Profile.
- Builds on `engagement-and-worlds` (World map data, Streak, Daily Stage) and `onboarding-and-accounts` (account banner slot). Simulation determinism ([ADR 0002](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0002-pure-seeded-simulation.md)) is untouched: all new feedback lives in the shell or reads the existing payload.
- Out of scope: new gameplay, a currency or shop, cosmetics, social features and real leaderboards, new art for Worlds 3-4, and any change to scoring.
