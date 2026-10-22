# Tasks

## 1. Navigation model

- [x] 1.1 Add `src/shell/navigation.ts` with a pure `routeFor({ ready, onboardingStep, flow, settingsOpen })` returning splash, funnel, first-stage, map, settings or a flow
- [x] 1.2 Unit tests for `routeFor`: splash until ready, funnel/first-stage win over a left-over flow, map as default, settings and flows over the map, auth returning to Settings when opened from there
- [x] 1.3 Refactor `App.tsx` to render from `routeFor`: replace the `funnelStep` precedence chain, keep `goHome` ending flows, keep the effects keyed on flow names working

## 2. Splash

- [x] 2.1 Add `expo-splash-screen`; configure the native splash in `app.json` (`assets/splash-icon.png`, background matching `bg`) and hold it with `preventAutoHideAsync`
- [x] 2.2 Build `SplashScreen.tsx` (logo, tagline from i18n, short entrance and fade-out; fade only under reduced motion)
- [x] 2.3 Gate on `record` loaded and `useFonts` done (2 s font cap) plus a minimum display time constant (~1.2 s, cold start only, not on resume from background); hide the native splash once the in-app one is up; remove the text-only `LoadingOverlay` from the launch path
- [x] 2.4 Unit-test the "ready to leave splash" decision (record loaded, font loaded or timed out, minimum elapsed)

## 3. Settings return behavior

- [x] 3.1 Keep the map mounted (or its scroll offset restored) when Settings opens and closes
- [x] 3.2 Auth opened from Settings returns to Settings; from the prompt or banner returns to the map

## 4. Reset progress

- [x] 4.1 Add `resetProgress` (pure record part + storage part) in a new `src/shell/reset.ts`: fresh record stamped later than the old `updatedAt`, awaited save, delete custom-cue recordings, clear registration-reminder state and the sync pairing (`dogId`, `lastSyncedAt`, counters); keep `leadmate.ui`, the auth session and the config cache
- [x] 4.2 Unit tests: record is first-run state, `updatedAt` strictly later, UI settings and account keys untouched, custom cues removed, pairing cleared, survives reload (store round trip)
- [x] 4.3 Add the Reset section to Settings (last, danger styling), rendered only when signed out, with a two-step confirmation modal listing what is lost and "cannot be undone"; Cancel is the default, no typing
- [x] 4.4 On confirm: run the reset, then clear session state in `App` (rusty, warm-up, celebrations, reminder, flow, settings) and `replace` the record so the funnel starts at Dog setup
- [x] 4.5 Test: section hidden when signed in (and disappears on sign-in); after a reset, logging in to an account with a Dog gives the choose-Dog prompt, and registering uploads only the reset Dog

## 5. Strings, docs and verification

- [x] 5.1 Add Spanish strings (splash tagline, reset section and confirmation) to `src/i18n/es.ts`; keep the catalog test green
- [x] 5.2 Update `GLOSSARY.md` (Splash and Reset Progress terms are already added) and the README screen overview if it lists screens
- [x] 5.3 Run `npm test` and type-check; smoke the web build and a phone build: cold start → setup → … → Map, Node → Debrief → Map, Settings → reset → setup
- [x] 5.4 `openspec validate app-shell-navigation`
