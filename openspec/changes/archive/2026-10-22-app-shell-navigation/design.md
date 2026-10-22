# Design

## Context

`App.tsx` is the whole shell: one `view: Page` state (`home`, `settings`, `warmup`, `first-stage`, `register`, `auth`, `daily`, `node`) plus a derived `funnelStep` that takes precedence when the persisted onboarding step is still in the funnel. The Phaser simulation lives in a single `SimView` WebView under every screen; screens are absolutely-positioned overlays (`Screen`). `record === null` shows `LoadingOverlay` (plain text). Settings is reached from a chip on `WorldMapScreen`. The Dog record is one JSON blob under `leadmate.dog`; device state lives under `leadmate.ui`, sync state, backup and config-cache keys. A new record is `newDogRecord()` with `onboarding.step = 'setup'`.

The Paper Meadow design (board *09b*) sets the structure: Splash → Dog/breed → reactions → Diagnostic → Plan → trial → **Map (main screen)** with fixed top chips (Streak→Diary, Daily, Settings gear); Node → lesson → Stage → debrief → back to the map; the Simulator has no menu, only Pause. "No hay barra de pestañas."

## Goals / Non-Goals

**Goals:**
- A recognizable launch (splash) followed by the right first screen without a text-only loading flash.
- An explicit, testable routing model so the revamp and later screens do not grow the precedence chain in `App.tsx`.
- A safe, confirmed Reset progress in Settings.

**Non-Goals:**
- No bottom tab bar and no Profile screen (the design rejects them; revisit if the product changes).
- No Diary screen or Streak-chip-opens-Diary behavior, no breed selection, no Plus trial restyle: these belong to the design revamp or later changes.
- No visual restyle beyond what the splash needs; tokens, fonts and component art come from `paper-meadow-ui-revamp`.
- No navigation library migration; no change to the simulation bundle, sync protocol or account deletion.

## Decisions

**1. Pure routing function.** `src/shell/navigation.ts` exports `routeFor({ ready, onboardingStep, flow, settingsOpen })` returning one of `splash | funnel | first-stage | map | settings | flow:<name>`. Funnel and first-stage always win over any left-over flow; `ready` false always yields `splash`. `App.tsx` renders from this value only. Unit-tested table of combinations.

**2. Flows return to the map; Settings and auth remember origin.** `goHome` stays the way out of Node/Daily/warm-up. Auth opened from Settings returns to Settings (small `returnTo` on the auth flow); auth opened from the registration prompt or the map banner returns to the map, as today. The map stays mounted behind Settings so its scroll position is kept, or its scroll offset is stored in a ref and restored.

**3. Splash.** Hold the native splash with `expo-splash-screen` (`preventAutoHideAsync`), hide it once `record` and the display font are ready, and render an in-app `SplashScreen` for a minimum of ~1.2 s from launch, then fade out into the next screen. The result of `useFonts` is now used (currently ignored) so the splash waits for the display font instead of swapping fonts mid-launch, capped at 2 s so a font failure cannot block launch. Reduced motion → fade only. `LoadingOverlay` remains only for bundle loading inside Stages. Until the revamp lands, the splash uses `assets/splash-icon.png` on the current `bg`; the revamp replaces it with the designed splash (sky wash, paper hills, Migas, the Lead underline, tagline "Preparando el paseo…").

**4. Reset lives in Settings.** It is destructive and touches account/device state, so it goes in a last, separated section. A `Modal` confirmation spells out what is lost; Cancel is the default; the destructive button is distinct (danger style).

**5. Reset semantics (see ADR 0009).** Reset is rendered only when `account.signedIn` is false. `resetProgress(store, record)`: delete custom-cue recordings (`deleteRecording`), write `newDogRecord()` stamped via `touch(…, now)`, `await` the save, clear registration-reminder state, and clear the sync pairing (`dogId: null`, `lastSyncedAt: null`, `stagesCompleted: 0`, `lastReminderDate: null`) because sign-out alone leaves `dogId` set and a later sync would union/max-merge the old progress back (ADR 0006, 0007). `App` then clears session state (`rusty`, `warmup`, `celebrations`, `reminder`, flow, settings) and calls `replace(fresh)` only after the awaited save. It keeps `leadmate.ui`, the auth session and the config cache. With pairing cleared, a later login to an account that has a Dog hits the existing `needs-choice` flow (explicit choice, 30-day backup); registering a new account uploads the reset Dog only.

**6. Web build.** Same behavior; `expo-splash-screen` is a no-op on web and `Modal` works under react-native-web.

## Risks / Trade-offs

- **App.tsx refactor risk**: the routing change touches effects keyed on `view.name` (warm-up, first-stage, daily, debrief). Mitigation: keep flow state shape unchanged, only move `home`/`settings`; unit tests for `routeFor`; manual smoke of Node → Debrief → Map.
- **Reset vs cloud**: resetting a signed-in Dog would need a reset generation in the sync merge (rejected for now, ADR 0009), so signed-in users cannot reset; they delete the account first. The pairing must be cleared on reset or sync would resurrect progress.
- **Splash minimum time** adds ~1 s of perceived latency on fast devices; one constant to tune.
- **Design divergence**: the earlier plan for a bottom bar and Profile was dropped to follow the design; if usability testing shows Settings is too hidden, a tab bar can be added later on top of `routeFor`.
- **Assumption**: Spanish is the only shipped language, so only `es.ts` gets strings.
