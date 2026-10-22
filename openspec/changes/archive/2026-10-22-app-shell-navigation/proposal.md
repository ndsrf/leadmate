# Proposal

## Why

The app has no shell: `App.tsx` swaps screens through a single `view` state, a cold start shows a plain "Loading" text before dropping into setup or the map, and testers have no way to start again from scratch without clearing app data. The new LeadMate design (Paper Meadow, board *09b · App structure and navigation*) fixes the intended structure: Splash → first-run funnel → the World Map as the main screen, with fixed chips for Streak, Daily Stage and Settings, and **no tab bar**. This change builds that structure and the reset; the visual restyle is a separate change (`paper-meadow-ui-revamp`).

## What Changes

- Add a branded **splash** on every cold start (native splash held until the Dog record and display font are ready, then a short in-app splash), replacing the bare loading text. It hands over to the onboarding funnel on first run and to the World Map afterwards.
- Make the navigation model explicit: a pure routing function decides the screen (`splash` → `funnel` | `first-stage` → `map`), with *flows* (Node, Daily Stage, warm-up, Settings, auth/registration) layered over the map and always returning to it. The ad hoc precedence chain in `App.tsx` goes away.
- Keep **Settings** reached from the gear chip on the map (per the design); no bottom tab bar and no separate Profile screen. Dog options (Equipment, coat, Trigger Profile) stay in Settings.
- Add **Reset progress** in Settings, **only while signed out** (hidden for signed-in users): in a clearly separated last section, after an explicit two-step confirmation, erase the Dog's local progress, clear the device's sync pairing and return to Dog setup as a first-run user.

## Capabilities

### New Capabilities
- `app-shell`: splash on launch, launch routing (splash → funnel → map), and the rule that every flow returns to the World Map (Settings and auth return to where they were opened).
- `progress-reset`: resetting a signed-out Dog's progress from Settings, its confirmation, what it clears and keeps, and what happens on a later login.

### Modified Capabilities
- `onboarding-funnel`: the funnel starts after the splash, and a progress reset re-enters it at Dog setup.

## Impact

- `App.tsx` (routing, splash gating), new `src/shell/navigation.ts` and `src/shell/screens/SplashScreen.tsx`, `SettingsScreen.tsx` (reset section).
- `src/shell/dogRecord.ts` / a new `reset.ts`: "fresh record + clear local keys" helper; `useAccount` gets a way to forget reminder/sync state on reset.
- `src/i18n/es.ts`: splash and reset strings.
- `app.json` + dependency `expo-splash-screen` for holding the native splash; splash art from `assets/splash-icon.png` until the revamp replaces it.
- Account sync: reset is unavailable while signed in and clears the sync pairing, so a later login goes through the existing choose-which-Dog prompt; no merge or schema change. New ADR 0009 records this (ADR 0007 had said there is no reset path).
- No simulation or bundle changes. Visual styling of the new pieces uses existing tokens now and is picked up by `paper-meadow-ui-revamp` later.
